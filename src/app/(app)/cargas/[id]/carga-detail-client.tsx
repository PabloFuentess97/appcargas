"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadStatus, MovementType } from "@prisma/client";
import { formatDateTime, formatNumber, movementLabels, statusLabels } from "@/lib/format";
import { StatusBadge } from "@/components/ui/status-badge";

type CargaDetail = {
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
  createdAt: string;
  updatedAt: string;
  voidReason?: string | null;
  createdBy: { name: string; username: string };
  updatedBy?: { name: string; username: string } | null;
};

type Audit = {
  id: string;
  action: string;
  createdAt: string;
  user?: { name: string; username: string } | null;
};

export function CargaDetailClient({ id, canWrite, canDelete }: { id: string; canWrite: boolean; canDelete: boolean }) {
  const router = useRouter();
  const [carga, setCarga] = useState<CargaDetail | null>(null);
  const [audit, setAudit] = useState<Audit[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch(`/api/cargas/${id}`);
    const body = await res.json();
    if (!res.ok) {
      setError(body.error || "No se pudo cargar la carga.");
      return;
    }
    setCarga(body.data);
    setAudit(body.audit);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [id]);

  function update(field: keyof CargaDetail, value: string | number) {
    setCarga((current) => current ? { ...current, [field]: value } : current);
  }

  async function save() {
    if (!carga) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/cargas/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fecha: carga.fecha.slice(0, 10),
        tipoMovimiento: carga.tipoMovimiento,
        nbiEntrega: carga.nbiEntrega,
        nbiRecepcion: carga.nbiRecepcion,
        codigoArticulo: carga.codigoArticulo,
        descripcionArticulo: carga.descripcionArticulo,
        lote: carga.lote,
        cantidadPrevista: carga.cantidadPrevista,
        cantidadRealizada: carga.cantidadRealizada,
        ubicacionOrigen: carga.ubicacionOrigen,
        ubicacionDestino: carga.ubicacionDestino,
        ordenFabricacion: carga.ordenFabricacion,
        comentario: carga.comentario,
        estado: carga.estado,
      }),
    });
    const body = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(body.error || "No se pudieron guardar los cambios.");
      return;
    }
    setMessage(body.message || "Cambios guardados.");
    setCarga(body.data);
    load();
  }

  async function voidLoad() {
    const motivo = window.prompt("Motivo de anulación");
    if (!motivo) return;
    const res = await fetch(`/api/cargas/${id}/void`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const body = await res.json();
    if (!res.ok) setError(body.error || "No se pudo anular.");
    else {
      setMessage(body.message || "Movimiento anulado.");
      setCarga(body.data);
      load();
    }
  }

  async function deleteLoad() {
    if (!window.confirm("¿Eliminar esta carga? Se conservará trazabilidad mediante borrado lógico.")) return;
    const res = await fetch(`/api/cargas/${id}`, { method: "DELETE" });
    const body = await res.json();
    if (!res.ok) setError(body.error || "No se pudo eliminar.");
    else router.push("/cargas");
  }

  if (!carga) {
    return <div className="border border-slate-200 bg-white p-6 text-sm text-slate-500">{error || "Cargando detalle..."}</div>;
  }

  const readOnly = !canWrite;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link className="text-sm font-bold text-blue-700" href="/cargas">← Volver a cargas</Link>
          <h1 className="mt-1 text-2xl font-black text-slate-950">Detalle de carga</h1>
          <p className="mt-1 text-sm text-slate-600">{carga.codigoArticulo} · {carga.descripcionArticulo}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canWrite ? <button className="btn btn-primary" disabled={saving} onClick={save} type="button">{saving ? "Guardando..." : "Guardar"}</button> : null}
          {canWrite ? <button className="btn btn-secondary" onClick={voidLoad} type="button">Anular</button> : null}
          {canDelete ? <button className="btn btn-danger" onClick={deleteLoad} type="button">Eliminar</button> : null}
        </div>
      </div>

      {message ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div> : null}
      {error ? <div className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">{error}</div> : null}

      <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="border border-slate-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="font-black">Datos de la carga</h2>
            <StatusBadge status={carga.estado} />
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Fecha"><input className="field" disabled={readOnly} type="date" value={carga.fecha.slice(0, 10)} onChange={(e) => update("fecha", e.target.value)} /></Field>
            <Field label="Estado">
              <select className="field" disabled={readOnly} value={carga.estado} onChange={(e) => update("estado", e.target.value)}>
                {Object.values(LoadStatus).map((item) => <option key={item} value={item}>{statusLabels[item]}</option>)}
              </select>
            </Field>
            <Field label="Tipo">
              <select className="field" disabled={readOnly} value={carga.tipoMovimiento} onChange={(e) => update("tipoMovimiento", e.target.value)}>
                {Object.values(MovementType).map((item) => <option key={item} value={item}>{movementLabels[item]}</option>)}
              </select>
            </Field>
            <Field label="Código artículo"><input className="field" disabled={readOnly} value={carga.codigoArticulo} onChange={(e) => update("codigoArticulo", e.target.value)} /></Field>
            <Field label="Descripción"><input className="field" disabled={readOnly} value={carga.descripcionArticulo} onChange={(e) => update("descripcionArticulo", e.target.value)} /></Field>
            <Field label="Lote"><input className="field" disabled={readOnly} value={carga.lote || ""} onChange={(e) => update("lote", e.target.value)} /></Field>
            <Field label="Cantidad prevista"><input className="field" disabled={readOnly} type="number" value={carga.cantidadPrevista} onChange={(e) => update("cantidadPrevista", Number(e.target.value))} /></Field>
            <Field label="Cantidad realizada"><input className="field" disabled={readOnly} type="number" value={carga.cantidadRealizada} onChange={(e) => update("cantidadRealizada", Number(e.target.value))} /></Field>
            <Field label="Cantidad pendiente"><input className="field bg-slate-100 font-bold" disabled value={formatNumber(Number(carga.cantidadPrevista) - Number(carga.cantidadRealizada))} /></Field>
            <Field label="Origen"><input className="field" disabled={readOnly} value={carga.ubicacionOrigen || ""} onChange={(e) => update("ubicacionOrigen", e.target.value)} /></Field>
            <Field label="Destino"><input className="field" disabled={readOnly} value={carga.ubicacionDestino || ""} onChange={(e) => update("ubicacionDestino", e.target.value)} /></Field>
            <Field label="OF"><input className="field" disabled={readOnly} value={carga.ordenFabricacion || ""} onChange={(e) => update("ordenFabricacion", e.target.value)} /></Field>
            <Field label="NBI entrega"><input className="field" disabled={readOnly} value={carga.nbiEntrega || ""} onChange={(e) => update("nbiEntrega", e.target.value)} /></Field>
            <Field label="NBI recepción"><input className="field" disabled={readOnly} value={carga.nbiRecepcion || ""} onChange={(e) => update("nbiRecepcion", e.target.value)} /></Field>
            <Field label="Comentario"><input className="field" disabled={readOnly} value={carga.comentario || ""} onChange={(e) => update("comentario", e.target.value)} /></Field>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="font-black">Trazabilidad</h2>
            <dl className="mt-3 space-y-2 text-sm">
              <Row label="Creado por" value={carga.createdBy.name || carga.createdBy.username} />
              <Row label="Fecha creación" value={formatDateTime(carga.createdAt)} />
              <Row label="Última modificación" value={formatDateTime(carga.updatedAt)} />
              <Row label="Modificado por" value={carga.updatedBy?.name || carga.updatedBy?.username || "-"} />
              <Row label="Motivo anulación" value={carga.voidReason || "-"} />
            </dl>
          </div>
          <div className="border border-slate-200 bg-white p-4">
            <h2 className="font-black">Historial reciente</h2>
            <div className="mt-3 space-y-2 text-sm">
              {audit.map((item) => (
                <div key={item.id} className="border border-slate-100 bg-slate-50 p-2">
                  <p className="font-bold">{item.action}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(item.createdAt)} · {item.user?.name || item.user?.username || "Sistema"}</p>
                </div>
              ))}
              {audit.length === 0 ? <p className="text-slate-500">Sin historial todavía.</p> : null}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 pb-2">
      <dt className="font-bold text-slate-500">{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
