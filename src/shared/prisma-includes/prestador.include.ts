import type { Prisma } from "@prisma/client";

export const prestadorWithUserInclude = {
  user: {
    select: {
      id: true,
      nombre: true,
      email: true,
      estado: true,
    },
  },
  servicios: {
    include: {
      servicio: {
        select: {
          id: true,
          nombre: true,
          estado: true,
        },
      },
    },
    orderBy: { servicio: { nombre: "asc" as const } },
  },
} satisfies Prisma.PrestadorInclude;

export type PrestadorWithUser = Prisma.PrestadorGetPayload<{
  include: typeof prestadorWithUserInclude;
}>;
