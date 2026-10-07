import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export const canWrite = (role?: string) => role === "ADMINISTRADOR" || role === "ADMINISTRATIVO";
export const canAdmin = (role?: string) => role === "ADMINISTRADOR";
export const canDelete = canAdmin;

export async function requireSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { error: NextResponse.json({ error: "No autenticado." }, { status: 401 }) };
  }
  return { session };
}

export async function requireWrite() {
  const result = await requireSession();
  if ("error" in result) return result;
  if (!canWrite(result.session.user.role)) {
    return { error: NextResponse.json({ error: "No tienes permiso para modificar cargas." }, { status: 403 }) };
  }
  return result;
}

export async function requireAdmin() {
  const result = await requireSession();
  if ("error" in result) return result;
  if (!canAdmin(result.session.user.role)) {
    return { error: NextResponse.json({ error: "Solo administración puede realizar esta acción." }, { status: 403 }) };
  }
  return result;
}
