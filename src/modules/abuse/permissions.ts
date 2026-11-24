import { db } from "@/lib/db";

export async function canModerate(userId: string) {
  const allowed = (process.env.MODERATOR_IDENTITIES || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (!allowed.length) return false;
  const accounts = await db().account.findMany({
    where: { userId },
    select: { provider: true, providerAccountId: true },
  });
  return accounts.some((account) =>
    allowed.includes(`${account.provider}:${account.providerAccountId}`),
  );
}
