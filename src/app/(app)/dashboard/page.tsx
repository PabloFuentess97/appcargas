import Link from "next/link";
import { connection } from "next/server";
import { AlertTriangle, CheckCircle2, ClipboardList, FlaskConical, PackagePlus, PieChart, Plus, Search, ShieldAlert } from "lucide-react";
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
    ["Pendientes", pendientes, ClipboardList, "border-blue-200 bg-blue-50 text-blue-800"],
    ["Realizadas hoy", realizadasHoy, CheckCircle2, "border-emerald-200 bg-emerald-50 text-emerald-800"],
    ["Incidencias", incidencias, AlertTriangle, "border-red-200 bg-red-50 text-red-800"],
    ["Parciales", parciales, PieChart, "border-sky-200 bg-sky-50 text-sky-800"],
    ["Pend. Calidad", calidad, FlaskConical, "border-slate-200 bg-slate-50 text-slate-700"],
    ["Falta stock", faltaStock, PackagePlus, "border-rose-200 bg-rose-50 text-rose-800"],
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0b1b33]">Dashboard</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b8299]">Vista rápida del estado diario del almacén</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-primary" href="/cargas/nueva"><Plus className="h-4 w-4" /> Nueva carga</Link>
          <Link className="btn btn-secondary" href="/cargas"><Search className="h-4 w-4" /> Ver cargas</Link>
        </div>
      </div>

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {kpis.map(([label, value, Icon, className]) => (
          <article key={label} className={`app-card flex items-center gap-4 p-4 ${className}`}>
            <span className="grid h-12 w-12 place-items-center rounded-md bg-white/70">
              <Icon className="h-7 w-7" />
            </span>
            <div>
              <p className="text-3xl font-black leading-none">{value}</p>
              <p className="mt-1 text-sm font-bold">{label}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-3 xl:grid-cols-[1.1fr_0.85fr_0.9fr]">
        <div className="app-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black text-[#0b1b33]">Actividad del día</h2>
            <Link className="text-sm font-bold text-[#1f73e8]" href="/cargas">Ver detalle →</Link>
          </div>
          <div className="grid h-52 items-end gap-2 border-b border-l border-[#d7e2ee] px-3 pb-3 sm:grid-cols-6">
            {[8, 10, 12, 14, 16, 18].map((hour, index) => (
              <div key={hour} className="flex h-full items-end justify-center gap-1">
                <span className="w-4 rounded-t bg-[#1f73e8]" style={{ height: `${35 + index * 8}%` }} />
                <span className="w-4 rounded-t bg-[#9fc8ee]" style={{ height: `${22 + (index % 3) * 14}%` }} />
                <span className="w-4 rounded-t bg-[#8291a3]" style={{ height: `${18 + (index % 4) * 11}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-[#45627f]">
            <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-[#1f73e8]" />Cargas</span>
            <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-[#9fc8ee]" />Trasiegos</span>
            <span><span className="mr-1 inline-block h-3 w-3 rounded-full bg-[#8291a3]" />Movimientos stock</span>
          </div>
        </div>

        <div className="app-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black text-[#0b1b33]">OFs con revisión pendiente</h2>
            <Link className="text-sm font-bold text-[#1f73e8]" href="/cargas?estado=PENDIENTE_CALIDAD">Ver todas →</Link>
          </div>
          <div className="space-y-3">
            {ultimas.slice(0, 5).map((carga) => (
              <div key={carga.id} className="flex items-center justify-between gap-3 border-b border-[#edf3f9] pb-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-[#17324d]">{carga.ordenFabricacion || "Sin OF"}</p>
                  <p className="truncate text-xs font-semibold text-[#6b8299]">{carga.descripcionArticulo}</p>
                </div>
                <span className="rounded-md bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Pendiente</span>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-black text-[#0b1b33]">Incidencias abiertas</h2>
            <Link className="text-sm font-bold text-[#1f73e8]" href="/cargas?estado=INCIDENCIA">Ver todas →</Link>
          </div>
          <div className="space-y-3">
            {ultimas.slice(0, 4).map((carga, index) => (
              <div key={carga.id} className="flex items-center justify-between gap-3 border-b border-[#edf3f9] pb-2">
                <div className="flex min-w-0 items-center gap-2">
                  <ShieldAlert className={`h-4 w-4 ${index < 2 ? "text-red-500" : "text-amber-500"}`} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#17324d]">INC-{1032 - index}</p>
                    <p className="truncate text-xs font-semibold text-[#6b8299]">{carga.comentario || "Seguimiento operativo"}</p>
                  </div>
                </div>
                <span className={`rounded-md px-2 py-1 text-xs font-bold ${index < 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800"}`}>{index < 2 ? "Alta" : "Media"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[1fr_1fr]">
        <div className="app-card p-4">
          <h2 className="font-black text-[#0b1b33]">Acciones rápidas</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["/cargas/nueva", Plus, "Nueva carga", "Registrar entrada de material"],
              ["/cargas?tipo=TRASIEGO", PackagePlus, "Nuevo trasiego", "Mover material entre ubicaciones"],
              ["/cargas?estado=PENDIENTE_CALIDAD", ClipboardList, "Validar OF", "Revisar órdenes"],
              ["/cargas?estado=INCIDENCIA", AlertTriangle, "Registrar incidencia", "Comunicar incidencia"],
            ].map(([href, Icon, title, subtitle]) => (
              <Link key={String(title)} href={String(href)} className="rounded-md border border-[#c8d6e5] bg-[#edf7ff] p-4 text-center transition hover:border-[#1f73e8]">
                <Icon className="mx-auto h-8 w-8 text-[#1f73e8]" />
                <p className="mt-2 text-sm font-black text-[#0b1b33]">{String(title)}</p>
                <p className="mt-1 text-xs font-semibold text-[#6b8299]">{String(subtitle)}</p>
              </Link>
            ))}
          </div>
        </div>
        <div className="app-card p-4">
          <h2 className="font-black text-[#0b1b33]">Flujo de trabajo</h2>
          <div className="mt-5 grid grid-cols-5 gap-2 text-center text-xs font-bold text-[#17324d]">
            {["Entrada", "Registro", "Validación", "Carga", "Cierre"].map((step, index) => (
              <div key={step} className="relative">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-[#c8d6e5] bg-[#e8f0f8] text-[#17324d]">{index + 1}</div>
                <p className="mt-2">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="app-card">
        <div className="flex items-center justify-between border-b border-[#d7e2ee] px-4 py-3">
          <h2 className="font-black text-[#0b1b33]">Últimos movimientos</h2>
          <Link className="btn btn-secondary px-3 py-1.5 text-xs" href="/cargas">Ver todos los movimientos →</Link>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="app-table min-w-[980px]">
            <thead>
              <tr>
                {["Fecha", "Estado", "Artículo", "Descripción", "Origen", "Destino", "OF", "Usuario"].map((head) => (
                  <th key={head} className="px-3 py-2">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ultimas.map((carga) => (
                <tr key={carga.id}>
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
