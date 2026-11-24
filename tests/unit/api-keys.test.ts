import { expect, it } from "vitest";
import {
  generateKey,
  keyHash,
  keyMatches,
  parseBearer,
} from "@/modules/api-keys/credentials";

it("valida chave completa e compara somente hashes válidos", () => {
  const { key, prefix } = generateKey();
  expect(prefix).toMatch(/^sk_shrink_[a-f0-9]{16}$/);
  expect(parseBearer(`Bearer ${key}`)).toEqual([key, prefix]);
  expect(parseBearer(`Basic ${key}`)).toBeNull();
  expect(parseBearer(`Bearer ${prefix}`)).toBeNull();
  const hash = keyHash(key);
  expect(hash).toMatch(/^[a-f0-9]{64}$/);
  expect(hash).not.toContain(key);
  expect(keyMatches(key, hash)).toBe(true);
  expect(keyMatches(generateKey().key, hash)).toBe(false);
  expect(keyMatches(key, "bad-hash")).toBe(false);
});
