import { z } from "zod";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { normalizeSlug, validSlug } from "@/modules/links/slug";
import { canModerate } from "./permissions";

const reportSchema = z.strictObject({
  slug: z
    .string()
    .max(64)
    .transform(normalizeSlug)
    .refine(validSlug, "Informe um slug válido."),
  reason: z
    .string()
    .trim()
    .min(10, "Descreva o motivo em pelo menos 10 caracteres.")
    .max(500),
});

export async function reportLink(input: unknown) {
  const { slug, reason } = reportSchema.parse(input);
  const link = await db().link.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!link) throw notFound();
  await db().linkReport.create({
    data: { linkId: link.id, reason },
    select: { id: true },
  });
}

async function requireModerator(userId: string) {
  if (!(await canModerate(userId)))
    throw new AppError(403, "FORBIDDEN", "Acesso restrito à moderação.");
}

export async function listReports(userId: string) {
  await requireModerator(userId);
  return db().linkReport.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      reason: true,
      createdAt: true,
      link: { select: { id: true, slug: true, blockedAt: true } },
    },
  });
}

export async function moderateLink(userId: string, id: string, block: boolean) {
  await requireModerator(userId);
  if (typeof block !== "boolean")
    throw new AppError(
      422,
      "INVALID_MODERATION",
      "Operação de moderação inválida.",
    );
  const result = await db().link.updateMany({
    where: {
      id,
      OR: [{ reports: { some: {} } }, { blockedAt: { not: null } }],
    },
    data: { blockedAt: block ? new Date() : null },
  });
  if (!result.count) throw notFound();
}
