import { getServerSession } from "next-auth";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { canDelete, canWrite } from "@/lib/permissions";
import { CargasClient } from "./cargas-client";

export default async function CargasPage() {
  await connection();
  const session = await getServerSession(authOptions);
  return <CargasClient canWrite={canWrite(session?.user.role)} canDelete={canDelete(session?.user.role)} />;
}
