"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

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
    <form className="mt-7 space-y-4" onSubmit={onSubmit}>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Usuario o correo</span>
        <input className="field mt-1" name="login" autoComplete="username" required />
      </label>
      <label className="block">
        <span className="text-sm font-bold text-slate-700">Contraseña</span>
        <input className="field mt-1" name="password" type="password" autoComplete="current-password" required />
      </label>
      {error ? <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
      <button className="btn btn-primary w-full" disabled={loading} type="submit">
        {loading ? "Accediendo..." : "Acceder"}
      </button>
    </form>
  );
}
