import { notFound } from "next/navigation";
import { requireUser } from "@/modules/auth/auth";
import { AppError } from "@/lib/errors";
import { LinkForm } from "@/modules/links/link-form";
import { getLink } from "@/modules/links/service";
import { PageTitle } from "@/components/shared/page-title";

export const metadata = { title: "Editar link" };
export default async function EditLinkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const link = await getLink(user.id, id).catch((error: unknown) => {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  });
  return (
    <div className="stack views-gap">
      <PageTitle title="Editar link" description={`/r/${link.slug}`} />
      <LinkForm link={link} />
    </div>
  );
}
