import { z } from "zod";
import { PERIODOS_CONTROL } from "../../shared/constants/periodo-control.js";
import { REGIMENES_IVA } from "../../shared/constants/regimen-iva.js";

const validarRangoFechas = (
  data: { fechaDesde?: Date; fechaHasta?: Date },
  ctx: z.RefinementCtx,
): void => {
  if (
    data.fechaDesde !== undefined &&
    data.fechaHasta !== undefined &&
    data.fechaDesde > data.fechaHasta
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "fechaDesde no puede ser posterior a fechaHasta",
      path: ["fechaDesde"],
    });
  }
};

export const listPrestadoresQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    fechaDesde: z.coerce.date().optional(),
    fechaHasta: z.coerce.date().optional(),
    periodo: z.enum(PERIODOS_CONTROL).optional(),
  })
  .superRefine(validarRangoFechas);

export type ListPrestadoresQuery = z.output<typeof listPrestadoresQuerySchema>;

export function listPrestadoresIncluyeEstadoCuenta(query: ListPrestadoresQuery): boolean {
  return (
    query.periodo !== undefined ||
    query.fechaDesde !== undefined ||
    query.fechaHasta !== undefined
  );
}

export const createPrestadorSchema = z.object({
  nombre: z.string().min(1).max(100),
  email: z.string().email().max(150),
  password: z
    .string()
    .min(10)
    .max(72, "La contraseña no puede superar los 72 caracteres (límite de bcrypt)"),
  telefono: z.string().min(1).max(20),
  lugarResidencia: z.string().min(1).max(255),
  documento: z.string().min(1).max(20),
  matricula: z.string().min(1).max(50),
  cuit: z.string().min(1).max(20),
  cbu: z.string().min(1).max(150),
  regimenIva: z.enum(REGIMENES_IVA),
  estado: z.boolean().optional(),
});

export type CreatePrestadorInput = z.infer<typeof createPrestadorSchema>;
