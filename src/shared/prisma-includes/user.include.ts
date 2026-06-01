import type { Prisma } from "@prisma/client";

export const userWithRolesInclude = {
  roles: {
    include: {
      role: true,
    },
  },
} satisfies Prisma.UserInclude;

export type UserWithRoles = Prisma.UserGetPayload<{ include: typeof userWithRolesInclude }>;
