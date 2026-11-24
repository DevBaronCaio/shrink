import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { notFound } from "@/lib/errors";
import {
  analyticsWindow,
  defaultTimezone,
  eventRetentionDays,
  shiftDate,
  variation,
  dayMs,
} from "./period";
import {
  dimensions,
  type AnalyticsReport,
  type Breakdown,
  type Dimension,
  type RankedLink,
  type SeriesPoint,
} from "./types";

type Row = {
  clicks: number;
  bots: number;
  uniqueVisitors: number | null;
  previousClicks: number | null;
  series: SeriesPoint[];
  dimensions: Partial<Record<Dimension, Breakdown[]>>;
  topLinks: RankedLink[];
};

export async function getAnalytics(
  userId: string,
  input: unknown,
  linkId?: string,
  now = new Date(),
) {
  const client = db();
  const [profile, link] = await Promise.all([
    client.user.findUnique({
      where: { id: userId },
      select: { timezone: true },
    }),
    linkId
      ? client.link.findUnique({
          where: { id: linkId, userId },
          select: { id: true },
        })
      : undefined,
  ]);
  if (!profile || (linkId && !link)) throw notFound();
  const w = analyticsWindow(input, profile.timezone || defaultTimezone, now);
  const cutoff = new Date(now.getTime() - eventRetentionDays * dayMs);
  const linkCondition = linkId
    ? Prisma.sql`AND l.id = ${linkId}`
    : Prisma.empty;
  const botCondition =
    w.traffic === "all"
      ? Prisma.empty
      : Prisma.sql`AND e."isBot" = ${w.traffic === "bot"}`;
  const [row] = await client.$queryRaw<Row[]>`
    WITH bounds AS (
      SELECT ${w.from}::date::timestamp AT TIME ZONE ${w.timezone} AS start_at,
        ${w.end}::date::timestamp AT TIME ZONE ${w.timezone} AS end_at,
        ${w.previousFrom}::date::timestamp AT TIME ZONE ${w.timezone} AS previous_at
    ), events AS MATERIALIZED (
      SELECT e.*, e."createdAt" >= b.start_at AS current_period
      FROM "ClickEvent" e JOIN "Link" l ON l.id = e."linkId" CROSS JOIN bounds b
      WHERE l."userId" = ${userId} ${linkCondition} ${botCondition}
        AND e."createdAt" >= GREATEST(b.previous_at, ${cutoff}::timestamptz)
        AND e."createdAt" < LEAST(b.end_at, ${now}::timestamptz)
    ), daily AS (
      SELECT to_char("createdAt" AT TIME ZONE ${w.timezone}, 'YYYY-MM-DD') AS day,
        count(*)::double precision AS clicks,
        count(*) FILTER (WHERE "isBot")::double precision AS bots
      FROM events WHERE current_period GROUP BY 1
    ), ranked_values AS (
      SELECT v.dimension, v.label, count(*)::double precision AS clicks,
        row_number() OVER (PARTITION BY v.dimension ORDER BY count(*) DESC, v.label) AS rank
      FROM events e CROSS JOIN LATERAL (VALUES
        ('country', e.country::text),
        ('region', CASE WHEN e.country IS NOT NULL AND e.region IS NOT NULL THEN e.country || '-' || e.region END),
        ('device', e.device), ('browser', e.browser), ('operatingSystem', e."operatingSystem"), ('referrer', e."referrerDomain")
      ) AS v(dimension,label)
      WHERE e.current_period GROUP BY v.dimension, v.label
    ), grouped_values AS (
      SELECT dimension, json_agg(json_build_object('label',label,'clicks',clicks) ORDER BY rank) AS totals
      FROM ranked_values WHERE rank <= 10 GROUP BY dimension
    ), ranked_links AS (
      SELECT l.id, l.slug, l.title, count(*)::double precision AS clicks
      FROM events e JOIN "Link" l ON l.id = e."linkId" WHERE e.current_period
      GROUP BY l.id, l.slug, l.title ORDER BY clicks DESC, l.id LIMIT 10
    )
    SELECT count(*) FILTER (WHERE current_period)::double precision AS clicks,
      count(*) FILTER (WHERE current_period AND "isBot")::double precision AS bots,
      NULLIF(count(DISTINCT "visitorHash") FILTER (WHERE current_period AND NOT "isBot"), 0)::double precision AS "uniqueVisitors",
      CASE WHEN (SELECT previous_at FROM bounds) >= ${cutoff}::timestamptz
        THEN count(*) FILTER (WHERE NOT current_period)::double precision END AS "previousClicks",
      COALESCE((SELECT json_agg(daily ORDER BY day) FROM daily), '[]') AS series,
      COALESCE((SELECT json_object_agg(dimension, totals) FROM grouped_values), '{}') AS dimensions,
      COALESCE((SELECT json_agg(ranked_links ORDER BY clicks DESC, id) FROM ranked_links), '[]') AS "topLinks"
    FROM events`;
  const days = new Map(row.series.map((point) => [point.day, point]));
  return {
    period: { from: w.from, to: w.to, timezone: w.timezone },
    clicks: row.clicks,
    bots: row.bots,
    nonBotClicks: row.clicks - row.bots,
    uniqueVisitors: row.uniqueVisitors,
    previousClicks: row.previousClicks,
    changePercent: variation(row.clicks, row.previousClicks),
    series: Array.from({ length: w.length }, (_, index) => {
      const day = shiftDate(w.from, index);
      return days.get(day) ?? { day, clicks: 0, bots: 0 };
    }),
    dimensions: Object.fromEntries(
      Object.keys(dimensions).map((dimension) => [
        dimension,
        row.dimensions[dimension as Dimension] ?? [],
      ]),
    ),
    topLinks: row.topLinks,
  } as AnalyticsReport;
}
