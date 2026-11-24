"use server";

import { createHmac } from "node:crypto";
import { cookies, headers } from "next/headers";
import { actionResult, type ActionResult } from "@/lib/actions";
import { AppError } from "@/lib/errors";
import { networkSubject, rateLimit } from "@/lib/rate-limit";
import { auth, sessionCookie } from "./auth";
import { authenticatePassword, createPasswordAccount } from "./credentials";
import { safeDashboardPath, signInSchema, signUpSchema } from "./schema";

export type CredentialFormState = ActionResult<{ redirectTo: string }> | null;

function fields(form: FormData) {
  return {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
    confirmation: String(form.get("confirmation") ?? ""),
  };
}

async function enforceLimits(email: string, operation: "signup" | "login") {
  const requestHeaders = await headers();
  const network = networkSubject(requestHeaders);
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET ausente");
  const identity = createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("hex");
  await rateLimit(`auth:${operation}:network:${network}`, 12, 3600);
  await rateLimit(`auth:${operation}:email:${identity}`, 8, 3600);
}

async function setSessionCookie(token: string, expires: Date) {
  const { name, options } = sessionCookie();
  (await cookies()).set(name, token, { ...options, expires, maxAge: 7 * 86400 });
}

export async function signUpAction(_previous: CredentialFormState, form: FormData): Promise<CredentialFormState> {
  if (await auth()) return { ok: true, data: { redirectTo: "/dashboard" } };
  const input = fields(form);
  const validated = signUpSchema.safeParse(input);
  if (!validated.success) return { ok: false, message: validated.error.issues[0]?.message ?? "Confira os campos." };
  const result = await actionResult("auth.signup", async () => {
    await enforceLimits(validated.data.email, "signup");
    const created = await createPasswordAccount(validated.data);
    await setSessionCookie(created.sessionToken, created.expires);
    return { redirectTo: safeDashboardPath(form.get("returnTo")) };
  });
  if (!result.ok && result.message.includes("Unique constraint")) return { ok: false, message: "Não foi possível criar a conta com esses dados." };
  return result;
}

export async function signInAction(_previous: CredentialFormState, form: FormData): Promise<CredentialFormState> {
  if (await auth()) return { ok: true, data: { redirectTo: "/dashboard" } };
  const input = fields(form);
  const validated = signInSchema.safeParse(input);
  if (!validated.success) return { ok: false, message: validated.error.issues[0]?.message ?? "Confira os campos." };
  return actionResult("auth.login", async () => {
    await enforceLimits(validated.data.email, "login");
    const session = await authenticatePassword(validated.data);
    if (!session) throw new AppError(401, "INVALID_CREDENTIALS", "E-mail ou senha incorretos.");
    await setSessionCookie(session.sessionToken, session.expires);
    return { redirectTo: safeDashboardPath(form.get("returnTo")) };
  });
}
