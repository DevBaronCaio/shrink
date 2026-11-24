import {
  Activity,
  ChartNoAxesColumnIncreasing,
  ChevronDown,
  CircleHelp,
  Link2,
  QrCode,
  Shrink,
} from "lucide-react";

const points = [
  16, 23, 21, 31, 28, 36, 32, 44, 41, 47, 44, 61, 48, 56, 53, 68, 64, 70, 67,
  84, 74, 82, 78, 96, 88, 93, 89, 100,
];
const nav = [
  [ChartNoAxesColumnIncreasing, "Visão geral"],
  [Link2, "Links"],
  [Activity, "Analytics"],
  [QrCode, "QR Codes"],
] as const;

export function ProductPreview() {
  return (
    <figure
      className="product-window"
      aria-label="Demonstração ilustrativa do painel de analytics"
    >
      <div className="window-bar">
        <span className="window-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="window-address">
          <LockIcon /> shrink / dashboard
        </span>
        <span className="window-demo">
          <i /> DEMONSTRAÇÃO
        </span>
      </div>
      <div className="window-app">
        <div className="window-sidebar" aria-hidden="true">
          <div className="window-brand">
            <Shrink size={16} /> Shrink<span>.</span>
          </div>
          {nav.map(([Icon, label], index) => (
            <span
              key={label}
              className={index === 0 ? "window-nav active" : "window-nav"}
            >
              <Icon size={13} /> {label}
            </span>
          ))}
          <span className="window-nav window-help">
            <CircleHelp size={13} /> Ajuda
          </span>
        </div>
        <div className="window-main">
          <div className="window-heading">
            <div>
              <div className="window-crumb">Workspace / Analytics</div>
              <h2>Visão geral</h2>
            </div>
            <span className="window-select">
              Últimos 30 dias <ChevronDown size={13} />
            </span>
          </div>
          <div className="window-stats">
            {[
              ["Cliques", "2.481"],
              ["Visitantes estimados", "1.756"],
              ["Links ativos", "24"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="window-chart">
            <div>
              <b>Cliques ao longo do tempo</b>
              <small>
                <i /> Cliques
              </small>
            </div>
            <div className="plot-preview">
              <div className="plot-labels">
                <span>200</span>
                <span>150</span>
                <span>100</span>
                <span>50</span>
              </div>
              <div className="plot-bars">
                {points.map((height, index) => (
                  <i key={index} style={{ height: `${height}%` }} />
                ))}
              </div>
            </div>
            <div className="plot-dates">
              <span>01 nov.</span>
              <span>08 nov.</span>
              <span>15 nov.</span>
              <span>22 nov.</span>
              <span>30 nov.</span>
            </div>
          </div>
        </div>
      </div>
    </figure>
  );
}

function LockIcon() {
  return (
    <span className="address-lock" aria-hidden="true">
      ⌑
    </span>
  );
}
