import "dotenv/config";
import { db } from "../src/lib/db";

if (
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL ||
  process.env.SHRINK_ALLOW_DEV_SEED !== "yes"
) {
  throw new Error(
    "Seed disponível apenas em desenvolvimento com SHRINK_ALLOW_DEV_SEED=yes.",
  );
}
const url = new URL(process.env.DATABASE_URL || "http://invalid");
if (!["127.0.0.1", "localhost"].includes(url.hostname))
  throw new Error("Seed permitido somente em PostgreSQL local.");

const client = db();
try {
  const user = await client.user.upsert({
    where: { email: "demo@example.invalid" },
    create: { email: "demo@example.invalid", name: "Exemplo local" },
    update: {},
  });
  await client.link.upsert({
    where: { slug: "shrink-seed-local" },
    create: {
      slug: "shrink-seed-local",
      userId: user.id,
      title: "Guia local",
      destinationUrl: "https://example.com/guia",
    },
    update: {},
  });
} finally {
  await client.$disconnect();
}
