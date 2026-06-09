import { z } from "zod";

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListUsersQuery = z.output<typeof listUsersQuerySchema>;

export const userIdParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type UserIdParam = z.infer<typeof userIdParamSchema>;

export const updateUserEstadoSchema = z.object({
  estado: z.boolean(),
});

export type UpdateUserEstadoInput = z.infer<typeof updateUserEstadoSchema>;

export const updateUserProfileSchema = z
  .object({
    nombre: z.string().min(1).max(100).optional(),
    email: z.string().email().max(150).optional(),
  })
  .refine((data) => data.nombre !== undefined || data.email !== undefined, {
    message: "Debés enviar al menos nombre o email",
  });

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
