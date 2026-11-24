"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SeriesPoint } from "./types";

const shortDate = (day: string) => `${day.slice(8, 10)}/${day.slice(5, 7)}`;

export default function ChartPlot({ points }: { points: SeriesPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
      <AreaChart
        data={points}
        margin={{ top: 10, right: 12, left: 2, bottom: 2 }}
        accessibilityLayer
      >
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="day"
          tickFormatter={shortDate}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          minTickGap={22}
        />
        <YAxis
          width={37}
          allowDecimals={false}
          tick={{ fill: "var(--muted)", fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          labelFormatter={(label) => shortDate(String(label))}
          contentStyle={{
            background: "var(--surface)",
            borderColor: "var(--border)",
            borderRadius: 8,
            color: "var(--text)",
          }}
        />
        <Area
          type="monotone"
          dataKey="clicks"
          name="Cliques"
          stroke="var(--accent-text)"
          strokeWidth={2}
          fill="var(--accent)"
          fillOpacity={0.12}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="bots"
          name="Bots reconhecidos"
          stroke="var(--muted)"
          strokeWidth={1.5}
          fill="transparent"
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
