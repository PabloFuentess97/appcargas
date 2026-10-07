"use client";

import { useEffect, useState } from "react";
import { Bell, Box, Clock, LockKeyhole, Save, Settings, Users } from "lucide-react";

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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#0b1b33]">Configuración y seguridad</h1>
        <p className="mt-1 text-sm font-semibold text-[#6b8299]">Parámetros generales de acceso, sesiones y control del sistema</p>
      </div>
      {message ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div> : null}
      <section className="grid gap-3 xl:grid-cols-3">
        <div className="app-card p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-[#d7e2ee] pb-3">
            <LockKeyhole className="h-8 w-8 text-[#1f73e8]" />
            <div>
              <h2 className="font-black text-[#0b1b33]">Autenticación</h2>
              <p className="text-xs font-semibold text-[#6b8299]">Políticas de acceso y seguridad de cuentas</p>
            </div>
          </div>
          <SettingRow label="Autenticación multifactor" value="Opcional" />
          <SettingRow label="Caducidad de contraseña" value="90 días" />
          <SettingRow label="Bloqueo por intentos fallidos" value="5 intentos" />
        </div>
        <div className="app-card p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-[#d7e2ee] pb-3">
            <Clock className="h-8 w-8 text-[#1f73e8]" />
            <div>
              <h2 className="font-black text-[#0b1b33]">Sesiones</h2>
              <p className="text-xs font-semibold text-[#6b8299]">Control de sesiones activas y caducidad</p>
            </div>
          </div>
          <SettingRow label="Tiempo máximo de sesión" value="30 minutos" />
          <SettingRow label="Dispositivos recordados" value="3 dispositivos" />
          <SettingRow label="Inactividad" value="15 minutos" />
        </div>
        <div className="app-card p-4">
          <div className="mb-4 flex items-center gap-3 border-b border-[#d7e2ee] pb-3">
            <Users className="h-8 w-8 text-[#1f73e8]" />
            <div>
              <h2 className="font-black text-[#0b1b33]">Acceso</h2>
              <p className="text-xs font-semibold text-[#6b8299]">Restricciones de acceso al sistema</p>
            </div>
          </div>
          <SettingRow label="Registro público" value="Desactivado" />
          <SettingRow label="Creación de usuarios" value="Solo administración" />
          <SettingRow label="Roles activos" value="3 perfiles" />
        </div>
      </section>
      <section className="grid gap-3 xl:grid-cols-[1fr_360px]">
      <div className="app-card p-4">
        <div className="mb-4 flex items-center gap-3 border-b border-[#d7e2ee] pb-3">
          <Settings className="h-8 w-8 text-[#1f73e8]" />
          <div>
            <h2 className="font-black text-[#0b1b33]">Parámetros generales</h2>
            <p className="text-xs font-semibold text-[#6b8299]">Configuración básica del MVP</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold text-[#17324d]">Nombre de la aplicación</span>
            <input className="field mt-1" value={form.appName} onChange={(e) => setForm({ ...form, appName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#17324d]">Nombre del almacén</span>
            <input className="field mt-1" value={form.warehouseName} onChange={(e) => setForm({ ...form, warehouseName: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-[#17324d]">Elementos por página</span>
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
            <span className="text-sm font-bold text-[#17324d]">Confirmar antes de anular</span>
          </label>
        </div>
      </div>
      <aside className="space-y-3">
        <div className="app-card p-4">
          <div className="flex items-center gap-3">
            <Box className="h-8 w-8 text-[#1f73e8]" />
            <h2 className="font-black text-[#0b1b33]">Módulos</h2>
          </div>
          {["Cargas", "Trasiegos", "Movimientos stock", "Incidencias", "Validación OF", "Informes"].map((item) => (
            <div key={item} className="mt-3 flex items-center justify-between border-b border-[#edf3f9] pb-2 text-sm">
              <span className="font-bold text-[#17324d]">{item}</span>
              <span className="rounded-md bg-emerald-100 px-2 py-1 text-xs font-bold text-emerald-800">Activo</span>
            </div>
          ))}
        </div>
        <div className="app-card p-4">
          <div className="flex items-center gap-3">
            <Bell className="h-8 w-8 text-[#1f73e8]" />
            <h2 className="font-black text-[#0b1b33]">Guardar configuración</h2>
          </div>
          <p className="mt-3 rounded-md bg-[#eaf4ff] p-3 text-sm font-semibold text-[#45627f]">Los cambios se aplican de forma inmediata a todos los usuarios.</p>
          <button className="btn btn-primary mt-4 w-full" onClick={save} type="button"><Save className="h-4 w-4" /> Guardar configuración</button>
        </div>
      </aside>
      </section>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-[#edf3f9] py-2 text-sm">
      <span className="font-bold text-[#45627f]">{label}</span>
      <span className="font-black text-[#17324d]">{value}</span>
    </div>
  );
}
