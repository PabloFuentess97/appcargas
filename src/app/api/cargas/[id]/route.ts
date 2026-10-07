import { AuditAction, Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWrite, canDelete } from "@/lib/permissions";
import { auditSafeCarga, serializeCarga } from "@/lib/carga-serialize";
import { cargaSchema } from "@/schemas/carga";

const includeUsers = {
  createdBy: { select: { id: true, name: true, username: true } },
  updatedBy: { select: { id: true, name: true, username: true } },
  deletedBy: { select: { id: true, name: true, username: true } },
  voidedBy: { select: { id: true, name: true, username: true } },
} satisfies Prisma.CargaInclude;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireSession();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const carga = await prisma.carga.findUnique({ where: { id }, include: includeUsers });
  if (!carga || carga.deletedAt) return NextResponse.json({ error: "Carga no encontrada." }, { status: 404 });

  const audit = await prisma.auditLog.findMany({
    where: { entity: "Carga", entityId: id },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({ data: serializeCarga(carga), audit });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWrite();
  if ("error" in auth) return auth.error;
  const { id } = await params;

  const oldCarga = await prisma.carga.findUnique({ where: { id } });
  if (!oldCarga || oldCarga.deletedAt) return NextResponse.json({ error: "Carga no encontrada." }, { status: 404 });

  const body = await request.json();
  const parsed = cargaSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa los datos introducidos.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const statusChanged = parsed.data.estado && parsed.data.estado !== oldCarga.estado;
  const carga = await prisma.carga.update({
    where: { id },
    data: { ...parsed.data, updatedById: auth.session.user.id },
    include: includeUsers,
  });
  await prisma.auditLog.create({
    data: {
      userId: auth.session.user.id,
      entity: "Carga",
      entityId: id,
      action: statusChanged ? "STATUS_CHANGE" : "UPDATE",
      oldData: auditSafeCarga(oldCarga),
      newData: auditSafeCarga(carga),
    },
  });

  return NextResponse.json({ data: serializeCarga(carga), message: "Cambios guardados." });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWrite();
  if ("error" in auth) return auth.error;
  if (!canDelete(auth.session.user.role)) {
    return NextResponse.json({ error: "Solo administración puede eliminar cargas." }, { status: 403 });
  }
  const { id } = await params;

  const oldCarga = await prisma.carga.findUnique({ where: { id } });
  if (!oldCarga || oldCarga.deletedAt) return NextResponse.json({ error: "Carga no encontrada." }, { status: 404 });

  const carga = await prisma.carga.update({
    where: { id },
    data: { deletedAt: new Date(), deletedById: auth.session.user.id },
  });
  await prisma.auditLog.create({
    data: {
      userId: auth.session.user.id,
      entity: "Carga",
      entityId: id,
      action: AuditAction.DELETE,
      oldData: auditSafeCarga(oldCarga),
      newData: auditSafeCarga(carga),
    },
  });

  return NextResponse.json({ message: "Carga eliminada correctamente." });
}
