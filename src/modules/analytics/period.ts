import { z } from "zod";
import { AppError } from "@/lib/errors";

export const eventRetentionDays = 90;
export const defaultTimezone = "America/Belem";
export const presets = {
  today: "Hoje",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
  custom: "Período personalizado",
} as const;
export const trafficLabels = {
  all: "Todo o tráfego",
  "non-bot": "Sem bots reconhecidos",
  bot: "Bots reconhecidos",
} as const;
export const analyticsKeys = ["period", "from", "to", "traffic"] as const;
export const dayMs = 86400000;

export const analyticsSchema = z
  .strictObject({
    period: z.enum(["today", "7d", "30d", "90d", "custom"]).default("30d"),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    traffic: z.enum(["all", "non-bot", "bot"]).default("all"),
  })
  .refine(
    (query) =>
      query.period === "custom"
        ? Boolean(query.from && query.to)
        : !query.from && !query.to,
    {
      message: "Informe início e fim apenas no período personalizado.",
      path: ["period"],
    },
  );

export type AnalyticsQuery = z.infer<typeof analyticsSchema>;

export function validTimezone(zone: string) {
  try {
    new Intl.DateTimeFormat("pt-BR", { timeZone: zone });
    return /^[a-z_]+(?:\/[a-z0-9_+.-]+){0,2}$/i.test(zone);
  } catch {
    return false;
  }
}

export function localDate(at: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timezone,
  }).formatToParts(at);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function shiftDate(date: string, days: number) {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * dayMs)
    .toISOString()
    .slice(0, 10);
}

export function analyticsWindow(
  input: unknown,
  timezone: string,
  now = new Date(),
) {
  const query = analyticsSchema.parse(input);
  const today = localDate(now, timezone);
  const days = { today: 1, "7d": 7, "30d": 30, "90d": 90 };
  const from =
    query.period === "custom"
      ? query.from!
      : shiftDate(today, 1 - days[query.period]);
  const to = query.period === "custom" ? query.to! : today;
  const length = (Date.parse(to) - Date.parse(from)) / dayMs + 1;
  if (
    to > today ||
    !Number.isInteger(length) ||
    length < 1 ||
    length > eventRetentionDays ||
    from < shiftDate(today, -eventRetentionDays)
  ) {
    throw new AppError(
      422,
      "INVALID_PERIOD",
      "Escolha até 90 dias, dentro dos 90 dias de retenção e sem datas futuras.",
    );
  }
  return {
    from,
    to,
    end: shiftDate(to, 1),
    previousFrom: shiftDate(from, -length),
    length,
    timezone,
    now,
    traffic: query.traffic,
  };
}

export function variation(current: number, previous: number | null) {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
