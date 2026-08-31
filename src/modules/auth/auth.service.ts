import { randomUUID } from "node:crypto";
import { AppError } from "../../core/errors/AppError.js";
import { hashPassword, verifyPassword } from "../../shared/password.js";
import { signAccessToken, verifyAccessToken } from "../../shared/jwt.js";
import {
  generateRefreshToken,
  getRefreshTokenExpiresAt,
  hashRefreshToken,
} from "../../shared/refresh-token.js";
import { generateResetCode, getResetCodeExpiresAt } from "../../shared/reset-code.js";
import { sendPasswordResetEmail } from "../../shared/mail/sendPasswordResetEmail.js";
import type { AuthRepository } from "./auth.repository.js";
import type { UserRepository } from "../users/users.repository.js";
import { assertEmailAvailable, normalizeProfileUpdate } from "../users/users.profile.js";
import type { UpdateUserProfileInput } from "../users/users.validation.js";
import type {
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  LogoutInput,
  RefreshTokenInput,
  RegisterInput,
  ResetPasswordInput,
} from "./auth.validation.js";
import type { AuthResponseDto, UserPublicDto } from "./auth.dto.js";
import { mapUserToPublicDto } from "./auth.mapper.js";
import type { UserWithRoles } from "./auth.repository.js";

const PASSWORD_RESET_GENERIC_MESSAGE =
  "Si el email existe, enviamos un código para restablecer la contraseña";

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponseDto> {
    const email = input.email.toLowerCase();
    const existing = await this.authRepository.findUserWithRolesByEmail(email);
    if (existing) {
      throw AppError.conflict("El email ya está registrado");
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.authRepository.createUserWithRole({
      nombre: input.nombre,
      email,
      passwordHash,
      roleName: "OPERADOR",
    });

    return this.issueTokenPair(user);
  }

  async login(input: LoginInput): Promise<AuthResponseDto> {
    const user = await this.authRepository.findUserWithRolesByEmail(input.email.toLowerCase());
    if (!user) {
      throw AppError.unauthorized("Credenciales inválidas");
    }

    if (!user.estado) {
      throw AppError.unauthorized("Usuario inactivo");
    }

    const passwordOk = await verifyPassword(input.password, user.passwordHash);
    if (!passwordOk) {
      throw AppError.unauthorized("Credenciales inválidas");
    }

    return this.issueTokenPair(user);
  }

  async refresh(input: RefreshTokenInput): Promise<AuthResponseDto> {
    const tokenHash = hashRefreshToken(input.refreshToken);
    const stored = await this.authRepository.findRefreshTokenByHash(tokenHash);

    if (!stored) {
      throw AppError.unauthorized("Refresh token inválido");
    }

    if (stored.revokedAt) {
      await this.authRepository.revokeRefreshTokenFamily(stored.familyId);
      throw AppError.unauthorized("Refresh token inválido");
    }

    if (stored.expiresAt < new Date()) {
      await this.authRepository.revokeRefreshToken(stored.tokenHash);
      throw AppError.unauthorized("Refresh token expirado");
    }

    const user = await this.authRepository.findUserWithRolesById(stored.userId);
    if (!user?.estado) {
      await this.authRepository.revokeRefreshTokenFamily(stored.familyId);
      throw AppError.unauthorized("Usuario no autorizado");
    }

    await this.authRepository.revokeRefreshToken(stored.tokenHash);

    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = generateRefreshToken();

    await this.authRepository.createRefreshToken({
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      familyId: stored.familyId,
      expiresAt: getRefreshTokenExpiresAt(),
    });

    await this.authRepository.deleteExpiredRefreshTokens();

    return {
      accessToken,
      refreshToken,
      user: mapUserToPublicDto(user),
    };
  }

  async getProfile(userId: number): Promise<UserPublicDto> {
    const user = await this.authRepository.findUserWithRolesById(userId);
    if (!user) {
      throw AppError.notFound("Usuario no encontrado");
    }
    return mapUserToPublicDto(user);
  }

  async updateMe(userId: number, input: UpdateUserProfileInput): Promise<UserPublicDto> {
    const existing = await this.authRepository.findUserWithRolesById(userId);
    if (!existing) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const data = normalizeProfileUpdate(input);
    if (data.email !== undefined) {
      await assertEmailAvailable(this.userRepository, data.email, userId);
    }

    const updated = await this.userRepository.updateProfile(userId, data);
    return mapUserToPublicDto(updated);
  }

  async forgotPassword(input: ForgotPasswordInput): Promise<{ message: string }> {
    const user = await this.authRepository.findUserForPasswordReset(input.email.toLowerCase());

    if (!user?.estado) {
      return { message: PASSWORD_RESET_GENERIC_MESSAGE };
    }

    const code = generateResetCode();
    const resetCodeHash = await hashPassword(code);

    await this.authRepository.setPasswordResetCode(
      user.id,
      resetCodeHash,
      getResetCodeExpiresAt(),
    );

    try {
      await sendPasswordResetEmail({
        to: user.email,
        nombre: user.nombre,
        code,
      });
    } catch (error) {
      console.error("[mail] Falló el envío del email de recuperación:", error);
      await this.authRepository.clearPasswordResetCode(user.id);
      throw AppError.internal(
        "No pudimos enviar el correo de recuperación. Intentá de nuevo en unos minutos.",
      );
    }

    return { message: PASSWORD_RESET_GENERIC_MESSAGE };
  }

  async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const user = await this.authRepository.findUserForPasswordReset(input.email.toLowerCase());

    if (!user?.estado || !user.resetCodeHash || !user.resetCodeExpiresAt) {
      throw AppError.badRequest("Código inválido o expirado");
    }

    if (user.resetCodeExpiresAt < new Date()) {
      await this.authRepository.clearPasswordResetCode(user.id);
      throw AppError.badRequest("Código inválido o expirado");
    }

    const codeOk = await verifyPassword(input.code, user.resetCodeHash);
    if (!codeOk) {
      throw AppError.badRequest("Código inválido o expirado");
    }

    const newHash = await hashPassword(input.newPassword);
    await this.authRepository.resetPassword(user.id, newHash);
    await this.authRepository.revokeAllRefreshTokensForUser(user.id);

    return { message: "Contraseña restablecida correctamente" };
  }

  async changePassword(userId: number, input: ChangePasswordInput): Promise<{ message: string }> {
    const passwordHash = await this.userRepository.findPasswordHashById(userId);
    if (!passwordHash) {
      throw AppError.notFound("Usuario no encontrado");
    }

    const currentOk = await verifyPassword(input.currentPassword, passwordHash);
    if (!currentOk) {
      throw AppError.unauthorized("La contraseña actual es incorrecta");
    }

    if (input.currentPassword === input.newPassword) {
      throw AppError.badRequest("La nueva contraseña debe ser distinta a la actual");
    }

    const newHash = await hashPassword(input.newPassword);
    await this.userRepository.updatePasswordHash(userId, newHash);
    await this.authRepository.revokeAllRefreshTokensForUser(userId);

    return { message: "Contraseña actualizada correctamente" };
  }

  async logout(accessToken: string | null, input: LogoutInput): Promise<{ message: string }> {
    if (accessToken) {
      try {
        const verified = verifyAccessToken(accessToken);
        const alreadyRevoked = await this.authRepository.isTokenRevoked(verified.jti);
        if (!alreadyRevoked) {
          await this.authRepository.revokeToken(verified.jti, new Date(verified.exp * 1000));
        }
      } catch {
        // Access token expirado o inválido: igual se puede cerrar sesión con refresh token.
      }
    }

    if (input.refreshToken) {
      await this.authRepository.revokeRefreshToken(hashRefreshToken(input.refreshToken));
    }

    await this.authRepository.deleteExpiredRevokedTokens();
    await this.authRepository.deleteExpiredRefreshTokens();

    return { message: "Sesión cerrada correctamente" };
  }

  async logoutAll(userId: number, accessToken: string): Promise<{ message: string }> {
    let verified;
    try {
      verified = verifyAccessToken(accessToken);
    } catch {
      throw AppError.unauthorized("Token inválido o expirado");
    }

    if (verified.sub !== userId) {
      throw AppError.unauthorized("Token inválido o expirado");
    }

    const alreadyRevoked = await this.authRepository.isTokenRevoked(verified.jti);
    if (!alreadyRevoked) {
      await this.authRepository.revokeToken(verified.jti, new Date(verified.exp * 1000));
    }

    await this.authRepository.revokeAllRefreshTokensForUser(userId);
    await this.authRepository.deleteExpiredRevokedTokens();
    await this.authRepository.deleteExpiredRefreshTokens();

    return { message: "Todas las sesiones fueron cerradas correctamente" };
  }

  private async issueTokenPair(user: UserWithRoles): Promise<AuthResponseDto> {
    const accessToken = signAccessToken({ sub: user.id, email: user.email });
    const refreshToken = generateRefreshToken();

    await this.authRepository.createRefreshToken({
      tokenHash: hashRefreshToken(refreshToken),
      userId: user.id,
      familyId: randomUUID(),
      expiresAt: getRefreshTokenExpiresAt(),
    });

    await this.authRepository.deleteExpiredRefreshTokens();

    return {
      accessToken,
      refreshToken,
      user: mapUserToPublicDto(user),
    };
  }
}
