import { randomInt } from "node:crypto";

const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
const reserved = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "demo",
  "docs",
  "entrar",
  "health",
  "login",
  "logout",
  "new",
  "null",
  "privacy",
  "privacidade",
  "report",
  "settings",
  "undefined",
  "www",
]);

export function normalizeSlug(slug: string) {
  return slug.trim().toLowerCase();
}

export function validSlug(slug: string) {
  return /^[a-z0-9][a-z0-9_-]{1,46}[a-z0-9]$/.test(slug) && !reserved.has(slug);
}

export function randomSlug() {
  return Array.from(
    { length: 8 },
    () => alphabet[randomInt(alphabet.length)],
  ).join("");
}
