import { z } from "zod";

export const listInsumosQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  estado: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  bajoStock: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListInsumosQuery = z.output<typeof listInsumosQuerySchema>;

export const insumoIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type InsumoIdParam = z.infer<typeof insumoIdParamSchema>;

const insumoBaseFields = {
  nombre: z.string().min(1).max(150),
  descripcion: z.string().max(5000).optional().nullable(),
  codigo: z.string().min(1).max(50),
  stockActual: z.coerce.number().int().min(0).optional(),
  stockMinimo: z.coerce.number().int().min(0).optional(),
  unidadMedida: z.string().min(1).max(20),
  requiereVencimiento: z.boolean().optional(),
  fechaVencimiento: z.coerce.date().optional().nullable(),
  estado: z.boolean().optional(),
};

export const createInsumoSchema = z
  .object({
    ...insumoBaseFields,
    stockActual: z.coerce.number().int().min(0).default(0),
    stockMinimo: z.coerce.number().int().min(0).default(0),
    requiereVencimiento: z.boolean().default(false),
    estado: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.requiereVencimiento && !data.fechaVencimiento) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fechaVencimiento es obligatoria cuando requiereVencimiento es true",
        path: ["fechaVencimiento"],
      });
    }
  });

export type CreateInsumoInput = z.infer<typeof createInsumoSchema>;

export const updateInsumoSchema = z
  .object({
    nombre: z.string().min(1).max(150).optional(),
    descripcion: z.string().max(5000).optional().nullable(),
    codigo: z.string().min(1).max(50).optional(),
    stockActual: z.coerce.number().int().min(0).optional(),
    stockMinimo: z.coerce.number().int().min(0).optional(),
    unidadMedida: z.string().min(1).max(20).optional(),
    requiereVencimiento: z.boolean().optional(),
    fechaVencimiento: z.coerce.date().optional().nullable(),
    estado: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.requiereVencimiento === true && data.fechaVencimiento === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fechaVencimiento es obligatoria cuando requiereVencimiento es true",
        path: ["fechaVencimiento"],
      });
    }
  });

export type UpdateInsumoInput = z.infer<typeof updateInsumoSchema>;
