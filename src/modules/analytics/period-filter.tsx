"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { presets, trafficLabels, type AnalyticsQuery } from "./period";

export function PeriodFilter({
  query,
  pathname,
  extra,
}: {
  query: AnalyticsQuery;
  pathname: string;
  extra?: Record<string, string>;
}) {
  const [period, setPeriod] = useState(query.period);
  const [pending, start] = useTransition();
  const router = useRouter();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = new URLSearchParams(extra);
    for (const [key, value] of new FormData(event.currentTarget))
      if (typeof value === "string" && value) query.set(key, value);
    start(() => router.push(`${pathname}?${query}`, { scroll: false }));
  }
  return (
    <form
      onSubmit={submit}
      className="panel filters analytics-filters"
      aria-label="Filtrar analytics"
      aria-busy={pending}
    >
      <CalendarDays
        className="analytics-filter-icon"
        size={20}
        aria-hidden="true"
      />
      <div className="field">
        <label htmlFor="period">Período</label>
        <select
          className="input"
          name="period"
          id="period"
          value={period}
          onChange={(event) =>
            setPeriod(event.target.value as AnalyticsQuery["period"])
          }
        >
          {Object.entries(presets).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      {period === "custom" && (
        <>
          <div className="field">
            <label htmlFor="period-from">De</label>
            <Input
              type="date"
              id="period-from"
              name="from"
              defaultValue={query.from}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="period-to">Até</label>
            <Input
              type="date"
              id="period-to"
              name="to"
              defaultValue={query.to}
              required
            />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="traffic">Tráfego</label>
        <select
          className="input"
          name="traffic"
          id="traffic"
          defaultValue={query.traffic}
        >
          {Object.entries(trafficLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Atualizando…" : "Aplicar"}
      </Button>
    </form>
  );
}
