"use client";

import dynamic from "next/dynamic";
import type { SeriesPoint } from "./types";

const Plot = dynamic(() => import("./chart-plot"), {
  ssr: false,
  loading: () => (
    <div className="skeleton h-full" role="status">
      <span className="sr-only">Carregando gráfico…</span>
    </div>
  ),
});

export function ClickChart({ points }: { points: SeriesPoint[] }) {
  return (
    <>
      <div className="chart-plot" role="region" aria-label="Gráfico de cliques">
        <Plot points={points} />
      </div>
      <details className="chart-data">
        <summary>Ver dados do gráfico</summary>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Dia</th>
                <th scope="col">Cliques</th>
                <th scope="col">Bots reconhecidos</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.day}>
                  <td>{point.day}</td>
                  <td>{point.clicks}</td>
                  <td>{point.bots}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
}
