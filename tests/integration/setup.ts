import { randomUUID } from "node:crypto";
import { afterAll } from "vitest";
import { db } from "@/lib/db";

const url = process.env.TEST_DATABASE_URL;
if (!url || !/_test$/.test(new URL(url).pathname)) {
  throw new Error(
    "Defina TEST_DATABASE_URL para um PostgreSQL descartável com nome terminado em _test.",
  );
}
process.env.DATABASE_URL = url;

const ids: string[] = [];
export const makeUser = async () => {
  const user = await db().user.create({
    data: { email: `shrink-${randomUUID()}@example.com` },
  });
  ids.push(user.id);
  return user;
};

afterAll(async () => {
  await db().user.deleteMany({ where: { id: { in: ids } } });
  await db().$disconnect();
});
