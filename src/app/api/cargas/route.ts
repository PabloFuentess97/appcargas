import { LoadStatus, MovementType, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import type { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWrite } from "@/lib/permissions";
import { auditSafeCarga, serializeCarga } from "@/lib/carga-serialize";
import { bulkCargaSchema, cargaSchema } from "@/schemas/carga";

const includeUsers = {
  createdBy: { select: { id: true, name: true, username: true } },
  updatedBy: { select: { id: true, name: true, username: true } },
} satisfies Prisma.CargaInclude;

type BulkRequestBody = {
  common?: unknown;
  rows?: Array<Record<string, unknown>>;
};

function compactBulkPayload(body: unknown): BulkRequestBody {
  if (!body || typeof body !== "object" || !("rows" in body) || !Array.isArray((body as { rows: unknown }).rows)) {
    return body as BulkRequestBody;
  }

  const payload = body as { common?: unknown; rows: Array<Record<string, unknown>> };
  return {
    ...payload,
    rows: payload.rows
      .map((row, index) => ({ ...row, __lineNumber: index + 1 }))
      .filter((row) =>
        [
          "codigoArticulo",
          "descripcionArticulo",
          "lote",
          "cantidadPrevista",
          "ubicacionOrigen",
          "ubicacionDestino",
          "ordenFabricacion",
          "comentario",
        ].some((key) => String((row as Record<string, unknown>)[key] ?? "").trim() !== ""),
      ),
  };
}

function rowIssuesFromError(error: ZodError) {
  return error.issues
    .filter((issue) => issue.path[0] === "rows" && typeof issue.path[1] === "number")
    .map((issue) => ({
      row: Number(issue.path[1]) + 1,
      field: String(issue.path[2] ?? "línea"),
      message: issue.message,
    }));
}

function buildWhere(searchParams: URLSearchParams): Prisma.CargaWhereInput {
  const q = searchParams.get("q")?.trim();
  const estado = searchParams.get("estado") as LoadStatus | null;
  const tipo = searchParams.get("tipo") as MovementType | null;
  const usuario = searchParams.get("usuario")?.trim();
  const fechaDesde = searchParams.get("fechaDesde");
  const fechaHasta = searchParams.get("fechaHasta");

  const where: Prisma.CargaWhereInput = { deletedAt: null };
  if (q) {
    where.OR = [
      "codigoArticulo",
      "descripcionArticulo",
      "lote",
      "ordenFabricacion",
      "nbiEntrega",
      "nbiRecepcion",
      "ubicacionOrigen",
      "ubicacionDestino",
      "comentario",
    ].map((field) => ({ [field]: { contains: q, mode: "insensitive" } })) as Prisma.CargaWhereInput[];
  }
  if (estado && Object.values(LoadStatus).includes(estado)) where.estado = estado;
  if (tipo && Object.values(MovementType).includes(tipo)) where.tipoMovimiento = tipo;
  if (usuario) where.createdById = usuario;
  if (fechaDesde || fechaHasta) {
    where.fecha = {};
    if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
    if (fechaHasta) where.fecha.lte = new Date(`${fechaHasta}T23:59:59`);
  }
  return where;
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const { searchParams } = request.nextUrl;
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(100, Math.max(25, Number(searchParams.get("pageSize") || 25)));
  const sort = searchParams.get("sort") || "fecha";
  const dir = searchParams.get("dir") === "asc" ? "asc" : "desc";
  const sortable = new Set(["fecha", "codigoArticulo", "ordenFabricacion", "estado", "cantidadPrevista", "createdAt"]);
  const where = buildWhere(searchParams);

  const [total, cargas, usuarios] = await Promise.all([
    prisma.carga.count({ where }),
    prisma.carga.findMany({
      where,
      include: includeUsers,
      orderBy: { [sortable.has(sort) ? sort : "fecha"]: dir },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.findMany({
      select: { id: true, name: true, username: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return NextResponse.json({
    data: cargas.map(serializeCarga),
    meta: { total, page, pageSize, pages: Math.max(1, Math.ceil(total / pageSize)) },
    usuarios,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireWrite();
  if ("error" in auth) return auth.error;

  const body = compactBulkPayload(await request.json());
  const isBulk = Array.isArray(body.rows);
  if (isBulk) {
    const parsed = bulkCargaSchema.safeParse(body);
    if (!parsed.success) {
      const rowIssues = rowIssuesFromError(parsed.error);
      return NextResponse.json({
        error: rowIssues.length
          ? `Hay ${rowIssues.length} error(es) en las líneas. No se ha guardado ninguna carga.`
          : "Revisa los datos introducidos.",
        issues: parsed.error.flatten(),
        rowIssues,
      }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const created = [];
      for (const row of parsed.data.rows) {
        const carga = await tx.carga.create({
          data: {
            ...parsed.data.common,
            ...row,
            ubicacionDestino: row.ubicacionDestino || parsed.data.common.ubicacionDestino,
            ordenFabricacion: row.ordenFabricacion || parsed.data.common.ordenFabricacion,
            estado: "PENDIENTE",
            createdById: auth.session.user.id,
          },
        });
        await tx.auditLog.create({
          data: {
            userId: auth.session.user.id,
            entity: "Carga",
            entityId: carga.id,
            action: "CREATE",
            newData: auditSafeCarga(carga),
          },
        });
        created.push(carga);
      }
      return created;
    });

    return NextResponse.json({ message: `${result.length} cargas registradas correctamente.`, count: result.length });
  }

  const parsed = cargaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa los datos introducidos.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const carga = await prisma.carga.create({
    data: { ...parsed.data, createdById: auth.session.user.id },
    include: includeUsers,
  });
  await prisma.auditLog.create({
    data: {
      userId: auth.session.user.id,
      entity: "Carga",
      entityId: carga.id,
      action: "CREATE",
      newData: auditSafeCarga(carga),
    },
  });

  return NextResponse.json({ data: serializeCarga(carga), message: "Carga creada correctamente." }, { status: 201 });
}
