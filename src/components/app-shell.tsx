import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Boxes,
  CheckSquare,
  Clock3,
  Home,
  Menu,
  Package,
  Plus,
  Settings,
  Shuffle,
  Users,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import { roleLabels } from "@/lib/format";
import { SignOutButton } from "@/components/sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/cargas", label: "Cargas", icon: Package },
  { href: "/cargas/nueva", label: "Nueva carga", icon: Plus },
  { href: "/cargas?tipo=TRASIEGO", label: "Trasiegos", icon: Shuffle },
  { href: "/cargas?tipo=MOVIMIENTO_STOCK", label: "Movimientos stock", icon: Boxes },
  { href: "/cargas?estado=INCIDENCIA", label: "Incidencias", icon: AlertTriangle },
  { href: "/cargas?estado=PENDIENTE_CALIDAD", label: "Validación OF", icon: CheckSquare },
  { href: "/dashboard", label: "Historial", icon: Clock3 },
  { href: "/dashboard", label: "Informes", icon: BarChart3 },
  { href: "/usuarios", label: "Usuarios", icon: Users },
  { href: "/configuracion", label: "Configuración", icon: Settings },
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
    <div className="min-h-screen bg-[#eef3f8] text-slate-900 lg:flex">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[270px] border-r border-[#284356] bg-[#142638] text-white lg:block">
        <div className="border-b border-white/12 px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center border border-white/25 bg-white/8 text-2xl font-black">AG</div>
            <div>
              <p className="text-sm font-black leading-tight">Almacén General</p>
              <p className="mt-1 text-xs font-semibold leading-snug text-slate-200">Fábrica de Municiones de Granada</p>
            </div>
          </div>
        </div>
        <nav className="space-y-1 px-2.5 py-4">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-[#1f73e8] hover:text-white"
            >
              <item.icon className="h-5 w-5 text-slate-200 group-hover:text-white" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 p-5">
          <div className="h-16 rounded-md border border-white/10 bg-white/5" />
          <p className="mt-3 text-xs font-semibold text-slate-300">Seguridad · Control · Trazabilidad</p>
        </div>
      </aside>
      <div className="min-w-0 flex-1 lg:pl-[270px]">
        <header className="sticky top-0 z-20 border-b border-[#d7e2ee] bg-white/95 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-4 px-3 sm:px-5 lg:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button className="grid h-10 w-10 place-items-center border border-[#d7e2ee] bg-white text-[#17324d] lg:hidden" type="button">
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="truncate text-lg font-black text-[#0b1b33]">Almacén General</p>
                <p className="hidden text-xs font-semibold text-slate-500 sm:block">Gestión interna de cargas de materiales</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="relative hidden h-10 w-10 place-items-center border border-[#d7e2ee] bg-white text-[#17324d] sm:grid" type="button">
                <Bell className="h-5 w-5" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#1f73e8]" />
              </button>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold">{session.user.name}</p>
                <p className="text-xs text-slate-500">{roleLabels[session.user.role as keyof typeof roleLabels]}</p>
              </div>
              <div className="grid h-10 w-10 place-items-center rounded-full border border-[#c8d6e5] bg-[#eaf2fb] text-sm font-black text-[#17324d]">{initials}</div>
              <SignOutButton />
            </div>
          </div>
          <nav className="table-scroll flex gap-2 overflow-x-auto border-t border-[#edf3f9] px-3 py-2 lg:hidden">
            {nav.slice(0, 7).map((item) => (
              <Link key={item.href} href={item.href} className="inline-flex shrink-0 items-center gap-2 rounded-md border border-[#d7e2ee] bg-white px-3 py-2 text-xs font-bold text-[#17324d]">
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="px-3 py-4 sm:px-5 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
