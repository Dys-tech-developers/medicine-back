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
} satisfies Prisma.PrestadorInclude;

export type PrestadorWithUser = Prisma.PrestadorGetPayload<{
  include: typeof prestadorWithUserInclude;
}>;
