import { AppError } from "@/lib/errors";
import type { LinkStatus } from "./schema";

export function parseExpiry(
  value: string | null | undefined,
  previous?: Date | null,
  now = new Date(),
) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const date = new Date(value);
  if (
    Number.isNaN(date.getTime()) ||
    (date <= now && date.getTime() !== previous?.getTime())
  ) {
    throw new AppError(
      422,
      "INVALID_EXPIRY",
      "A expiração precisa estar no futuro.",
    );
  }
  return date;
}

export function linkStatus(
  link: {
    blockedAt: Date | null;
    isActive: boolean;
    expiresAt: Date | null;
    clickLimit: number | null;
    clickCount: number;
  },
  now = new Date(),
): LinkStatus {
  if (link.blockedAt) return "blocked";
  if (!link.isActive) return "inactive";
  if (link.expiresAt && link.expiresAt <= now) return "expired";
  if (link.clickLimit !== null && link.clickCount >= link.clickLimit)
    return "limited";
  return "active";
}
