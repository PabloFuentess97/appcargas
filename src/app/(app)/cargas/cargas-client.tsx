"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
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
    setData(await res.json());
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
          <h1 className="text-2xl font-black text-slate-950">Cargas</h1>
          <p className="mt-1 text-sm text-slate-600">Gestión y seguimiento de cargas de materiales</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? <Link className="btn btn-primary" href="/cargas/nueva">Nueva carga</Link> : null}
          <a className="btn btn-secondary" href={`/api/cargas/export?${params.toString()}`}>Exportar Excel</a>
          <button className="btn btn-secondary opacity-60" disabled type="button">Importar Excel · Próximamente</button>
        </div>
      </div>

      {toast ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{toast}</div> : null}

      <section className="border border-slate-200 bg-white p-3">
        <div className="grid gap-3 lg:grid-cols-[1.4fr_repeat(4,1fr)_auto]">
          <input className="field" placeholder="Buscar artículo, descripción, lote, OF, NBI, ubicación o comentario" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
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
      </section>

      <section className="border border-slate-200 bg-white">
        <div className="table-scroll overflow-x-auto">
          <table className="min-w-[1680px] w-full text-sm">
            <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-600">
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
                  <th key={key} className="px-3 py-2 font-black">
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
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td className="px-3 py-8 text-center text-slate-500" colSpan={17}>Cargando cargas...</td></tr>
              ) : data?.data.length ? data.data.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50">
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
      </section>
    </div>
  );
}
