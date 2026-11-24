import {
  analyticsWindow,
  shiftDate,
  variation,
  localDate,
  dayMs,
  type AnalyticsQuery,
} from "@/modules/analytics/period";
import {
  dimensions,
  type AnalyticsReport,
  type Dimension,
} from "@/modules/analytics/types";

export const demoLinks = [
  {
    id: "catalogo",
    slug: "catalogo",
    title: "Catálogo de primavera",
    destinationUrl: "https://example.com/?campanha=primavera",
    tag: "Campanha",
  },
  {
    id: "newsletter",
    slug: "newsletter",
    title: "Newsletter de produto",
    destinationUrl: "https://example.org/?origem=boletim",
    tag: "Newsletter",
  },
  {
    id: "guia",
    slug: "guia",
    title: "Guia de integração",
    destinationUrl: "https://www.iana.org/help/example-domains",
    tag: "Documentação",
  },
  {
    id: "evento",
    slug: "evento",
    title: "Inscrições do evento",
    destinationUrl: "https://example.net/?campanha=evento",
    tag: "Evento",
  },
] as const;

const timezone = "America/Belem";
const geographic = [
  ["BR", "BR-PA"],
  ["BR", "BR-SP"],
  ["PT", "PT-11"],
  ["BR", "BR-MG"],
  ["US", "US-CA"],
  [null, null],
] as const;
const devices = ["mobile", "desktop", "desktop", "mobile", "tablet"] as const;
const browsers = ["Chrome", "Firefox", "Safari", "Chrome", "Edge"] as const;
const systems = ["Android", "Windows", "macOS", "iOS", "Linux"] as const;
const referrers = [
  null,
  "example.org",
  "example.net",
  "google.com",
  null,
] as const;

function demoEvents(day: string, linkIndex: number) {
  const epoch = Math.round(Date.parse(day) / dayMs);
  const length = ((epoch * (linkIndex + 5)) % 25) + 5 + linkIndex * 4;
  return Array.from({ length }, (_, index) => {
    const seed = epoch * 17 + index * 11 + linkIndex;
    const place = geographic[seed % geographic.length];
    const values: Record<Dimension, string | null> = {
      country: place[0],
      region: place[1],
      device: devices[seed % devices.length],
      browser: browsers[(seed + index) % browsers.length],
      operatingSystem: systems[(seed + epoch) % systems.length],
      referrer: referrers[(seed + linkIndex) % referrers.length],
    };
    return { bot: seed % 13 === 0, visitor: (seed + index) % 540, values };
  });
}

export function demoReport(
  query: AnalyticsQuery,
  now = new Date(),
  selected?: string,
): AnalyticsReport {
  const window = analyticsWindow(query, timezone, now);
  const links = demoLinks
    .map((link, index) => ({ ...link, index }))
    .filter(({ id }) => !selected || id === selected);
  const traffic = (bot: boolean) =>
    query.traffic === "all" || (query.traffic === "bot") === bot;
  const breakdowns = Object.fromEntries(
    Object.keys(dimensions).map((name) => [
      name,
      new Map<string | null, number>(),
    ]),
  ) as Record<Dimension, Map<string | null, number>>;
  const visitors = new Set<number>();
  const ranked = new Map<string, number>();
  const series = Array.from({ length: window.length }, (_, i) => {
    const day = shiftDate(window.from, i);
    let clicks = 0;
    let bots = 0;
    for (const link of links)
      for (const event of demoEvents(day, link.index).filter(({ bot }) =>
        traffic(bot),
      )) {
        clicks++;
        if (event.bot) bots++;
        else visitors.add(event.visitor);
        ranked.set(link.id, (ranked.get(link.id) ?? 0) + 1);
        for (const [name, label] of Object.entries(event.values)) {
          const group = breakdowns[name as Dimension];
          group.set(label, (group.get(label) ?? 0) + 1);
        }
      }
    return { day, clicks, bots };
  });
  const clicks = series.reduce((sum, point) => sum + point.clicks, 0);
  const bots = series.reduce((sum, point) => sum + point.bots, 0);
  const hasPrevious =
    window.previousFrom >= shiftDate(localDate(now, timezone), -90);
  const previous = hasPrevious
    ? Array.from({ length: window.length }, (_, i) =>
        shiftDate(window.previousFrom, i),
      ).reduce(
        (sum, day) =>
          sum +
          links.reduce(
            (total, link) =>
              total +
              demoEvents(day, link.index).filter(({ bot }) => traffic(bot))
                .length,
            0,
          ),
        0,
      )
    : null;
  return {
    period: { from: window.from, to: window.to, timezone },
    clicks,
    bots,
    nonBotClicks: clicks - bots,
    uniqueVisitors: visitors.size || null,
    previousClicks: previous,
    changePercent: variation(clicks, previous),
    series,
    dimensions: Object.fromEntries(
      Object.entries(breakdowns).map(([name, entries]) => [
        name,
        Array.from(entries, ([label, clicks]) => ({ label, clicks }))
          .sort((a, b) => b.clicks - a.clicks)
          .slice(0, 10),
      ]),
    ) as AnalyticsReport["dimensions"],
    topLinks: links
      .map(({ id, title, slug }) => ({
        id,
        title,
        slug,
        clicks: ranked.get(id) ?? 0,
      }))
      .sort((a, b) => b.clicks - a.clicks),
  };
}
