import { test as base, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { db } from "../../src/lib/db";

const database = process.env.TEST_DATABASE_URL;
if (!database || !/_test$/.test(new URL(database).pathname))
  throw new Error("Playwright precisa de TEST_DATABASE_URL descartável.");
process.env.DATABASE_URL = database;

export const test = base.extend<{ signedIn: boolean }>({
  signedIn: async ({ context, baseURL }, provide) => {
    const id = randomUUID();
    const user = await db().user.create({
      data: {
        name: "Operador de teste",
        email: `${id}@example.com`,
        sessions: {
          create: { sessionToken: id, expires: new Date(Date.now() + 3600000) },
        },
      },
      select: { id: true },
    });
    try {
      await context.addCookies([
        {
          name: "shrink.session",
          value: id,
          url: baseURL,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await provide(true);
    } finally {
      await db().user.deleteMany({ where: { id: user.id } });
    }
  },
});
export { expect };
