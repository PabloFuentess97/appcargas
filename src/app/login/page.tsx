import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { LockKeyhole, ShieldCheck, UserRound, FileLock2 } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  await connection();
  const session = await getServerSession(authOptions);
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#f4f8fc] p-3 sm:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-7xl overflow-hidden border border-[#c8d6e5] bg-white shadow-sm lg:grid-cols-[270px_1fr]">
        <aside className="hidden bg-[#142638] p-6 text-white lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="grid h-16 w-16 place-items-center border border-white/25 bg-white/8 text-2xl font-black">AG</div>
            <div>
              <p className="text-sm font-black">Almacén General</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-slate-200">Fábrica de Municiones de Granada</p>
            </div>
          </div>
          <div className="mt-auto">
            <div className="h-20 rounded-md border border-white/10 bg-white/5" />
            <p className="mt-3 text-xs font-semibold text-slate-300">Seguridad · Control · Trazabilidad</p>
          </div>
        </aside>
        <section className="grid gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-14">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto grid h-52 w-52 place-items-center rounded-full bg-[#eaf4ff]">
              <div className="grid h-32 w-32 place-items-center rounded-full border-8 border-[#b9dcff] bg-[#1f73e8] text-white shadow-lg">
                <ShieldCheck className="h-16 w-16" />
              </div>
            </div>
            <h1 className="mt-7 text-3xl font-black text-[#0b1b33]">Bienvenido</h1>
            <p className="mt-2 text-lg font-semibold leading-relaxed text-[#45627f]">
              al sistema de gestión del<br />
              <span className="font-black text-[#0b1b33]">Almacén General</span><br />
              Fábrica de Municiones de Granada
            </p>
            <div className="mx-auto mt-8 max-w-sm border-t border-[#d7e2ee] pt-6 text-left">
              {[
                [ShieldCheck, "Entorno privado y seguro", "Solo personal autorizado"],
                [UserRound, "Acceso con credenciales corporativas", "Usuarios creados por administración"],
                [FileLock2, "Trazabilidad de accesos", "Registro de actividad del sistema"],
              ].map(([Icon, title, subtitle]) => (
                <div key={String(title)} className="mt-4 flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#e5f2ff] text-[#1f73e8]"><Icon className="h-5 w-5" /></span>
                  <span>
                    <span className="block text-sm font-black text-[#0b1b33]">{String(title)}</span>
                    <span className="text-xs font-semibold text-[#6b8299]">{String(subtitle)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="mx-auto w-full max-w-xl">
            <div className="app-card p-5 sm:p-8">
              <div className="flex items-start gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-md bg-[#e5f2ff] text-[#1f73e8]">
                  <LockKeyhole className="h-6 w-6" />
                </span>
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#6b8299]">Acceso al sistema</p>
                  <h2 className="mt-1 text-2xl font-black text-[#0b1b33]">Iniciar sesión</h2>
                  <p className="mt-1 text-sm font-semibold text-[#6b8299]">Introduce tus credenciales para continuar</p>
                </div>
              </div>
              <LoginForm />
              <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="font-black">No existe registro público.</p>
                <p>El acceso lo crea un administrador del sistema.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
