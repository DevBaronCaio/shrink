import { afterAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { authenticatePassword, createPasswordAccount, removeSession } from "@/modules/auth/credentials";

const created: string[] = [];

afterAll(async () => {
  if (created.length) await db().user.deleteMany({ where: { id: { in: created } } });
});

describe("password account persistence", () => {
  it("creates an account and database session, then authenticates", async () => {
    const email = `auth-${crypto.randomUUID()}@example.test`;
    const account = await createPasswordAccount({ name: "Teste Integracao", email: email.toUpperCase(), password: "senha de teste longa 123", confirmation: "senha de teste longa 123" });
    created.push(account.user.id);
    expect(account.user.email).toBe(email);
    expect(await db().session.findUnique({ where: { sessionToken: account.sessionToken } })).not.toBeNull();

    expect(await authenticatePassword({ email, password: "senha incorreta longa" })).toBeNull();
    const login = await authenticatePassword({ email, password: "senha de teste longa 123" });
    expect(login?.user.id).toBe(account.user.id);
    expect(await db().session.count({ where: { userId: account.user.id } })).toBe(2);
    await removeSession(login!.sessionToken);
  });
});
