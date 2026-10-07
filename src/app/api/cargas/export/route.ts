import { LoadStatus, MovementType, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { formatDate, movementLabels, statusLabels } from "@/lib/format";
import { requireSession } from "@/lib/permissions";

function buildWhere(searchParams: URLSearchParams): Prisma.CargaWhereInput {
  const q = searchParams.get("q")?.trim();
  const estado = searchParams.get("estado") as LoadStatus | null;
  const tipo = searchParams.get("tipo") as MovementType | null;
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
  return where;
}

export async function GET(request: NextRequest) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;

  const cargas = await prisma.carga.findMany({
    where: buildWhere(request.nextUrl.searchParams),
    include: { createdBy: { select: { name: true, username: true } } },
    orderBy: { fecha: "desc" },
    take: 5000,
  });

  const rows = cargas.map((carga) => ({
    Estado: statusLabels[carga.estado],
    Fecha: formatDate(carga.fecha),
    Tipo: movementLabels[carga.tipoMovimiento],
    "NBI entrega": carga.nbiEntrega ?? "",
    "NBI recepción": carga.nbiRecepcion ?? "",
    "Código artículo": carga.codigoArticulo,
    Descripción: carga.descripcionArticulo,
    Lote: carga.lote ?? "",
    "Cantidad prevista": Number(carga.cantidadPrevista),
    "Cantidad realizada": Number(carga.cantidadRealizada),
    Pendiente: Number(carga.cantidadPrevista) - Number(carga.cantidadRealizada),
    Origen: carga.ubicacionOrigen ?? "",
    Destino: carga.ubicacionDestino ?? "",
    OF: carga.ordenFabricacion ?? "",
    Comentario: carga.comentario ?? "",
    Usuario: carga.createdBy.name || carga.createdBy.username,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Cargas");
  const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
  const today = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="cargas-${today}.xlsx"`,
    },
  });
}
