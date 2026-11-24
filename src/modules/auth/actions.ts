"use server";

import { createHmac } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { actionResult, type ActionResult } from "@/lib/actions";
import { AppError } from "@/lib/errors";
import { networkSubject, rateLimit } from "@/lib/rate-limit";
import { auth, sessionCookie } from "./auth";
import { authenticatePassword, createPasswordAccount } from "./credentials";
import { safeDashboardPath, signInSchema, signUpSchema } from "./schema";

export type CredentialFormState = Extract<ActionResult, { ok: false }> | null;

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
  const identity = createHmac("sha256", secret)
    .update(email.trim().toLowerCase())
    .digest("hex");
  await rateLimit(`auth:${operation}:network:${network}`, 12, 3600);
  await rateLimit(`auth:${operation}:email:${identity}`, 8, 3600);
}

async function setSessionCookie(token: string, expires: Date) {
  const { name, options } = sessionCookie();
  (await cookies()).set(name, token, {
    ...options,
    expires,
    maxAge: 7 * 86400,
  });
}

export async function signUpAction(
  _previous: CredentialFormState,
  form: FormData,
): Promise<CredentialFormState> {
  return submitCredentials(form, "signup");
}

export async function signInAction(
  _previous: CredentialFormState,
  form: FormData,
): Promise<CredentialFormState> {
  return submitCredentials(form, "login");
}

async function submitCredentials(
  form: FormData,
  operation: "signup" | "login",
) {
  const returnTo = safeDashboardPath(form.get("returnTo"));
  const result = await actionResult(`auth.${operation}`, async () => {
    if (await auth()) return;
    const input = fields(form);
    const schema = operation === "signup" ? signUpSchema : signInSchema;
    const { email } = schema.parse(input);
    await enforceLimits(email, operation);
    const session =
      operation === "signup"
        ? await createPasswordAccount(input)
        : await authenticatePassword(input);
    if (!session)
      throw new AppError(
        401,
        "INVALID_CREDENTIALS",
        "E-mail ou senha incorretos.",
      );
    await setSessionCookie(session.sessionToken, session.expires);
  });
  if (!result.ok) return result;
  redirect(returnTo);
}
