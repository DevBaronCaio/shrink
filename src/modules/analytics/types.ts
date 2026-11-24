export const dimensions = {
  country: "Países",
  region: "Regiões",
  device: "Dispositivos",
  browser: "Navegadores",
  operatingSystem: "Sistemas operacionais",
  referrer: "Origens de tráfego",
} as const;
export type Dimension = keyof typeof dimensions;
export type Breakdown = { label: string | null; clicks: number };
export type SeriesPoint = { day: string; clicks: number; bots: number };
export type RankedLink = {
  id: string;
  slug: string;
  title: string;
  clicks: number;
};
export type AnalyticsReport = {
  period: { from: string; to: string; timezone: string };
  clicks: number;
  bots: number;
  nonBotClicks: number;
  uniqueVisitors: number | null;
  previousClicks: number | null;
  changePercent: number | null;
  series: SeriesPoint[];
  dimensions: Record<Dimension, Breakdown[]>;
  topLinks: RankedLink[];
};
