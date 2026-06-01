import type { z } from "zod";

export function parseWithSchema<T extends z.ZodTypeAny>(schema: T, value: unknown): z.output<T> {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw parsed.error;
  }
  // `safeParse` tipa `data` como salida del schema; ESLint no infiere bien Zod aquí.
  const data: z.output<T> = parsed.data as z.output<T>;
  return data;
}
