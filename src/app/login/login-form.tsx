"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { Eye, LockKeyhole, UserRound } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      login: String(form.get("login") || ""),
      password: String(form.get("password") || ""),
      redirect: false,
      callbackUrl: search.get("callbackUrl") || "/dashboard",
    });
    setLoading(false);
    if (result?.error) {
      setError("Usuario o contraseña incorrectos.");
      return;
    }
    router.push(result?.url || "/dashboard");
    router.refresh();
  }

  return (
    <form className="mt-7 space-y-5" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-bold text-[#17324d]">Usuario o correo corporativo *</span>
        <span className="mt-1 flex items-center rounded-md border border-[#c8d6e5] bg-white px-3 focus-within:border-[#1f73e8] focus-within:ring-4 focus-within:ring-blue-100">
          <UserRound className="h-5 w-5 text-[#7188a0]" />
          <input className="h-12 flex-1 border-0 bg-transparent px-3 text-sm outline-none" name="login" placeholder="usuario@fmgranada.es" autoComplete="username" required />
        </span>
      </label>
      <label className="block">
        <span className="text-sm font-bold text-[#17324d]">Contraseña *</span>
        <span className="mt-1 flex items-center rounded-md border border-[#c8d6e5] bg-white px-3 focus-within:border-[#1f73e8] focus-within:ring-4 focus-within:ring-blue-100">
          <LockKeyhole className="h-5 w-5 text-[#7188a0]" />
          <input className="h-12 flex-1 border-0 bg-transparent px-3 text-sm outline-none" name="password" placeholder="Introduce tu contraseña" type="password" autoComplete="current-password" required />
          <Eye className="h-5 w-5 text-[#7188a0]" />
        </span>
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <label className="flex items-center gap-2 font-semibold text-[#17324d]">
          <input className="h-4 w-4" type="checkbox" />
          Recordar este dispositivo
        </label>
        <span className="font-bold text-[#1f73e8]">¿Has olvidado la contraseña?</span>
      </div>
      {error ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      <button className="btn btn-primary h-12 w-full text-base" disabled={loading} type="submit">
        {loading ? "Accediendo..." : "Acceder"}
      </button>
      <p className="border-t border-[#d7e2ee] pt-4 text-sm text-[#6b8299]">
        Contacta con un administrador del sistema para recuperar el acceso.
      </p>
    </form>
  );
}
