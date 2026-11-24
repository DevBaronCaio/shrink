import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, Pencil, QrCode } from "lucide-react";
import { requireUser } from "@/modules/auth/auth";
import { AppError } from "@/lib/errors";
import { pageQuery, queryString, type PageQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/shared/copy-button";
import { PageTitle } from "@/components/shared/page-title";
import { getLink } from "@/modules/links/service";
import { analyticsKeys, analyticsSchema } from "@/modules/analytics/period";
import { getAnalytics } from "@/modules/analytics/service";
import { PeriodFilter } from "@/modules/analytics/period-filter";
import { Report } from "@/modules/analytics/report";

export const metadata = { title: "Analytics do link" };

export default async function LinkAnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<PageQuery>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const href = `/dashboard/links/${id}`;
  const query = pageQuery(await searchParams, analyticsKeys);
  const parsed = analyticsSchema.safeParse(query);
  const [link, data] = await Promise.all([
    getLink(user.id, id),
    parsed.success
      ? getAnalytics(user.id, parsed.data, id).catch((error: unknown) => {
          if (error instanceof AppError && error.status === 422)
            return error.message;
          throw error;
        })
      : "Use um período e um tipo de tráfego válidos.",
  ]).catch((error: unknown) => {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  });
  return (
    <div className="stack views-gap">
      <Button asChild variant="ghost" size="sm" className="link-list-return">
        <Link href="/dashboard/links">
          <ArrowLeft size={16} /> Voltar para links
        </Link>
      </Button>
      <PageTitle
        title={link.title}
        description={link.description ?? "Analytics do link"}
      >
        <Button asChild variant="outline">
          <Link href={`${href}/editar`}>
            <Pencil size={16} /> Editar
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/dashboard/qr?link=${id}`}>
            <QrCode size={16} /> QR Code
          </Link>
        </Button>
        {typeof data !== "string" && (
          <Button asChild variant="outline">
            <a
              href={`/api/dashboard/export${queryString({ ...query, link: id })}`}
            >
              <Download size={16} /> Exportar CSV
            </a>
          </Button>
        )}
      </PageTitle>
      <section className="panel stack link-ident">
        <div>
          <h2>Link encurtado</h2>
          <a
            className="accent"
            href={link.shortUrl}
            target="_blank"
            rel="noreferrer"
          >
            {link.shortUrl}
          </a>
          <p>{link.destinationUrl}</p>
        </div>
        <CopyButton value={link.shortUrl} />
      </section>
      <div className="stat-grid">
        <section className="panel stat">
          <p>Total acumulado de cliques</p>
          <strong>{link.clickCount.toLocaleString("pt-BR")}</strong>
        </section>
      </div>
      {typeof data === "string" || !parsed.success ? (
        <section className="panel empty">
          <p role="alert">
            {typeof data === "string" ? data : "Filtros inválidos."}
          </p>
          <Button asChild variant="outline">
            <Link href={href}>Limpar filtros</Link>
          </Button>
        </section>
      ) : (
        <>
          <PeriodFilter
            key={queryString(query)}
            query={parsed.data}
            pathname={href}
          />
          <Report report={data} />
        </>
      )}
    </div>
  );
}
