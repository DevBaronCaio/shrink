import Link from "next/link";
import { Download } from "lucide-react";
import { requireUser } from "@/modules/auth/auth";
import { pageQuery, queryString, type PageQuery } from "@/lib/query";
import { AppError } from "@/lib/errors";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/page-title";
import { getAnalytics } from "@/modules/analytics/service";
import { analyticsKeys, analyticsSchema } from "@/modules/analytics/period";
import { PeriodFilter } from "@/modules/analytics/period-filter";
import { Report } from "@/modules/analytics/report";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const user = await requireUser();
  const input = pageQuery(await searchParams, analyticsKeys);
  const query = analyticsSchema.safeParse(input);
  const data = query.success
    ? await getAnalytics(user.id, query.data).catch((error: unknown) => {
        if (error instanceof AppError && error.status === 422)
          return error.message;
        throw error;
      })
    : "Use um período e um tipo de tráfego válidos.";

  return (
    <div className="stack views-gap">
      <PageTitle
        title="Analytics"
        description="Acompanhe como os seus links são acessados."
      >
        {typeof data !== "string" && (
          <Button variant="outline" asChild>
            <a href={`/api/dashboard/export${queryString(input)}`}>
              <Download size={16} /> Exportar CSV
            </a>
          </Button>
        )}
      </PageTitle>
      {typeof data === "string" || !query.success ? (
        <section className="panel empty">
          <p role="alert">
            {typeof data === "string" ? data : "Filtros inválidos."}
          </p>
          <Button asChild variant="outline">
            <Link href="/dashboard/analytics">Limpar filtros</Link>
          </Button>
        </section>
      ) : (
        <>
          <PeriodFilter
            key={queryString(input)}
            query={query.data}
            pathname="/dashboard/analytics"
          />
          <Report
            report={data}
            topHref={(id) => `/dashboard/links/${id}${queryString(input)}`}
          />
        </>
      )}
    </div>
  );
}
