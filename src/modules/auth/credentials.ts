import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";
import { signInSchema, signUpSchema } from "./schema";

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export async function createPasswordAccount(input: unknown) {
  const data = signUpSchema.parse(input);
  const passwordHash = await hashPassword(data.password);
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DURATION);
  const user = await db().user.create({
    data: { name: data.name, email: data.email, passwordHash, sessions: { create: { sessionToken, expires } } },
    select: { id: true, name: true, email: true },
  });
  return { user, sessionToken, expires };
}

export async function authenticatePassword(input: unknown) {
  const data = signInSchema.parse(input);
  const user = await db().user.findUnique({ where: { email: data.email }, select: { id: true, name: true, email: true, passwordHash: true } });
  if (!(await verifyPassword(data.password, user?.passwordHash))) return null;
  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_DURATION);
  await db().session.create({ data: { sessionToken, userId: user!.id, expires } });
  return { user: { id: user!.id, name: user!.name, email: user!.email }, sessionToken, expires };
}

export async function removeSession(sessionToken: string) {
  await db().session.deleteMany({ where: { sessionToken } });
}
