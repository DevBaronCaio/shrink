import { z } from "zod";

const password = z.string().min(12, "A senha precisa ter pelo menos 12 caracteres.").max(128, "A senha deve ter até 128 caracteres.").refine((value) => Buffer.byteLength(value, "utf8") <= 512, "A senha é muito longa.");

const email = z.string().trim().pipe(z.email("Informe um e-mail válido.")).transform((value) => value.toLowerCase());
export const signInSchema = z.object({ email, password: z.string().min(1, "Informe sua senha.").max(128) });
export const signUpSchema = z.object({ name: z.string().trim().min(2, "Informe seu nome.").max(80, "O nome deve ter até 80 caracteres."), email, password, confirmation: z.string() }).refine((data) => data.password === data.confirmation, { path: ["confirmation"], message: "As senhas não coincidem." });

export function safeDashboardPath(value: unknown) {
  if (typeof value !== "string" || !value.startsWith("/dashboard") || value.startsWith("//") || value.includes("\\") || /[\r\n]/.test(value)) return "/dashboard";
  return value.slice(0, 2048);
}
