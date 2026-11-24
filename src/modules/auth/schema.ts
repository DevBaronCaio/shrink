import { z } from "zod";
import { MAX_DESTINATION_LENGTH } from "@/modules/links/new-link-path";

const password = z
  .string()
  .min(12, "A senha precisa ter pelo menos 12 caracteres.")
  .max(128, "A senha deve ter até 128 caracteres.")
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= 512,
    "A senha é muito longa.",
  );

const email = z
  .string()
  .trim()
  .max(254, "Use um e-mail com até 254 caracteres.")
  .pipe(z.email("Informe um e-mail válido."))
  .transform((value) => value.toLowerCase());
export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Informe sua senha.").max(128),
});
export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Informe seu nome.")
      .max(80, "O nome deve ter até 80 caracteres."),
    email,
    password,
    confirmation: z.string(),
  })
  .refine((data) => data.password === data.confirmation, {
    path: ["confirmation"],
    message: "As senhas não coincidem.",
  });

export function safeDashboardPath(value: unknown) {
  const fallback = "/dashboard";
  if (
    typeof value !== "string" ||
    value.length > MAX_DESTINATION_LENGTH * 9 + 256 ||
    value.includes("\\") ||
    [...value].some((character) => character.charCodeAt(0) < 32) ||
    !/^\/dashboard(?:[/?#]|$)/.test(value)
  )
    return fallback;

  const url = new URL(value, "https://shrink.invalid");
  if (url.pathname !== fallback && !url.pathname.startsWith(`${fallback}/`)) {
    return fallback;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
