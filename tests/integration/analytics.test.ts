import { expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createLink } from "@/modules/links/service";
import { resolveRedirect } from "@/modules/redirect/service";
import { getAnalytics } from "@/modules/analytics/service";
import { analyticsCsv } from "@/modules/analytics/csv";
import { makeUser } from "./setup";

const base = { title: "Guia", destinationUrl: "https://example.com/guia" };

it("agrega cliques, deduplica visitantes no período e isola usuários", async () => {
  const [user, other] = await Promise.all([makeUser(), makeUser()]);
  await db().user.update({
    where: { id: user.id },
    data: { timezone: "America/New_York" },
  });
  const [link, second, outsider] = await Promise.all([
    createLink(user.id, base),
    createLink(user.id, base),
    createLink(other.id, base),
  ]);
  const first = new Date("2026-03-08T06:00:00Z");
  const middle = new Date("2026-03-09T04:00:00Z");
  const previous = new Date("2026-03-07T23:30:00Z");
  await db().clickEvent.createMany({
    data: [
      {
        linkId: link.id,
        createdAt: first,
        country: "BR",
        region: "PA",
        device: "mobile",
        visitorHash: "a".repeat(64),
      },
      {
        linkId: second.id,
        createdAt: middle,
        country: "BR",
        region: "PA",
        visitorHash: "a".repeat(64),
        referrerDomain: "rede.example",
      },
      { linkId: link.id, createdAt: middle, country: null, isBot: true },
      { linkId: link.id, createdAt: previous },
      { linkId: outsider.id, createdAt: first },
    ],
  });
  const now = new Date("2026-03-09T12:00:00Z");
  const query = { period: "custom", from: "2026-03-08", to: "2026-03-09" };
  const aggregate = await getAnalytics(user.id, query, undefined, now);
  expect(aggregate).toMatchObject({
    clicks: 3,
    nonBotClicks: 2,
    bots: 1,
    uniqueVisitors: 1,
    previousClicks: 1,
    changePercent: 200,
  });
  expect(aggregate.series).toEqual([
    { day: "2026-03-08", bots: 0, clicks: 1 },
    { day: "2026-03-09", bots: 1, clicks: 2 },
  ]);
  expect(aggregate.dimensions.region).toContainEqual({
    label: "BR-PA",
    clicks: 2,
  });
  expect(aggregate.dimensions.referrer).toContainEqual({
    label: null,
    clicks: 2,
  });
  expect(aggregate.topLinks[0]).toMatchObject({ id: link.id, clicks: 2 });
  expect(analyticsCsv(aggregate)).toContain(
    '"total","2026-03-08/2026-03-09","3","1","1"',
  );
  expect(
    await getAnalytics(user.id, { ...query, traffic: "bot" }, link.id, now),
  ).toMatchObject({ clicks: 1, bots: 1, uniqueVisitors: null });
  await expect(
    getAnalytics(other.id, query, link.id, now),
  ).rejects.toMatchObject({ status: 404 });
  expect(
    await getAnalytics(user.id, { period: "90d" }, undefined, now),
  ).toMatchObject({ previousClicks: null, changePercent: null });
});

it("pseudonimiza o acesso por conta sem persistir o IP", async () => {
  const [owner, other] = await Promise.all([makeUser(), makeUser()]);
  const links = await Promise.all([
    createLink(owner.id, base),
    createLink(owner.id, base),
    createLink(other.id, base),
  ]);
  vi.stubEnv("VERCEL", "1");
  vi.stubEnv(
    "ANALYTICS_HASH_SECRET",
    "test-separate-visitor-secret-with-32-bytes",
  );
  const headers = new Headers({
    "x-vercel-forwarded-for": "203.0.113.17",
    "x-vercel-ip-country": "BR",
    "x-vercel-ip-country-region": "PA",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/135.0.0.0 Safari/537.36",
  });
  try {
    await Promise.all(links.map(({ slug }) => resolveRedirect(slug, headers)));
    const events = await Promise.all(
      links.map(({ id }) =>
        db().clickEvent.findFirstOrThrow({ where: { linkId: id } }),
      ),
    );
    expect(events[0].visitorHash).toMatch(/^[a-f0-9]{64}$/);
    expect(events[0].visitorHash).toBe(events[1].visitorHash);
    expect(events[0].visitorHash).not.toBe(events[2].visitorHash);
    expect(JSON.stringify(events)).not.toContain("203.0.113.17");
    expect(events[0]).toMatchObject({
      country: "BR",
      region: "PA",
      device: "desktop",
      isBot: false,
    });
  } finally {
    vi.unstubAllEnvs();
  }
});
