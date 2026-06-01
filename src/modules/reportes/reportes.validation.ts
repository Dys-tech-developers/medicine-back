import { z } from "zod";
import { PERIODOS_CONTROL } from "../../shared/constants/periodo-control.js";

const optionalBooleanQuery = z
  .enum(["true", "false"])
  .transform((v) => v === "true")
  .optional();

const reportesFiltrosBase = z.object({
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
  prestadorId: z.coerce.number().int().positive().optional(),
  servicioId: z.coerce.number().int().positive().optional(),
  facturado: optionalBooleanQuery,
  pagado: optionalBooleanQuery,
  periodo: z.enum(PERIODOS_CONTROL).optional(),
});

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

export const reportesQuerySchema = reportesFiltrosBase.superRefine(validarRangoFechas);

export type ReportesQuery = z.output<typeof reportesQuerySchema>;

export const reportesVisitasQuerySchema = reportesFiltrosBase
  .extend({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
  })
  .superRefine(validarRangoFechas);

export type ReportesVisitasQuery = z.output<typeof reportesVisitasQuerySchema>;
