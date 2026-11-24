import { z } from "zod";
import { db } from "@/lib/db";
import { validTimezone } from "@/modules/analytics/period";
import { validateDestination } from "@/modules/links/destination";
import { AppError } from "@/lib/errors";

const settingsSchema = z.strictObject({
  name: z.string().trim().min(1, "Informe seu nome.").max(80),
  image: z.string().trim().max(2048).nullable(),
  theme: z.enum(["DARK", "LIGHT", "SYSTEM"]),
  timezone: z
    .string()
    .trim()
    .max(80)
    .refine(validTimezone, "Use um fuso válido, como America/Belem."),
});

export async function updateProfile(userId: string, input: unknown) {
  const parsed = settingsSchema.parse(input);
  const image = parsed.image ? validateDestination(parsed.image) : null;
  if (image && new URL(image).protocol !== "https:")
    throw new AppError(
      422,
      "INVALID_AVATAR",
      "Use uma URL HTTPS para o avatar.",
    );
  return db().user.update({
    where: { id: userId },
    data: { ...parsed, image },
    select: { name: true, image: true, theme: true, timezone: true },
  });
}

export function getProfile(userId: string) {
  return db().user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      name: true,
      email: true,
      image: true,
      theme: true,
      timezone: true,
      createdAt: true,
    },
  });
}
