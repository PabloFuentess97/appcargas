import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { canDelete, canWrite } from "@/lib/permissions";
import { CargaDetailClient } from "./carga-detail-client";

export default async function CargaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const { id } = await params;
  return <CargaDetailClient id={id} canWrite={canWrite(session.user.role)} canDelete={canDelete(session.user.role)} />;
}
