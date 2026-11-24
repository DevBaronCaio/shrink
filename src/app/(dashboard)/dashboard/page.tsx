import Link from "next/link";
import { Link2, Plus, QrCode, Tags } from "lucide-react";
import { requireUser } from "@/modules/auth/auth";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import { dashboardLinks, type ManagedLink } from "@/modules/links/service";
import { getAnalytics } from "@/modules/analytics/service";
import { analyticsKeys, analyticsSchema } from "@/modules/analytics/period";
import { PeriodFilter } from "@/modules/analytics/period-filter";
import { Report } from "@/modules/analytics/report";
import { pageQuery, queryString, type PageQuery } from "@/lib/query";
import { AppError } from "@/lib/errors";

export const metadata = { title: "Visão geral" };

function LinksSummary({
  title,
  links,
  empty,
  expirations = false,
  timezone = "UTC",
}: {
  title: string;
  links: ManagedLink[];
  empty: string;
  expirations?: boolean;
  timezone?: string;
}) {
  return (
    <section className="panel analytics-panel">
      <h2>{title}</h2>
      {links.length ? (
        <ul className="rank-list">
          {links.map((link) => (
            <li key={link.id}>
              <Link href={`/dashboard/links/${link.id}`}>
                {link.title}
                <small>/r/{link.slug}</small>
              </Link>
              <strong>
                {expirations && link.expiresAt
                  ? new Intl.DateTimeFormat("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      timeZone: timezone,
                    }).format(new Date(link.expiresAt))
                  : link.clickCount.toLocaleString("pt-BR")}
              </strong>
            </li>
          ))}
        </ul>
      ) : (
        <p className="helper">{empty}</p>
      )}
    </section>
  );
}

export default async function Overview({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const user = await requireUser();
  const input = pageQuery(await searchParams, analyticsKeys);
  const query = analyticsSchema.safeParse(input);
  const [data, analytics] = await Promise.all([
    dashboardLinks(user.id),
    query.success
      ? getAnalytics(user.id, query.data).catch((error: unknown) => {
          if (error instanceof AppError && error.status === 422)
            return error.message;
          throw error;
        })
      : "Use um período e um tipo de tráfego válidos.",
  ]);
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Visão geral"
        description="Acompanhe o desempenho dos seus links."
      />
      <div className="stat-grid">
        {[
          ["Total de links", data.links],
          ["Links ativos", data.active],
          ["Total acumulado de cliques", data.clicks],
        ].map(([label, value]) => (
          <div key={label} className="panel stat">
            <p>{label}</p>
            <strong>{value.toLocaleString("pt-BR")}</strong>
          </div>
        ))}
      </div>
      <div className="quick-actions">
        <Button asChild variant="outline">
          <Link href="/dashboard/links/novo">
            <Plus size={16} /> Criar link
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/links">
            <Link2 size={16} /> Meus links
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/qr">
            <QrCode size={16} /> Gerar QR Code
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/dashboard/utm">
            <Tags size={16} /> Montar UTM
          </Link>
        </Button>
      </div>
      {typeof analytics === "string" || !query.success ? (
        <section className="panel empty">
          <p role="alert">
            {typeof analytics === "string" ? analytics : "Filtros inválidos."}
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard">Limpar filtros</Link>
          </Button>
        </section>
      ) : (
        <>
          <PeriodFilter
            key={queryString(input)}
            query={query.data}
            pathname="/dashboard"
          />
          <Report
            report={analytics}
            compact
            topHref={(id) => `/dashboard/links/${id}${queryString(input)}`}
          />
        </>
      )}
      <div className="analytics-grid two">
        <LinksSummary
          title="Links recentes"
          links={data.recent}
          empty="Crie um link para começar."
        />
        <LinksSummary
          title="Expiram nos próximos 7 dias"
          links={data.expiring}
          empty="Nenhum link está prestes a expirar."
          expirations
          timezone={
            typeof analytics === "string"
              ? undefined
              : analytics.period.timezone
          }
        />
      </div>
    </div>
  );
}
