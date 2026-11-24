import { db } from "@/lib/db";
import { dayMs, eventRetentionDays } from "./period";

export async function runRetention(now = new Date()) {
  const client = db();
  const cutoff = new Date(now.getTime() - eventRetentionDays * dayMs);
  let events = 0;
  for (let batch = 0; batch < 10; batch++) {
    const count = await client.$executeRaw`
      DELETE FROM "ClickEvent" WHERE id IN (
        SELECT id FROM "ClickEvent" WHERE "createdAt" < ${cutoff}
        ORDER BY "createdAt" LIMIT 5000 FOR UPDATE SKIP LOCKED
      )`;
    events += count;
    if (count < 5000) break;
  }
  const [buckets, sessions, reports] = await Promise.all([
    client.rateLimitBucket.deleteMany({ where: { expiresAt: { lt: now } } }),
    client.session.deleteMany({ where: { expires: { lt: now } } }),
    client.linkReport.deleteMany({
      where: { createdAt: { lt: new Date(now.getTime() - 180 * dayMs) } },
    }),
  ]);
  return {
    events,
    buckets: buckets.count,
    sessions: sessions.count,
    reports: reports.count,
  };
}
