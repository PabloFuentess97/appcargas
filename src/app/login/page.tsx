import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen bg-[#071b33] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="flex items-center px-8 py-10 text-white lg:px-16">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-200">Aplicación privada de uso interno</p>
          <h1 className="mt-5 text-4xl font-black tracking-tight lg:text-6xl">Almacén General</h1>
          <p className="mt-4 text-2xl font-semibold text-blue-100">Fábrica de Municiones de Granada</p>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-sm">
            <div className="border border-white/15 bg-white/8 p-4">
              <p className="font-black">Cargas</p>
              <p className="mt-1 text-blue-100">Registro rápido tipo Excel</p>
            </div>
            <div className="border border-white/15 bg-white/8 p-4">
              <p className="font-black">Trazabilidad</p>
              <p className="mt-1 text-blue-100">Historial y auditoría</p>
            </div>
            <div className="border border-white/15 bg-white/8 p-4">
              <p className="font-black">Control</p>
              <p className="mt-1 text-blue-100">Roles y permisos</p>
            </div>
          </div>
        </div>
      </section>
      <section className="flex items-center justify-center bg-slate-100 px-6 py-10">
        <div className="w-full max-w-md border border-slate-200 bg-white p-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-500">Acceso al sistema</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900">Iniciar sesión</h2>
          <LoginForm />
          <p className="mt-6 border-t border-slate-200 pt-4 text-sm text-slate-500">
            ¿Has olvidado la contraseña? Contacta con un administrador del sistema.
          </p>
        </div>
      </section>
    </main>
  );
}
