import { dimensions, type AnalyticsReport, type Dimension } from "./types";

function cell(value: string | number | null) {
  if (value === null) return "";
  const text = String(value);
  const safe =
    typeof value === "string" && /^[\s]*[=+\-@]|^[\t\r\n]/.test(text)
      ? "'" + text
      : text;
  return '"' + safe.replaceAll('"', '""') + '"';
}

export function analyticsCsv(report: AnalyticsReport) {
  const rows: (string | number | null)[][] = [
    ["grupo", "valor", "cliques", "bots_reconhecidos", "visitantes_estimados"],
    [
      "total",
      `${report.period.from}/${report.period.to}`,
      report.clicks,
      report.bots,
      report.uniqueVisitors,
    ],
    ...report.series.map((point) => [
      "dia",
      point.day,
      point.clicks,
      point.bots,
      null,
    ]),
    ...Object.keys(dimensions).flatMap((name) =>
      report.dimensions[name as Dimension].map(({ label, clicks }) => [
        name,
        label,
        clicks,
        null,
        null,
      ]),
    ),
    ...report.topLinks.map(({ slug, clicks }) => [
      "link",
      slug,
      clicks,
      null,
      null,
    ]),
  ];
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n");
}
