import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { db } from "./db";
import { AppError } from "./errors";

export function clientIp(headers: Headers) {
  if (process.env.VERCEL !== "1") return null;
  const ip = headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  return ip && isIP(ip) ? ip : null;
}

export function networkSubject(headers: Headers) {
  const ip = clientIp(headers);
  const secret = process.env.AUTH_SECRET;
  if (!ip || !secret) return "unavailable";
  const day = new Date().toISOString().slice(0, 10);
  return createHmac("sha256", secret)
    .update(`rate-limit|${day}|${ip}`)
    .digest("hex");
}

export async function rateLimit(key: string, limit: number, seconds: number) {
  const now = Date.now();
  const duration = seconds * 1000;
  const start = Math.floor(now / duration) * duration;
  const reset = start + duration;
  const rows = await db().$queryRaw<{ hits: number }[]>`
    INSERT INTO "RateLimitBucket" ("key", "windowAt", "expiresAt", "hits")
    VALUES (${key}, ${new Date(start)}, ${new Date(reset)}, 1)
    ON CONFLICT ("key", "windowAt") DO UPDATE SET "hits" = "RateLimitBucket"."hits" + 1
    WHERE "RateLimitBucket"."hits" < ${limit}
    RETURNING "hits"`;
  const headers = {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(rows.length ? limit - rows[0].hits : 0),
    "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
  };
  if (!rows.length) {
    throw new AppError(429, "RATE_LIMITED", "Limite de requisições atingido.", {
      ...headers,
      "Retry-After": String(Math.max(1, Math.ceil((reset - now) / 1000))),
    });
  }
  return headers;
}
