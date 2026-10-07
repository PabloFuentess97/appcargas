import Link from "next/link";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function DashboardPage() {
  await connection();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pendientes, realizadasHoy, incidencias, parciales, calidad, faltaStock, ultimas] = await Promise.all([
    prisma.carga.count({ where: { estado: "PENDIENTE", deletedAt: null } }),
    prisma.carga.count({ where: { estado: "REALIZADA", fecha: { gte: today }, deletedAt: null } }),
    prisma.carga.count({ where: { estado: "INCIDENCIA", deletedAt: null } }),
    prisma.carga.count({ where: { estado: "PARCIAL", deletedAt: null } }),
    prisma.carga.count({ where: { estado: "PENDIENTE_CALIDAD", deletedAt: null } }),
    prisma.carga.count({ where: { estado: "FALTA_STOCK", deletedAt: null } }),
    prisma.carga.findMany({
      where: { deletedAt: null },
      include: { createdBy: { select: { name: true, username: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const kpis = [
    ["Cargas pendientes", pendientes, "border-amber-200 bg-amber-50 text-amber-800"],
    ["Realizadas hoy", realizadasHoy, "border-emerald-200 bg-emerald-50 text-emerald-800"],
    ["Incidencias", incidencias, "border-red-200 bg-red-50 text-red-800"],
    ["Parciales", parciales, "border-sky-200 bg-sky-50 text-sky-800"],
    ["Pendientes calidad", calidad, "border-violet-200 bg-violet-50 text-violet-800"],
    ["Falta stock", faltaStock, "border-orange-200 bg-orange-50 text-orange-800"],
  ] as const;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Resumen operativo del Almacén General</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-primary" href="/cargas/nueva">Nueva carga</Link>
          <Link className="btn btn-secondary" href="/cargas">Ver cargas</Link>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, className]) => (
          <article key={label} className={`border p-4 ${className}`}>
            <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
            <p className="mt-2 text-3xl font-black">{value}</p>
          </article>
        ))}
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-black">Últimos movimientos</h2>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
              <tr>
                {["Fecha", "Estado", "Artículo", "Descripción", "Origen", "Destino", "OF", "Usuario"].map((head) => (
                  <th key={head} className="px-3 py-2 font-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ultimas.map((carga) => (
                <tr key={carga.id} className="hover:bg-slate-50">
                  <td className="px-3 py-2">{formatDate(carga.fecha)}</td>
                  <td className="px-3 py-2"><StatusBadge status={carga.estado} /></td>
                  <td className="px-3 py-2 font-bold">{carga.codigoArticulo}</td>
                  <td className="px-3 py-2">{carga.descripcionArticulo}</td>
                  <td className="px-3 py-2">{carga.ubicacionOrigen || "-"}</td>
                  <td className="px-3 py-2">{carga.ubicacionDestino || "-"}</td>
                  <td className="px-3 py-2">{carga.ordenFabricacion || "-"}</td>
                  <td className="px-3 py-2">{carga.createdBy.name || carga.createdBy.username}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ultimas.length === 0 ? <p className="p-5 text-sm text-slate-500">Todavía no hay movimientos registrados.</p> : null}
        </div>
      </section>
    </div>
  );
}
