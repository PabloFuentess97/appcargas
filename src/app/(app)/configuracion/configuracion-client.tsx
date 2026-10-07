"use client";

import { useEffect, useState } from "react";

export function ConfiguracionClient() {
  const [form, setForm] = useState({
    appName: "Almacén General",
    warehouseName: "Fábrica de Municiones de Granada",
    itemsPerPage: 25,
    confirmBeforeVoid: true,
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/configuracion").then((res) => res.json()).then((body) => {
      if (body.data) setForm(body.data);
    });
  }, []);

  async function save() {
    const res = await fetch("/api/configuracion", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setMessage(body.message || body.error || "");
  }

  return (
    <div className="max-w-4xl space-y-4">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Configuración</h1>
        <p className="mt-1 text-sm text-slate-600">Ajustes básicos del MVP</p>
      </div>
      {message ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div> : null}
      <section className="border border-slate-200 bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nombre de la aplicación</span>
            <input className="field mt-1" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Nombre del almacén</span>
            <input className="field mt-1" value={form.warehouseName} onChange={(e) => setForm({ ...form, warehouseName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-700">Elementos por página</span>
            <select className="field mt-1" value={form.itemsPerPage} onChange={(e) => setForm({ ...form, itemsPerPage: Number(e.target.value) })}>
              {[25, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-3 pt-6">
            <input
              checked={form.confirmBeforeVoid}
              onChange={(e) => setForm({ ...form, confirmBeforeVoid: e.target.checked })}
              type="checkbox"
            />
            <span className="text-sm font-bold text-slate-700">Confirmar antes de anular</span>
          </label>
        </div>
        <button className="btn btn-primary mt-4" onClick={save} type="button">Guardar configuración</button>
      </section>
    </div>
  );
}
