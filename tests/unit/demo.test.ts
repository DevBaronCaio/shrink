import { expect, it } from "vitest";
import { demoReport } from "@/modules/demo/data";
import { analyticsSchema } from "@/modules/analytics/period";

it("mantém fixtures determinísticas e permite filtrar período, link e tráfego", () => {
  const clock = new Date("2026-11-23T12:00:00Z");
  const query = analyticsSchema.parse({ period: "7d" });
  const overview = demoReport(query, clock);
  expect(demoReport(query, clock)).toEqual(overview);
  expect(overview.series).toHaveLength(7);
  const bots = demoReport({ ...query, traffic: "bot" }, clock, "guia");
  expect(bots.clicks).toBeGreaterThan(0);
  expect(bots.bots).toBe(bots.clicks);
  expect(bots.uniqueVisitors).toBeNull();
  expect(bots.topLinks.map(({ id }) => id)).toEqual(["guia"]);
});
