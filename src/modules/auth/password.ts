import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
const N = 1 << 15;
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, KEY_LENGTH, { N, r: 8, p: 1, maxmem: 128 * 1024 * 1024 }, (error, key) => {
      if (error) reject(error);
      else resolve(key as Buffer);
    });
  });
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await derive(password, salt);
  return `scrypt$${N}$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, encoded?: string | null) {
  const parts = encoded?.split("$");
  const validFormat = parts?.length === 6 && parts[0] === "scrypt" && parts[1] === String(N) && parts[2] === "8" && parts[3] === "1" && /^[a-f0-9]{32}$/.test(parts[4] ?? "") && /^[a-f0-9]{128}$/.test(parts[5] ?? "");
  const salt = validFormat ? Buffer.from(parts![4], "hex") : Buffer.from("7b7aa7f48ca7b9e3f4f4352670be49d2", "hex");
  const expected = validFormat ? Buffer.from(parts![5], "hex") : Buffer.alloc(KEY_LENGTH);
  const actual = await derive(password, salt);
  return Boolean(validFormat && timingSafeEqual(actual, expected));
}
