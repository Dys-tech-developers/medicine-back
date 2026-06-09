import type { Response } from "express";
import type { ApiSuccess } from "../../core/http/apiResponse.js";
import { AppError } from "../../core/errors/AppError.js";
import { wrapAsync } from "../../core/http/wrapAsync.js";
import { parseWithSchema } from "../../core/validation/parseWithSchema.js";
import type { UserService } from "./users.service.js";
import {
  listUsersQuerySchema,
  updateUserEstadoSchema,
  updateUserProfileSchema,
  userIdParamSchema,
} from "./users.validation.js";
import type { PaginatedUsersDto } from "./users.dto.js";
import type { UserPublicDto } from "../auth/auth.dto.js";

export class UserController {
  constructor(private readonly userService: UserService) {}

  list = wrapAsync(async (req, res: Response<ApiSuccess<PaginatedUsersDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const query = parseWithSchema(listUsersQuerySchema, req.query);
    const result = await this.userService.list(query);
    res.status(200).json({ success: true, data: result });
  });

  getById = wrapAsync(async (req, res: Response<ApiSuccess<UserPublicDto>>) => {
    if (!req.auth) {
      throw AppError.unauthorized();
    }
    const { id } = parseWithSchema(userIdParamSchema, req.params);
    const user = await this.userService.getById(req.auth.userId, req.auth.roles, id);
    res.status(200).json({ success: true, data: user });
  });

  updateEstado = wrapAsync(async (req, res: Response<ApiSuccess<UserPublicDto>>) => {
    const { id } = parseWithSchema(userIdParamSchema, req.params);
    const body = parseWithSchema(updateUserEstadoSchema, req.body);
    const user = await this.userService.updateEstado(id, body);
    res.status(200).json({ success: true, data: user });
  });

  updateProfile = wrapAsync(async (req, res: Response<ApiSuccess<UserPublicDto>>) => {
    const { id } = parseWithSchema(userIdParamSchema, req.params);
    const body = parseWithSchema(updateUserProfileSchema, req.body);
    const user = await this.userService.updateProfile(id, body);
    res.status(200).json({ success: true, data: user });
  });
}
