"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, FileSpreadsheet, Plus, Search, X } from "lucide-react";
import { LoadStatus, MovementType } from "@prisma/client";
import { formatDate, formatNumber, movementLabels, statusLabels } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

type CargaRow = {
  id: string;
  fecha: string;
  tipoMovimiento: MovementType;
  nbiEntrega?: string | null;
  nbiRecepcion?: string | null;
  codigoArticulo: string;
  descripcionArticulo: string;
  lote?: string | null;
  cantidadPrevista: number;
  cantidadRealizada: number;
  pendiente: number;
  ubicacionOrigen?: string | null;
  ubicacionDestino?: string | null;
  ordenFabricacion?: string | null;
  comentario?: string | null;
  estado: LoadStatus;
  createdBy: { name: string; username: string };
};

type ApiData = {
  data: CargaRow[];
  meta: { total: number; page: number; pageSize: number; pages: number };
  usuarios: { id: string; name: string; username: string }[];
};

export function CargasClient({ canWrite, canDelete }: { canWrite: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [estado, setEstado] = useState("");
  const [tipo, setTipo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sort, setSort] = useState("fecha");
  const [dir, setDir] = useState("desc");
  const [toast, setToast] = useState("");
  const [selected, setSelected] = useState<CargaRow | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q), 250);
    return () => window.clearTimeout(id);
  }, [q]);

  const params = useMemo(() => {
    const search = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort, dir });
    if (debouncedQ) search.set("q", debouncedQ);
    if (estado) search.set("estado", estado);
    if (tipo) search.set("tipo", tipo);
    if (usuario) search.set("usuario", usuario);
    return search;
  }, [debouncedQ, estado, tipo, usuario, page, pageSize, sort, dir]);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/cargas?${params.toString()}`);
    const body = await res.json();
    setData(body);
    setSelected((current) => current ?? body.data?.[0] ?? null);
    setLoading(false);
  }, [params]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function quickPatch(id: string, patch: Record<string, unknown>, message: string) {
    const res = await fetch(`/api/cargas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json();
      setToast(body.error || "No se pudo guardar el cambio.");
      return;
    }
    setToast(message);
    load();
  }

  async function duplicate(row: CargaRow) {
    if (!canWrite) return;
    const res = await fetch("/api/cargas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: row.fecha.slice(0, 10),
        tipoMovimiento: row.tipoMovimiento,
        nbiEntrega: row.nbiEntrega,
        nbiRecepcion: row.nbiRecepcion,
        codigoArticulo: row.codigoArticulo,
        descripcionArticulo: row.descripcionArticulo,
        lote: row.lote,
        cantidadPrevista: row.cantidadPrevista,
        cantidadRealizada: 0,
        ubicacionOrigen: row.ubicacionOrigen,
        ubicacionDestino: row.ubicacionDestino,
        ordenFabricacion: row.ordenFabricacion,
        comentario: row.comentario,
        estado: "PENDIENTE",
      }),
    });
    const body = await res.json();
    setToast(body.message || "Carga duplicada.");
    load();
  }

  async function voidLoad(id: string) {
    const motivo = window.prompt("Motivo de anulación");
    if (!motivo) return;
    const res = await fetch(`/api/cargas/${id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const body = await res.json();
    setToast(body.message || body.error || "Movimiento anulado.");
    load();
  }

  async function deleteLoad(id: string) {
    if (!window.confirm("¿Eliminar esta carga? Se conservará trazabilidad mediante borrado lógico.")) return;
    const res = await fetch(`/api/cargas/${id}`, { method: "DELETE" });
    const body = await res.json();
    setToast(body.message || body.error || "Carga eliminada.");
    load();
  }

  function clearFilters() {
    setQ("");
    setEstado("");
    setTipo("");
    setUsuario("");
    setPage(1);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0b1b33]">Cargas y Seguimiento</h1>
          <p className="mt-1 text-sm font-semibold text-[#6b8299]">Listado principal de movimientos y control operativo</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? <Link className="btn btn-primary" href="/cargas/nueva"><Plus className="h-4 w-4" /> Nueva carga</Link> : null}
          <a className="btn btn-secondary" href={`/api/cargas/export?${params.toString()}`}><Download className="h-4 w-4" /> Exportar</a>
          <button className="btn btn-secondary opacity-60" disabled type="button"><FileSpreadsheet className="h-4 w-4" /> Importar Excel</button>
        </div>
      </div>

      {toast ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{toast}</div> : null}

      <section className="app-card p-3">
        <div className="grid gap-3 lg:grid-cols-[1.6fr_repeat(4,1fr)_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7188a0]" />
            <input className="field pl-9" placeholder="Buscar por artículo, lote, OF, NBI, origen o destino..." value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          </label>
          <select className="field" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }}>
            <option value="">Todos los estados</option>
            {Object.values(LoadStatus).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
          </select>
          <select className="field" value={tipo} onChange={(e) => { setTipo(e.target.value); setPage(1); }}>
            <option value="">Todos los tipos</option>
            {Object.values(MovementType).map((item) => <option key={item} value={item}>{movementLabels[item]}</option>)}
          </select>
          <select className="field" value={usuario} onChange={(e) => { setUsuario(e.target.value); setPage(1); }}>
            <option value="">Todos los usuarios</option>
            {data?.usuarios.map((user) => <option key={user.id} value={user.id}>{user.name || user.username}</option>)}
          </select>
          <select className="field" value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}>
            {[25, 50, 100].map((size) => <option key={size} value={size}>{size} filas</option>)}
          </select>
          <button className="btn btn-secondary" type="button" onClick={clearFilters}>Limpiar filtros</button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["", "Todos", data?.meta.total ?? 0, "bg-blue-50 text-blue-800 border-blue-200"],
            ["PENDIENTE", "Pendientes", pendientesCount(data?.data, "PENDIENTE"), "bg-amber-50 text-amber-800 border-amber-200"],
            ["REALIZADA", "Realizadas", pendientesCount(data?.data, "REALIZADA"), "bg-emerald-50 text-emerald-800 border-emerald-200"],
            ["INCIDENCIA", "Incidencias", pendientesCount(data?.data, "INCIDENCIA"), "bg-red-50 text-red-800 border-red-200"],
            ["PARCIAL", "Parciales", pendientesCount(data?.data, "PARCIAL"), "bg-sky-50 text-sky-800 border-sky-200"],
          ].map(([value, label, count, className]) => (
            <button key={String(label)} className={`rounded-md border px-3 py-2 text-sm font-bold ${className}`} onClick={() => { setEstado(String(value)); setPage(1); }} type="button">
              {String(label)} ({String(count)})
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_310px]">
        <div className="app-card min-w-0">
        <div className="table-scroll overflow-x-auto">
          <table className="app-table min-w-[1500px]">
            <thead>
              <tr>
                {[
                  ["estado", "Estado"],
                  ["fecha", "Fecha"],
                  ["tipoMovimiento", "Tipo"],
                  ["nbiEntrega", "NBI entrega"],
                  ["nbiRecepcion", "NBI recepción"],
                  ["codigoArticulo", "Código artículo"],
                  ["descripcionArticulo", "Descripción"],
                  ["lote", "Lote"],
                  ["cantidadPrevista", "Cantidad prevista"],
                  ["cantidadRealizada", "Cantidad realizada"],
                  ["pendiente", "Pendiente"],
                  ["ubicacionOrigen", "Origen"],
                  ["ubicacionDestino", "Destino"],
                  ["ordenFabricacion", "OF"],
                  ["comentario", "Comentario"],
                  ["usuario", "Usuario"],
                  ["acciones", "Acciones"],
                ].map(([key, label]) => (
                  <th key={key} className="px-3 py-2">
                    <button
                      className="font-black"
                      disabled={!["fecha", "codigoArticulo", "ordenFabricacion", "estado", "cantidadPrevista"].includes(key)}
                      onClick={() => {
                        setSort(key);
                        setDir(sort === key && dir === "desc" ? "asc" : "desc");
                      }}
                      type="button"
                    >
                      {label}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="px-3 py-8 text-center text-slate-500" colSpan={17}>Cargando cargas...</td></tr>
              ) : data?.data.length ? data.data.map((row) => (
                <tr key={row.id} className={selected?.id === row.id ? "bg-blue-50" : ""} onClick={() => setSelected(row)}>
                  <td className="px-3 py-2"><StatusBadge status={row.estado} /></td>
                  <td className="px-3 py-2">{formatDate(row.fecha)}</td>
                  <td className="px-3 py-2">{movementLabels[row.tipoMovimiento]}</td>
                  <td className="px-3 py-2">{row.nbiEntrega || "-"}</td>
                  <td className="px-3 py-2">{row.nbiRecepcion || "-"}</td>
                  <td className="px-3 py-2 font-bold">{row.codigoArticulo}</td>
                  <td className="px-3 py-2">{row.descripcionArticulo}</td>
                  <td className="px-3 py-2">{row.lote || "-"}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(row.cantidadPrevista)}</td>
                  <td className="px-3 py-2 text-right">{formatNumber(row.cantidadRealizada)}</td>
                  <td className="px-3 py-2 text-right font-bold">{formatNumber(row.pendiente)}</td>
                  <td className="px-3 py-2">{row.ubicacionOrigen || "-"}</td>
                  <td className="px-3 py-2">{row.ubicacionDestino || "-"}</td>
                  <td className="px-3 py-2">{row.ordenFabricacion || "-"}</td>
                  <td className="max-w-52 truncate px-3 py-2">{row.comentario || "-"}</td>
                  <td className="px-3 py-2">{row.createdBy.name || row.createdBy.username}</td>
                  <td className="px-3 py-2">
                    <select
                      className="field min-w-44"
                      defaultValue=""
                      onChange={(e) => {
                        const action = e.target.value;
                        e.currentTarget.value = "";
                        if (action === "detail") router.push(`/cargas/${row.id}`);
                        if (action === "done") quickPatch(row.id, { estado: "REALIZADA", cantidadRealizada: row.cantidadPrevista }, "Carga marcada como realizada.");
                        if (action === "incident") quickPatch(row.id, { estado: "INCIDENCIA" }, "Carga marcada como incidencia.");
                        if (action === "duplicate") duplicate(row);
                        if (action === "void") voidLoad(row.id);
                        if (action === "delete") deleteLoad(row.id);
                      }}
                    >
                      <option value="">...</option>
                      <option value="detail">Ver detalle / editar</option>
                      {canWrite ? <option value="duplicate">Duplicar</option> : null}
                      {canWrite ? <option value="done">Marcar realizada</option> : null}
                      {canWrite ? <option value="incident">Marcar incidencia</option> : null}
                      {canWrite ? <option value="void">Anular</option> : null}
                      {canDelete ? <option value="delete">Eliminar</option> : null}
                    </select>
                  </td>
                </tr>
              )) : (
                <tr><td className="px-3 py-8 text-center text-slate-500" colSpan={17}>No hay cargas con estos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-3 py-3 text-sm">
          <span>{data ? `${data.meta.total} cargas · página ${data.meta.page} de ${data.meta.pages}` : "Cargando..."}</span>
          <div className="flex gap-2">
            <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">Anterior</button>
            <button className="btn btn-secondary" disabled={!data || page >= data.meta.pages} onClick={() => setPage((p) => p + 1)} type="button">Siguiente</button>
          </div>
        </div>
        </div>
        <aside className="app-card hidden p-4 xl:block">
          <div className="flex items-center justify-between border-b border-[#d7e2ee] pb-3">
            <h2 className="font-black text-[#0b1b33]">Resumen de la selección</h2>
            <button className="text-[#7188a0]" onClick={() => setSelected(null)} type="button"><X className="h-4 w-4" /></button>
          </div>
          {selected ? (
            <div className="mt-4 space-y-4 text-sm">
              <StatusBadge status={selected.estado} />
              <div>
                <p className="font-black text-[#0b1b33]">{selected.codigoArticulo}</p>
                <p className="text-xs font-semibold text-[#6b8299]">{selected.descripcionArticulo}</p>
              </div>
              <dl className="space-y-2">
                <SideRow label="Lote" value={selected.lote || "-"} />
                <SideRow label="OF" value={selected.ordenFabricacion || "-"} />
                <SideRow label="NBI entrega" value={selected.nbiEntrega || "-"} />
                <SideRow label="Origen" value={selected.ubicacionOrigen || "-"} />
                <SideRow label="Destino" value={selected.ubicacionDestino || "-"} />
                <SideRow label="Cant. prevista" value={formatNumber(selected.cantidadPrevista)} />
                <SideRow label="Cant. real" value={formatNumber(selected.cantidadRealizada)} />
                <SideRow label="Pendiente" value={formatNumber(selected.pendiente)} />
                <SideRow label="Comentario" value={selected.comentario || "-"} />
              </dl>
              <div className="space-y-2 pt-2">
                <button className="btn btn-secondary w-full" onClick={() => router.push(`/cargas/${selected.id}`)} type="button">Abrir detalle</button>
                {canWrite ? <button className="btn btn-primary w-full" onClick={() => quickPatch(selected.id, { estado: "REALIZADA", cantidadRealizada: selected.cantidadPrevista }, "Carga marcada como realizada.")} type="button">Marcar realizada</button> : null}
                {canWrite ? <button className="btn btn-secondary w-full" onClick={() => duplicate(selected)} type="button">Duplicar línea</button> : null}
              </div>
            </div>
          ) : <p className="mt-4 text-sm text-[#6b8299]">Selecciona una carga para ver su resumen.</p>}
        </aside>
      </section>
    </div>
  );
}

function pendientesCount(rows: CargaRow[] | undefined, status: LoadStatus) {
  return rows?.filter((row) => row.estado === status).length ?? 0;
}

function SideRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-[#edf3f9] pb-2">
      <dt className="font-bold text-[#6b8299]">{label}</dt>
      <dd className="text-right font-semibold text-[#17324d]">{value}</dd>
    </div>
  );
}
