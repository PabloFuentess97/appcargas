"use client";

import { Role } from "@prisma/client";
import { useEffect, useState } from "react";
import { KeyRound, Plus, Search, UserCheck, UserX, Users } from "lucide-react";
import { formatDateTime, roleLabels } from "@/lib/format";

type UserRow = {
  id: string;
  name: string;
  surnames?: string | null;
  username: string;
  email: string;
  role: Role;
  active: boolean;
  lastLoginAt?: string | null;
};

export function UsuariosClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({
    name: "",
    surnames: "",
    username: "",
    email: "",
    password: "",
    role: "ADMINISTRATIVO",
    active: true,
  });

  async function load() {
    const res = await fetch("/api/usuarios");
    const body = await res.json();
    setUsers(body.data || []);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, []);

  async function createUser() {
    const res = await fetch("/api/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const body = await res.json();
    setMessage(body.message || body.error || "");
    if (res.ok) {
      setForm({ name: "", surnames: "", username: "", email: "", password: "", role: "ADMINISTRATIVO", active: true });
      load();
    }
  }

  async function toggleUser(user: UserRow) {
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !user.active }),
    });
    const body = await res.json();
    setMessage(body.message || body.error || "");
    load();
  }

  async function updateRole(user: UserRow, role: string) {
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const body = await res.json();
    setMessage(body.message || body.error || "");
    load();
  }

  async function changePassword(user: UserRow) {
    const password = window.prompt(`Nueva contraseña temporal para ${user.username}`);
    if (!password) return;
    const res = await fetch(`/api/usuarios/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await res.json();
    setMessage(body.message || body.error || "");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-black text-[#0b1b33]">Gestión de usuarios</h1>
        <p className="mt-1 text-sm font-semibold text-[#6b8299]">Administración de accesos, estados y cuentas internas</p>
      </div>
      {message ? <div className="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">{message}</div> : null}
      <section className="grid gap-3 md:grid-cols-3">
        <div className="app-card p-4 text-emerald-800">
          <UserCheck className="h-7 w-7" />
          <p className="mt-2 text-3xl font-black">{users.filter((user) => user.active).length}</p>
          <p className="text-sm font-bold">Usuarios activos</p>
        </div>
        <div className="app-card p-4 text-red-800">
          <UserX className="h-7 w-7" />
          <p className="mt-2 text-3xl font-black">{users.filter((user) => !user.active).length}</p>
          <p className="text-sm font-bold">Usuarios desactivados</p>
        </div>
        <div className="app-card p-4 text-blue-800">
          <Users className="h-7 w-7" />
          <p className="mt-2 text-3xl font-black">{users.length}</p>
          <p className="text-sm font-bold">Cuentas internas</p>
        </div>
      </section>
      <section className="app-card p-4">
        <h2 className="font-black text-[#0b1b33]">Nuevo usuario</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-7">
          <input className="field" placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="field" placeholder="Apellidos" value={form.surnames} onChange={(e) => setForm({ ...form, surnames: e.target.value })} />
          <input className="field" placeholder="Usuario" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
          <input className="field" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className="field" placeholder="Contraseña temporal" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {Object.values(Role).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
          </select>
          <button className="btn btn-primary" onClick={createUser} type="button"><Plus className="h-4 w-4" /> Crear usuario</button>
        </div>
      </section>
      <section className="app-card p-3">
        <div className="mb-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7188a0]" />
            <input className="field pl-9" placeholder="Buscar por nombre, usuario o correo..." />
          </label>
          <button className="btn btn-secondary" type="button">Exportar</button>
        </div>
        <div className="table-scroll overflow-x-auto">
          <table className="app-table min-w-[980px]">
            <thead>
              <tr>
                {["Nombre", "Usuario", "Correo", "Rol", "Estado", "Último acceso", "Acciones"].map((head) => (
                  <th key={head} className="px-3 py-2 font-black">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2 font-bold">{user.name} {user.surnames || ""}</td>
                  <td className="px-3 py-2">{user.username}</td>
                  <td className="px-3 py-2">{user.email}</td>
                  <td className="px-3 py-2">
                    <select className="field" value={user.role} onChange={(e) => updateRole(user, e.target.value)}>
                      {Object.values(Role).map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2"><span className={`rounded-md px-2 py-1 text-xs font-bold ${user.active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{user.active ? "Activo" : "Desactivado"}</span></td>
                  <td className="px-3 py-2">{formatDateTime(user.lastLoginAt)}</td>
                  <td className="space-x-2 px-3 py-2">
                    <button className="btn btn-secondary px-2 py-1" onClick={() => toggleUser(user)} type="button">{user.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}{user.active ? "Desactivar" : "Activar"}</button>
                    <button className="btn btn-secondary px-2 py-1" onClick={() => changePassword(user)} type="button"><KeyRound className="h-4 w-4" />Cambiar contraseña</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
