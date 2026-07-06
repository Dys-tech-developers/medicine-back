const DURATION_PATTERN = /^(\d+)([smhd])$/;

export function parseDurationToMs(duration: string): number {
  const match = DURATION_PATTERN.exec(duration.trim());
  if (!match) {
    throw new Error(`Duración inválida: ${duration}`);
  }

  const amount = match[1];
  const unit = match[2];
  if (!amount || !unit) {
    throw new Error(`Duración inválida: ${duration}`);
  }

  const value = Number.parseInt(amount, 10);

  switch (unit) {
    case "s":
      return value * 1_000;
    case "m":
      return value * 60_000;
    case "h":
      return value * 3_600_000;
    case "d":
      return value * 86_400_000;
    default:
      throw new Error(`Unidad de duración inválida: ${unit}`);
  }
}
