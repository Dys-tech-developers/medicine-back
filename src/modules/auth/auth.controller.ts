import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { AppError } from "../../core/errors/AppError.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { AuthService } from "./auth.service.js";
import { loginSchema, registerSchema } from "./auth.validation.js";
import { extractBearerToken } from "../../shared/http/extractBearerToken.js";
import type { AuthResponseDto, LogoutResponseDto, UserPublicDto } from "./auth.dto.js";

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register = wrapAsync(async (req, res: Response<ApiSuccess<AuthResponseDto>>) => {
    const input = parseWithSchema(registerSchema, req.body);
    const result = await this.authService.register(input);
    res.status(201).json({ success: true, data: result });
  });

  login = wrapAsync(async (req, res: Response<ApiSuccess<AuthResponseDto>>) => {
    const input = parseWithSchema(loginSchema, req.body);
    const result = await this.authService.login(input);
    res.status(200).json({ success: true, data: result });
  });

  me = wrapAsync(async (req, res: Response<ApiSuccess<UserPublicDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const profile = await this.authService.getProfile(req.auth.userId);
    res.status(200).json({ success: true, data: profile });
  });

  logout = wrapAsync(async (req, res: Response<ApiSuccess<LogoutResponseDto>>) => {
    const token = extractBearerToken(req.headers.authorization);
    if (!token) {
      throw AppError.unauthorized("Token no enviado");
    }
    const result = await this.authService.logout(token);
    res.status(200).json({ success: true, data: result });
  });
}
