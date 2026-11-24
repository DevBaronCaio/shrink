import Link from "next/link";
import { Link2, Plus } from "lucide-react";
import { requireUser } from "@/modules/auth/auth";
import { db } from "@/lib/db";
import { pageQuery, queryString, type PageQuery } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { PageTitle } from "@/components/shared/page-title";
import { LinkTable } from "@/modules/links/link-table";
import { LinkFilters } from "@/modules/links/filters";
import { listLinks, listTags } from "@/modules/links/service";
import { linkQueryKeys, listLinkSchema } from "@/modules/links/schema";

export const metadata = { title: "Links" };
export default async function LinksPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const user = await requireUser();
  const query = listLinkSchema.safeParse(
    pageQuery(await searchParams, linkQueryKeys),
  );
  if (!query.success)
    return (
      <section className="panel empty">
        <h1>Filtros inválidos</h1>
        <p>Confira as datas e os parâmetros da busca.</p>
        <Button asChild>
          <Link href="/dashboard/links">Limpar filtros</Link>
        </Button>
      </section>
    );
  const filters = query.data;
  const [results, tags, profile] = await Promise.all([
    listLinks(user.id, filters),
    listTags(user.id),
    db().user.findUnique({
      where: { id: user.id },
      select: { timezone: true },
    }),
  ]);
  const href = (page: number) =>
    `/dashboard/links${queryString({ ...filters, page })}`;
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Links"
        description="Crie, organize e acompanhe seus links."
      >
        <Button asChild>
          <Link href="/dashboard/links/novo">
            <Plus size={16} /> Criar link
          </Link>
        </Button>
      </PageTitle>
      <LinkFilters key={queryString(filters)} query={filters} tags={tags} />
      {results.items.length ? (
        <LinkTable
          links={results.items}
          timezone={profile?.timezone ?? "UTC"}
        />
      ) : (
        <section className="panel empty">
          <Link2 size={26} />
          <h2>
            {results.page > 1
              ? "Esta página está vazia"
              : "Nenhum link encontrado"}
          </h2>
          <p>Revise os filtros ou crie um link para começar.</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/links/novo">Criar link</Link>
          </Button>
        </section>
      )}
      {(results.total > 0 || results.page > 1) && (
        <div className="pagination">
          <p>
            {results.total.toLocaleString("pt-BR")} links · Página{" "}
            {results.page} de {Math.max(1, results.pages)}
          </p>
          <nav aria-label="Paginação">
            {results.page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={href(
                    Math.min(results.page - 1, Math.max(1, results.pages)),
                  )}
                >
                  Anterior
                </Link>
              </Button>
            )}
            {results.page < results.pages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={href(results.page + 1)}>Próxima</Link>
              </Button>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
