import type { Prisma, PrismaClient } from "@prisma/client";
import {
  userWithRolesInclude,
  type UserWithRoles,
} from "../../shared/prisma-includes/user.include.js";

export type { UserWithRoles };

const userListSelect = {
  id: true,
  nombre: true,
  email: true,
  estado: true,
  createdAt: true,
  roles: {
    include: {
      role: {
        select: {
          nombre: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

export type UserListRecord = Prisma.UserGetPayload<{ select: typeof userListSelect }>;

export interface PaginatedUsers {
  items: UserListRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export class UserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findPaginated(page: number, pageSize: number): Promise<PaginatedUsers> {
    const skip = (page - 1) * pageSize;

    const [items, total] = await Promise.all([
      this.db.user.findMany({
        select: userListSelect,
        orderBy: { id: "asc" },
        skip,
        take: pageSize,
      }),
      this.db.user.count(),
    ]);

    return { items, total, page, pageSize };
  }

  async findByIdWithRoles(id: number): Promise<UserWithRoles | null> {
    return this.db.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    });
  }

  async updateEstado(id: number, estado: boolean): Promise<UserWithRoles> {
    return this.db.user.update({
      where: { id },
      data: { estado },
      include: userWithRolesInclude,
    });
  }
}
