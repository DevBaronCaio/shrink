import { z } from "zod";
import { Prisma, type ApiScope } from "@prisma/client";
import { db } from "@/lib/db";
import { AppError, notFound } from "@/lib/errors";
import { generateKey, keyHash, keyMatches, parseBearer } from "./credentials";

const inputSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Informe um nome com pelo menos dois caracteres.")
    .max(80),
  scopes: z
    .array(z.enum(["READ", "WRITE"]))
    .min(1, "Selecione pelo menos um escopo.")
    .max(2)
    .transform((scopes) => [...new Set(scopes)]),
  expiresAt: z.iso.datetime({ offset: true }).nullable().optional(),
});

const keyFields = {
  id: true,
  prefix: true,
  name: true,
  scopes: true,
  createdAt: true,
  expiresAt: true,
  revokedAt: true,
  lastUsedAt: true,
} satisfies Prisma.ApiKeySelect;
const unauthenticated = () =>
  new AppError(401, "UNAUTHORIZED", "Forneça uma chave de API válida.", {
    "WWW-Authenticate": 'Bearer realm="shrink"',
  });

export async function createApiKey(userId: string, input: unknown) {
  const { name, scopes, expiresAt } = inputSchema.parse(input);
  const expiry = expiresAt ? new Date(expiresAt) : null;
  if (expiry && expiry <= new Date())
    throw new AppError(
      422,
      "INVALID_EXPIRY",
      "A expiração precisa estar no futuro.",
    );
  const { prefix, key } = generateKey();
  const record = await db().apiKey.create({
    data: {
      userId,
      name,
      scopes,
      expiresAt: expiry,
      prefix,
      keyHash: keyHash(key),
    },
    select: keyFields,
  });
  return { ...record, key };
}

export async function listApiKeys(userId: string) {
  return db().apiKey.findMany({
    where: { userId },
    select: keyFields,
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function revokeApiKey(userId: string, id: string) {
  const result = await db().apiKey.updateMany({
    where: { id, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (!result.count) {
    const key = await db().apiKey.findUnique({
      where: { id, userId },
      select: { id: true },
    });
    if (!key) throw notFound();
  }
}

export async function authorizeApiKey(
  authorization: string | null,
  required: ApiScope,
) {
  const credential = parseBearer(authorization);
  if (!credential) throw unauthenticated();
  const [key, prefix] = credential;
  const now = new Date();
  const record = await db().apiKey.findUnique({
    where: { prefix },
    select: {
      id: true,
      userId: true,
      keyHash: true,
      scopes: true,
      revokedAt: true,
      expiresAt: true,
      lastUsedAt: true,
    },
  });
  if (
    !record ||
    !keyMatches(key, record.keyHash) ||
    record.revokedAt ||
    (record.expiresAt && record.expiresAt <= now)
  )
    throw unauthenticated();
  if (!record.scopes.includes(required))
    throw new AppError(
      403,
      "INSUFFICIENT_SCOPE",
      "A chave não tem permissão para esta operação.",
    );
  const recent = new Date(now.getTime() - 60000);
  if (!record.lastUsedAt || record.lastUsedAt < recent) {
    const { count } = await db().apiKey.updateMany({
      where: {
        id: record.id,
        revokedAt: null,
        AND: [{ OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: recent } }] }],
      },
      data: { lastUsedAt: now },
    });
    if (
      !count &&
      (await db().apiKey.count({
        where: { id: record.id, revokedAt: null },
      })) === 0
    )
      throw unauthenticated();
  }
  return { id: record.id, userId: record.userId };
}
