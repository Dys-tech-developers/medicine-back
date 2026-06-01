import type { PrismaClient } from "@prisma/client";
import { AppError } from "../../core/errors/AppError.js";
import {
  userWithRolesInclude,
  type UserWithRoles,
} from "../../shared/prisma-includes/user.include.js";

export type { UserWithRoles };

export class AuthRepository {
  constructor(private readonly db: PrismaClient) {}

  async findUserWithRolesByEmail(email: string): Promise<UserWithRoles | null> {
    return this.db.user.findUnique({
      where: { email: email.toLowerCase() },
      include: userWithRolesInclude,
    });
  }

  async findUserWithRolesById(id: number): Promise<UserWithRoles | null> {
    return this.db.user.findUnique({
      where: { id },
      include: userWithRolesInclude,
    });
  }

  async createUserWithRole(input: {
    nombre: string;
    email: string;
    passwordHash: string;
    roleName: string;
  }): Promise<UserWithRoles> {
    return this.db.$transaction(async (tx) => {
      const role = await tx.role.findFirst({
        where: { nombre: input.roleName },
      });

      if (!role) {
        throw AppError.internal(
          `Rol ${input.roleName} no encontrado. Ejecutá el seed de roles antes de registrar usuarios.`,
        );
      }

      const user = await tx.user.create({
        data: {
          nombre: input.nombre,
          email: input.email.toLowerCase(),
          passwordHash: input.passwordHash,
          roles: {
            create: {
              rolId: role.id,
            },
          },
        },
        include: userWithRolesInclude,
      });

      return user;
    });
  }

  async isTokenRevoked(jti: string): Promise<boolean> {
    const row = await this.db.revokedToken.findUnique({
      where: { jti },
      select: { jti: true },
    });
    return row !== null;
  }

  async revokeToken(jti: string, expiresAt: Date): Promise<void> {
    await this.db.revokedToken.upsert({
      where: { jti },
      update: { expiresAt },
      create: { jti, expiresAt },
    });
  }

  async deleteExpiredRevokedTokens(): Promise<void> {
    await this.db.revokedToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
