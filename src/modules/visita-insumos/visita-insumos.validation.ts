import { z } from "zod";

export const visitaIdParamSchema = z.object({
  visitaId: z.coerce.number().int().positive(),
});

export type VisitaIdParam = z.infer<typeof visitaIdParamSchema>;

const consumoItemSchema = z.object({
  insumoId: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().int().positive(),
});

export const registerVisitaInsumosBodySchema = z
  .object({
    insumoId: z.coerce.number().int().positive().optional(),
    cantidad: z.coerce.number().int().positive().optional(),
    items: z.array(consumoItemSchema).min(1).optional(),
  })
  .superRefine((data, ctx) => {
    const hasSingle =
      data.insumoId !== undefined && data.cantidad !== undefined;
    const hasBulk = data.items !== undefined && data.items.length > 0;

    if (!hasSingle && !hasBulk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enviá insumoId y cantidad, o un array items",
        path: ["items"],
      });
    }

    if (hasSingle && hasBulk) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Usá insumoId/cantidad o items, no ambos a la vez",
        path: ["items"],
      });
    }
  });

export type RegisterVisitaInsumosBody = z.infer<typeof registerVisitaInsumosBodySchema>;

export type ConsumoItem = z.infer<typeof consumoItemSchema>;

export function normalizeConsumoItems(body: RegisterVisitaInsumosBody): ConsumoItem[] {
  if (body.items !== undefined && body.items.length > 0) {
    return body.items;
  }
  if (body.insumoId !== undefined && body.cantidad !== undefined) {
    return [{ insumoId: body.insumoId, cantidad: body.cantidad }];
  }
  return [];
}
