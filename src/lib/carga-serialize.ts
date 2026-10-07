import type { Carga, User } from "@prisma/client";

type CargaWithUsers = Carga & {
  createdBy?: Pick<User, "id" | "name" | "username">;
  updatedBy?: Pick<User, "id" | "name" | "username"> | null;
  deletedBy?: Pick<User, "id" | "name" | "username"> | null;
  voidedBy?: Pick<User, "id" | "name" | "username"> | null;
};

export function serializeCarga(carga: CargaWithUsers) {
  return {
    ...carga,
    fecha: carga.fecha.toISOString(),
    cantidadPrevista: Number(carga.cantidadPrevista),
    cantidadRealizada: Number(carga.cantidadRealizada),
    pendiente: Number(carga.cantidadPrevista) - Number(carga.cantidadRealizada),
    voidedAt: carga.voidedAt?.toISOString() ?? null,
    deletedAt: carga.deletedAt?.toISOString() ?? null,
    createdAt: carga.createdAt.toISOString(),
    updatedAt: carga.updatedAt.toISOString(),
  };
}

export function auditSafeCarga(carga: unknown) {
  return JSON.parse(JSON.stringify(carga, (_key, value) => {
    if (typeof value === "bigint") return value.toString();
    if (value && typeof value === "object" && "toJSON" in value && value.constructor?.name === "Decimal") {
      return Number(value);
    }
    return value;
  }));
}
