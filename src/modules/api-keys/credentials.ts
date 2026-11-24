import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function keyHash(key: string) {
  return createHash("sha256").update(key, "utf8").digest("hex");
}

export function generateKey() {
  const prefix = `sk_shrink_${randomBytes(8).toString("hex")}`;
  return { prefix, key: `${prefix}_${randomBytes(32).toString("base64url")}` };
}

export function parseBearer(value: string | null) {
  return (
    value
      ?.match(/^Bearer ((sk_shrink_[a-f0-9]{16})_[A-Za-z0-9_-]{43})$/i)
      ?.slice(1, 3) ?? null
  );
}

export function keyMatches(key: string, storedHash: string) {
  if (!/^[a-f0-9]{64}$/.test(storedHash)) return false;
  return timingSafeEqual(
    Buffer.from(keyHash(key), "hex"),
    Buffer.from(storedHash, "hex"),
  );
}
