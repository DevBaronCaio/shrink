import { requireUser } from "@/modules/auth/auth";
import { LinkForm } from "@/modules/links/link-form";
import { PageTitle } from "@/components/shared/page-title";
import { pageQuery, type PageQuery } from "@/lib/query";
import { utmNames, utmSchema } from "@/modules/campaigns/utm";
import { MAX_DESTINATION_LENGTH } from "@/modules/links/new-link-path";

export const metadata = { title: "Novo link" };
export default async function NewLinkPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  await requireUser();
  const query = await searchParams;
  const { destino } = query;
  const rawUtm = pageQuery(query, utmNames);
  const initialUtm = Object.keys(rawUtm).length
    ? utmSchema.safeParse(rawUtm).data
    : undefined;
  return (
    <div className="stack views-gap">
      <PageTitle
        title="Novo link"
        description="Defina o destino e as regras de acesso."
      />
      <LinkForm
        initialUtm={initialUtm}
        destination={
          typeof destino === "string"
            ? destino.slice(0, MAX_DESTINATION_LENGTH)
            : undefined
        }
      />
    </div>
  );
}
