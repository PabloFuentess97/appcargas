import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auditSafeCarga, serializeCarga } from "@/lib/carga-serialize";
import { requireWrite } from "@/lib/permissions";
import { voidCargaSchema } from "@/schemas/carga";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireWrite();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const parsed = voidCargaSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Indica un motivo válido.", issues: parsed.error.flatten() }, { status: 400 });
  }

  const oldCarga = await prisma.carga.findUnique({ where: { id } });
  if (!oldCarga || oldCarga.deletedAt) return NextResponse.json({ error: "Carga no encontrada." }, { status: 404 });

  const carga = await prisma.carga.update({
    where: { id },
    data: {
      estado: "ANULADA",
      voidReason: parsed.data.motivo,
      voidedAt: new Date(),
      voidedById: auth.session.user.id,
      updatedById: auth.session.user.id,
    },
    include: {
      createdBy: { select: { id: true, name: true, username: true } },
      updatedBy: { select: { id: true, name: true, username: true } },
      voidedBy: { select: { id: true, name: true, username: true } },
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: auth.session.user.id,
      entity: "Carga",
      entityId: id,
      action: "VOID",
      oldData: auditSafeCarga(oldCarga),
      newData: auditSafeCarga(carga),
    },
  });

  return NextResponse.json({ data: serializeCarga(carga), message: "Movimiento anulado." });
}
