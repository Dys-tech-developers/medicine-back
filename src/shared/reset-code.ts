import { randomInt } from "node:crypto";
import { env } from "../config/env.js";

export function generateResetCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function getResetCodeExpiresAt(): Date {
  return new Date(Date.now() + env.RESET_CODE_EXPIRES_MS);
}
