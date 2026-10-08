import { LoadStatus, MovementType } from "@prisma/client";
import { z } from "zod";

export function normalizeNumberInput(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return value;

  const cleaned = value
    .trim()
    .replace(/\s/g, "")
    .replace(/[a-zA-Z]+/g, "");

  if (!cleaned) return Number.NaN;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    return Number(cleaned.replaceAll(thousandsSeparator, "").replace(decimalSeparator, "."));
  }

  if (hasComma) return Number(cleaned.replace(",", "."));
  return Number(cleaned);
}

const requiredNumber = (schema: z.ZodNumber) => z.preprocess(normalizeNumberInput, schema);
const optionalText = z.string().trim().optional().nullable().transform((value) => value || null);

export const cargaSchema = z.object({
  fecha: z.coerce.date({ error: "La fecha es obligatoria." }),
  tipoMovimiento: z.enum(MovementType, { error: "Tipo de movimiento no válido." }),
  nbiEntrega: optionalText,
  nbiRecepcion: optionalText,
  codigoArticulo: z.string().trim().min(1, "El código de artículo es obligatorio."),
  descripcionArticulo: z.string().trim().min(1, "La descripción es obligatoria."),
  lote: optionalText,
  cantidadPrevista: requiredNumber(z.number({ error: "Introduce un número válido." }).gt(0, "La cantidad prevista debe ser mayor que 0.")),
  cantidadRealizada: requiredNumber(z.number({ error: "Introduce un número válido." }).min(0, "La cantidad realizada no puede ser negativa.")).default(0),
  ubicacionOrigen: optionalText,
  ubicacionDestino: optionalText,
  ordenFabricacion: optionalText,
  comentario: optionalText,
  estado: z.enum(LoadStatus).default("PENDIENTE"),
}).refine((data) => data.cantidadRealizada <= data.cantidadPrevista, {
  path: ["cantidadRealizada"],
  message: "La cantidad realizada no puede superar la prevista.",
});

export const bulkCargaSchema = z.object({
  common: z.object({
    fecha: z.coerce.date({ error: "La fecha es obligatoria." }),
    tipoMovimiento: z.enum(MovementType),
    nbiEntrega: optionalText,
    nbiRecepcion: optionalText,
    ubicacionDestino: optionalText,
    ordenFabricacion: optionalText,
  }),
  rows: z.array(z.object({
    codigoArticulo: z.string().trim().min(1, "Código obligatorio."),
    descripcionArticulo: z.string().trim().min(1, "Descripción obligatoria."),
    lote: optionalText,
    cantidadPrevista: requiredNumber(z.number({ error: "Introduce un número válido." }).gt(0, "Cantidad mayor que 0.")),
    ubicacionOrigen: optionalText,
    ubicacionDestino: optionalText,
    ordenFabricacion: optionalText,
    comentario: optionalText,
  })).min(1, "Añade al menos una línea."),
});

export const voidCargaSchema = z.object({
  motivo: z.string().trim().min(3, "Indica un motivo de anulación."),
});
