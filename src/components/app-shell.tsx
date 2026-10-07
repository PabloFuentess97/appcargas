import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { authOptions } from "@/lib/auth";
import { roleLabels } from "@/lib/format";
import { SignOutButton } from "@/components/sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/cargas", label: "Cargas", icon: "▤" },
  { href: "/cargas/nueva", label: "Nueva carga", icon: "+" },
  { href: "/usuarios", label: "Usuarios", icon: "◉" },
  { href: "/configuracion", label: "Configuración", icon: "⚙" },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const initials = (session.user.name || session.user.username || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f3f6fa] text-slate-900 lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[#10243f] bg-[#071b33] text-white lg:block">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-200">Almacén General</p>
          <h1 className="mt-1 text-lg font-black leading-tight">Fábrica de Municiones de Granada</h1>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-blue-600 hover:text-white"
            >
              <span className="grid h-7 w-7 place-items-center bg-white/10 text-sm">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0 flex-1 lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
          <div className="flex min-h-16 items-center justify-between gap-4 px-4 lg:px-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sistema interno</p>
              <p className="text-sm font-semibold text-slate-700">Gestión de cargas de materiales</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold">{session.user.name}</p>
                <p className="text-xs text-slate-500">{roleLabels[session.user.role as keyof typeof roleLabels]}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center bg-[#1d4ed8] text-sm font-black text-white">{initials}</div>
              <SignOutButton />
            </div>
          </div>
        </header>
        <main className="px-4 py-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
