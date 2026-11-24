import Link from "next/link";
import { Activity, Bot, MousePointer2, UsersRound } from "lucide-react";
import { ClickChart } from "./chart";
import {
  dimensions,
  type AnalyticsReport,
  type Breakdown,
  type Dimension,
} from "./types";

const intl = new Intl.NumberFormat("pt-BR");
const regions = new Intl.DisplayNames(["pt-BR"], {
  type: "region",
  fallback: "code",
});

function valueLabel(dimension: Dimension, value: string | null) {
  if (!value)
    return dimension === "referrer"
      ? "Sem referrer informado"
      : "Não disponível";
  if (dimension === "country") return regions.of(value) || value;
  if (dimension === "device")
    return (
      {
        mobile: "Celular",
        desktop: "Computador",
        tablet: "Tablet",
        smarttv: "Smart TV",
      }[value] || value
    );
  return value;
}

function BreakdownPanel({
  name,
  rows,
}: {
  name: Dimension;
  rows: Breakdown[];
}) {
  const max = rows[0]?.clicks || 1;
  return (
    <section className="panel analytics-panel">
      <h2>{dimensions[name]}</h2>
      {rows.length ? (
        <ul className="breakdown">
          {rows.map(({ label, clicks }) => (
            <li key={label ?? "__unknown"}>
              <div>
                <span title={valueLabel(name, label)}>
                  {valueLabel(name, label)}
                </span>
                <strong>{intl.format(clicks)}</strong>
              </div>
              <div className="bar-track" aria-hidden="true">
                <span style={{ width: `${(clicks / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="helper">Nenhum acesso para o período.</p>
      )}
    </section>
  );
}

export function Report({
  report,
  topHref,
  compact = false,
}: {
  report: AnalyticsReport;
  topHref?: (id: string) => string;
  compact?: boolean;
}) {
  const labels: Dimension[] = compact
    ? ["device", "country", "referrer"]
    : ["country", "region", "device", "browser", "operatingSystem", "referrer"];
  const percent = report.changePercent;
  return (
    <>
      <div className="stat-grid">
        <div className="panel stat">
          <p>
            <MousePointer2 size={15} /> Cliques no período
          </p>
          <strong>{intl.format(report.clicks)}</strong>
          <span className="helper">
            {percent === null
              ? report.previousClicks === null
                ? "Comparação indisponível"
                : "Período anterior sem cliques"
              : `${percent > 0 ? "+" : ""}${intl.format(percent)}% vs. período anterior`}
          </span>
        </div>
        <div className="panel stat">
          <p>
            <UsersRound size={15} /> Visitantes estimados
          </p>
          <strong>
            {report.uniqueVisitors === null
              ? "—"
              : intl.format(report.uniqueVisitors)}
          </strong>
          <span className="helper">
            {report.uniqueVisitors === null
              ? "Estimativa indisponível"
              : "Identificadores distintos no período"}
          </span>
        </div>
        <div className="panel stat">
          <p>
            <Activity size={15} /> Cliques sem bot reconhecido
          </p>
          <strong>{intl.format(report.nonBotClicks)}</strong>
          <span className="helper">Classificação estimada</span>
        </div>
        <div className="panel stat">
          <p>
            <Bot size={15} /> Bots reconhecidos
          </p>
          <strong>{intl.format(report.bots)}</strong>
          <span className="helper">Inclui prévias e robôs identificados</span>
        </div>
      </div>
      <section className="panel analytics-panel">
        <div className="chart-heading">
          <h2>Cliques ao longo do tempo</h2>
          <span>{report.period.timezone}</span>
        </div>
        {report.clicks ? (
          <ClickChart points={report.series} />
        ) : (
          <div className="empty">
            <Activity size={24} />
            <p>Ainda não há cliques neste período.</p>
          </div>
        )}
      </section>
      <div className="analytics-grid">
        {labels.map((name) => (
          <BreakdownPanel
            key={name}
            name={name}
            rows={report.dimensions[name]}
          />
        ))}
      </div>
      {topHref && (
        <section className="panel analytics-panel">
          <h2>Links com melhor desempenho</h2>
          {report.topLinks.length ? (
            <ul className="rank-list">
              {report.topLinks.map((link) => (
                <li key={link.id}>
                  <Link href={topHref(link.id)}>
                    {link.title}
                    <small>/r/{link.slug}</small>
                  </Link>
                  <strong>{intl.format(link.clicks)}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p className="helper">Nenhum link recebeu cliques neste período.</p>
          )}
        </section>
      )}
    </>
  );
}
