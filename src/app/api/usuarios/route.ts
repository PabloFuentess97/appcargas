import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/permissions";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      surnames: true,
      username: true,
      email: true,
      role: true,
      active: true,
      lastLoginAt: true,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await request.json();

  if (!body.name || !body.username || !body.email || !body.password || !Object.values(Role).includes(body.role)) {
    return NextResponse.json({ error: "Completa todos los campos obligatorios." }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      name: String(body.name),
      surnames: body.surnames ? String(body.surnames) : null,
      username: String(body.username).toLowerCase(),
      email: String(body.email).toLowerCase(),
      passwordHash: await bcrypt.hash(String(body.password), 12),
      role: body.role,
      active: Boolean(body.active ?? true),
    },
    select: { id: true, name: true, username: true, email: true, role: true, active: true },
  });

  return NextResponse.json({ data: user, message: "Usuario creado correctamente." }, { status: 201 });
}
