import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = String(body.name);
  if (body.surnames !== undefined) data.surnames = body.surnames ? String(body.surnames) : null;
  if (body.email !== undefined) data.email = String(body.email).toLowerCase();
  if (body.role !== undefined && Object.values(Role).includes(body.role)) data.role = body.role;
  if (body.active !== undefined) data.active = Boolean(body.active);
  if (body.password) data.passwordHash = await bcrypt.hash(String(body.password), 12);

  const user = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, username: true, email: true, role: true, active: true, lastLoginAt: true },
  });

  return NextResponse.json({ data: user, message: "Usuario actualizado correctamente." });
}
