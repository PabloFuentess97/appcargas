import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { canAdmin } from "@/lib/permissions";
import { ConfiguracionClient } from "./configuracion-client";

export default async function ConfiguracionPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!canAdmin(session?.user.role)) redirect("/dashboard");
  return <ConfiguracionClient />;
}
