import Link from "next/link";
import {
  Activity,
  ChartNoAxesColumnIncreasing,
  ExternalLink,
  FlaskConical,
  Link2,
  QrCode,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/page-title";
import { CopyButton } from "@/components/shared/copy-button";
import { appUrl } from "@/config/site";
import { analyticsKeys, analyticsSchema } from "@/modules/analytics/period";
import { PeriodFilter } from "@/modules/analytics/period-filter";
import { Report } from "@/modules/analytics/report";
import { QrEditor } from "@/modules/qr-codes/editor";
import { demoLinks, demoReport } from "@/modules/demo/data";
import { pageQuery, queryString, type PageQuery } from "@/lib/query";
import { AppError } from "@/lib/errors";

export const metadata = {
  title: "Demonstração",
  description: "Explore a demonstração do Shrink com dados de exemplo.",
  alternates: { canonical: "/demo" },
};

const tabs = [
  { id: "overview", title: "Visão geral", icon: ChartNoAxesColumnIncreasing },
  { id: "links", title: "Links", icon: Link2 },
  { id: "analytics", title: "Analytics", icon: Activity },
  { id: "qr", title: "QR Codes", icon: QrCode },
];

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const raw = await searchParams;
  const tab = tabs.find(({ id }) => id === raw.aba) ?? tabs[0];
  const filters = pageQuery(raw, analyticsKeys);
  const query = analyticsSchema.safeParse(filters);
  const selected = demoLinks.find(({ id }) => id === raw.link);
  const urlFor = (slug: string) => `${appUrl()}/demo/r/${slug}`;
  const now = new Date();
  let report: ReturnType<typeof demoReport> | undefined;
  let error = query.success ? "" : "Use filtros válidos.";
  if (
    query.success &&
    (tab.id === "overview" || tab.id === "analytics" || tab.id === "links")
  ) {
    try {
      report = demoReport(
        tab.id === "links"
          ? analyticsSchema.parse({ period: "30d" })
          : query.data,
        now,
        tab.id === "analytics" ? selected?.id : undefined,
      );
    } catch (issue) {
      if (issue instanceof AppError) error = issue.message;
      else throw issue;
    }
  }
  const tabHref = (target: string, link?: string) =>
    `/demo${queryString({ ...filters, aba: target, link })}`;
  return (
    <>
      <header className="marketing-header">
        <div className="shell nav-shell">
          <Brand />
          <div className="page-actions">
            <Button variant="ghost" asChild>
              <Link href="/docs">API</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/criar-conta">Criar conta</Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="shell demo-main stack views-gap">
        <div className="demo-notice">
          <FlaskConical size={17} />
          <p>
            <strong>Demonstração pública.</strong> Os dados nesta área são
            exemplos e não representam acessos reais.
          </p>
        </div>
        <PageTitle
          title={tab.title}
          description={
            selected && tab.id === "analytics"
              ? selected.title
              : "Workspace de demonstração"
          }
        />
        <nav className="demo-tabs" aria-label="Demonstração">
          {tabs.map(({ id, title, icon: Icon }) => (
            <Link
              key={id}
              href={tabHref(id)}
              aria-current={id === tab.id ? "page" : undefined}
            >
              <Icon size={16} />
              {title}
            </Link>
          ))}
        </nav>
        {(tab.id === "overview" || tab.id === "analytics") &&
          (report && query.success ? (
            <>
              {tab.id === "overview" && (
                <div className="stat-grid">
                  <div className="panel stat">
                    <p>Links de exemplo</p>
                    <strong>{demoLinks.length}</strong>
                  </div>
                  <div className="panel stat">
                    <p>Links disponíveis</p>
                    <strong>{demoLinks.length}</strong>
                  </div>
                </div>
              )}
              {selected && tab.id === "analytics" && (
                <Link className="accent" href={tabHref("analytics")}>
                  Ver todos os links
                </Link>
              )}
              <PeriodFilter
                key={queryString(filters)}
                query={query.data}
                pathname="/demo"
                extra={{
                  aba: tab.id,
                  ...(selected ? { link: selected.id } : {}),
                }}
              />
              <Report
                report={report}
                topHref={
                  selected && tab.id === "analytics"
                    ? undefined
                    : (id) => tabHref("analytics", id)
                }
                compact={tab.id === "overview"}
              />
            </>
          ) : (
            <section className="panel empty">
              <p role="alert">{error}</p>
              <Button asChild variant="outline">
                <Link href={`/demo?aba=${tab.id}`}>Limpar filtros</Link>
              </Button>
            </section>
          ))}
        {tab.id === "links" && (
          <div
            className="table-scroll"
            tabIndex={0}
            role="region"
            aria-label="Links de exemplo"
          >
            <table className="data-table">
              <thead>
                <tr>
                  {[
                    "Link",
                    "Destino",
                    "Cliques em 30 dias",
                    "Tag",
                    "Ações",
                  ].map((title) => (
                    <th key={title} scope="col">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demoLinks.map((link) => (
                  <tr key={link.id}>
                    <td>
                      <div className="table-link">
                        <Link href={tabHref("analytics", link.id)}>
                          {link.title}
                        </Link>
                        <a
                          href={urlFor(link.slug)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          /demo/r/{link.slug} <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>
                    <td>
                      <span
                        className="truncate-value"
                        title={link.destinationUrl}
                      >
                        {link.destinationUrl}
                      </span>
                    </td>
                    <td>
                      {report?.topLinks.find(({ id }) => id === link.id)
                        ?.clicks ?? 0}
                    </td>
                    <td>
                      <span className="tag">{link.tag}</span>
                    </td>
                    <td>
                      <div className="page-actions">
                        <CopyButton value={urlFor(link.slug)} iconOnly />
                        <Button asChild variant="ghost" size="icon">
                          <Link
                            href={tabHref("qr", link.id)}
                            aria-label={`QR Code de ${link.title}`}
                          >
                            <QrCode size={17} />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {tab.id === "qr" && (
          <>
            <div
              className="quick-actions"
              aria-label="Escolher link de exemplo"
            >
              {demoLinks.map((link) => (
                <Button
                  asChild
                  size="sm"
                  variant={
                    link.id === (selected ?? demoLinks[0]).id
                      ? "default"
                      : "outline"
                  }
                  key={link.id}
                >
                  <Link
                    href={tabHref("qr", link.id)}
                    aria-current={
                      link.id === (selected ?? demoLinks[0]).id
                        ? "true"
                        : undefined
                    }
                  >
                    {link.title}
                  </Link>
                </Button>
              ))}
            </div>
            <QrEditor
              key={(selected ?? demoLinks[0]).id}
              id={(selected ?? demoLinks[0]).id}
              slug={(selected ?? demoLinks[0]).slug}
              url={urlFor((selected ?? demoLinks[0]).slug)}
              demo
            />
          </>
        )}
      </main>
    </>
  );
}
