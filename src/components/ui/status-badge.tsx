import { LoadStatus } from "@prisma/client";
import { clsx } from "clsx";
import { statusLabels } from "@/lib/format";

const classes: Record<LoadStatus, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800 border-amber-200",
  REALIZADA: "bg-emerald-100 text-emerald-800 border-emerald-200",
  PARCIAL: "bg-sky-100 text-sky-800 border-sky-200",
  INCIDENCIA: "bg-red-100 text-red-800 border-red-200",
  PENDIENTE_CALIDAD: "bg-violet-100 text-violet-800 border-violet-200",
  FALTA_STOCK: "bg-orange-100 text-orange-800 border-orange-200",
  ANULADA: "bg-slate-100 text-slate-700 border-slate-200",
};

export function StatusBadge({ status }: { status: LoadStatus }) {
  return (
    <span className={clsx("inline-flex whitespace-nowrap border px-2 py-1 text-xs font-bold", classes[status])}>
      {statusLabels[status]}
    </span>
  );
}
