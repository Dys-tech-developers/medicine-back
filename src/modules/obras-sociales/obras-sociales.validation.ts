import { z } from "zod";

export const listObrasSocialesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().min(1).max(150).optional(),
  estado: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
});

export type ListObrasSocialesQuery = z.output<typeof listObrasSocialesQuerySchema>;

export const obraSocialIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const createObraSocialSchema = z.object({
  nombre: z.string().trim().min(1).max(150),
  codigo: z.string().trim().min(1).max(50),
  estado: z.boolean().default(true),
});

export type CreateObraSocialInput = z.infer<typeof createObraSocialSchema>;

export const updateObraSocialSchema = z.object({
  nombre: z.string().trim().min(1).max(150).optional(),
  codigo: z.string().trim().min(1).max(50).optional(),
  estado: z.boolean().optional(),
});

export type UpdateObraSocialInput = z.infer<typeof updateObraSocialSchema>;
