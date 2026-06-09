import { z } from "zod";

export const listVisitasQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  prestadorId: z.coerce.number().int().positive().optional(),
  pacienteServicioId: z.coerce.number().int().positive().optional(),
  fechaDesde: z.coerce.date().optional(),
  fechaHasta: z.coerce.date().optional(),
});

export type ListVisitasQuery = z.output<typeof listVisitasQuerySchema>;

export const visitaIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type VisitaIdParam = z.infer<typeof visitaIdParamSchema>;

const visitaFechasRefine = (
  data: { fechaInicio: Date; fechaFin?: Date | undefined },
  ctx: z.RefinementCtx,
): void => {
  if (data.fechaFin !== undefined && data.fechaFin <= data.fechaInicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "fechaFin debe ser posterior a fechaInicio",
      path: ["fechaFin"],
    });
  }
};

export const createVisitaSchema = z
  .object({
    pacienteServicioId: z.coerce.number().int().positive(),
    prestadorId: z.coerce.number().int().positive().optional(),
    fechaInicio: z.coerce.date(),
    fechaFin: z.coerce.date().optional(),
    tiempoMinutos: z.coerce.number().int().min(1).max(720),
    observaciones: z.string().max(5000).optional().nullable(),
  })
  .superRefine(visitaFechasRefine);

export type CreateVisitaInput = z.infer<typeof createVisitaSchema>;

export const updateVisitaSchema = z
  .object({
    pacienteServicioId: z.coerce.number().int().positive().optional(),
    prestadorId: z.coerce.number().int().positive().optional(),
    fechaInicio: z.coerce.date().optional(),
    fechaFin: z.coerce.date().optional(),
    tiempoMinutos: z.coerce.number().int().min(1).max(720).optional(),
    observaciones: z.string().max(5000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.fechaInicio !== undefined && data.fechaFin !== undefined) {
      visitaFechasRefine(
        { fechaInicio: data.fechaInicio, fechaFin: data.fechaFin },
        ctx,
      );
    }
  });

export type UpdateVisitaInput = z.infer<typeof updateVisitaSchema>;

const finanzasFlagsRefine = (
  data: { facturado?: boolean; pagado?: boolean },
  ctx: z.RefinementCtx,
): void => {
  if (data.facturado === undefined && data.pagado === undefined) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Debe indicar al menos facturado o pagado",
    });
  }
};

export const updateVisitaFinanzasSchema = z
  .object({
    facturado: z.boolean().optional(),
    pagado: z.boolean().optional(),
  })
  .superRefine(finanzasFlagsRefine);

export type UpdateVisitaFinanzasInput = z.infer<typeof updateVisitaFinanzasSchema>;

export const bulkUpdateVisitaFinanzasSchema = z
  .object({
    visitaIds: z.array(z.coerce.number().int().positive()).min(1).max(200),
    facturado: z.boolean().optional(),
    pagado: z.boolean().optional(),
  })
  .superRefine(finanzasFlagsRefine);

export type BulkUpdateVisitaFinanzasInput = z.infer<typeof bulkUpdateVisitaFinanzasSchema>;

export const visitaPendienteQuerySchema = z.object({
  pacienteServicioId: z.coerce.number().int().positive(),
});

export type VisitaPendienteQuery = z.infer<typeof visitaPendienteQuerySchema>;

export const iniciarVisitaSchema = z.object({
  pacienteServicioId: z.coerce.number().int().positive(),
});

export type IniciarVisitaInput = z.infer<typeof iniciarVisitaSchema>;

export const finalizarVisitaSchema = z.object({
  observaciones: z.string().max(5000).optional().nullable(),
});

export type FinalizarVisitaInput = z.infer<typeof finalizarVisitaSchema>;
