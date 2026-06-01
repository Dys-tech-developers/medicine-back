export const ROLE = {
  ADMIN: "ADMIN",
  OPERADOR: "OPERADOR",
  PRESTADOR: "PRESTADOR",
} as const;

export type AppRole = (typeof ROLE)[keyof typeof ROLE];
