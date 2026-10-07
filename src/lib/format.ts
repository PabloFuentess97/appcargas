import { LoadStatus, MovementType, Role } from "@prisma/client";

export const statusLabels: Record<LoadStatus, string> = {
  PENDIENTE: "Pendiente",
  REALIZADA: "Realizada",
  PARCIAL: "Parcial",
  INCIDENCIA: "Incidencia",
  PENDIENTE_CALIDAD: "Pendiente calidad",
  FALTA_STOCK: "Falta stock",
  ANULADA: "Anulada",
};

export const movementLabels: Record<MovementType, string> = {
  CARGA_OF: "Carga OF",
  TRASIEGO: "Trasiego",
  MOVIMIENTO_STOCK: "Movimiento stock",
  DEVOLUCION: "Devolución",
};

export const roleLabels: Record<Role, string> = {
  ADMINISTRADOR: "Administrador",
  ADMINISTRATIVO: "Administrativo",
  LECTURA: "Lectura",
};

export function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("es-ES").format(new Date(value));
}

export function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatNumber(value: number | string) {
  return new Intl.NumberFormat("es-ES", { maximumFractionDigits: 3 }).format(Number(value));
}
