import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const data = await prisma.appSetting.upsert({
    where: { id: "global" },
    create: {},
    update: {},
  });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await request.json();
  const data = await prisma.appSetting.upsert({
    where: { id: "global" },
    create: {
      appName: String(body.appName || "Almacén General"),
      warehouseName: String(body.warehouseName || "Fábrica de Municiones de Granada"),
      itemsPerPage: Number(body.itemsPerPage || 25),
      confirmBeforeVoid: Boolean(body.confirmBeforeVoid),
    },
    update: {
      appName: String(body.appName || "Almacén General"),
      warehouseName: String(body.warehouseName || "Fábrica de Municiones de Granada"),
      itemsPerPage: Number(body.itemsPerPage || 25),
      confirmBeforeVoid: Boolean(body.confirmBeforeVoid),
    },
  });
  return NextResponse.json({ data, message: "Configuración guardada." });
}
