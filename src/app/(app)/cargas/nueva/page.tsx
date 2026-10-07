import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { canWrite } from "@/lib/permissions";
import { NuevaCargaClient } from "./nueva-carga-client";

export default async function NuevaCargaPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (!canWrite(session?.user.role)) redirect("/cargas");
  return <NuevaCargaClient />;
}
