import Link from "next/link";
import { notFound } from "next/navigation";
import { QrCode } from "lucide-react";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { requireUser } from "@/modules/auth/auth";
import { getLink } from "@/modules/links/service";
import { QrEditor } from "@/modules/qr-codes/editor";
import { qrSchema } from "@/modules/qr-codes/settings";
import { PageTitle } from "@/components/shared/page-title";
import { Button } from "@/components/ui/button";
import type { PageQuery } from "@/lib/query";

export const metadata = { title: "QR Codes" };

export default async function QrPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const user = await requireUser();
  const { link } = await searchParams;
  const id = typeof link === "string" ? link : undefined;
  const client = db();
  const [selected, links, history] = await Promise.all([
    id ? getLink(user.id, id) : undefined,
    client.link.findMany({
      where: { userId: user.id },
      select: { id: true, title: true, slug: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    client.link.findMany({
      where: { userId: user.id, qrCreatedAt: { not: null } },
      select: { id: true, title: true, slug: true },
      orderBy: { qrCreatedAt: "desc" },
      take: 100,
    }),
  ]).catch((error: unknown) => {
    if (error instanceof AppError && error.status === 404) notFound();
    throw error;
  });
  return (
    <div className="stack views-gap">
      <PageTitle
        title="QR Codes"
        description="Gere imagens para compartilhar seus links encurtados."
      />
      {links.length ? (
        <>
          <form className="panel filters" action="/dashboard/qr">
            <div className="field grow">
              <label htmlFor="select-link">Escolha um link</label>
              <select
                key={id}
                defaultValue={id ?? ""}
                name="link"
                id="select-link"
                className="input"
                required
              >
                <option value="">Selecione um link recente</option>
                {selected && !links.some(({ id }) => id === selected.id) && (
                  <option value={selected.id}>{selected.title}</option>
                )}
                {links.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title} (/r/{item.slug})
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="outline">
              <QrCode size={16} /> Abrir QR Code
            </Button>
            <Button asChild variant="ghost">
              <Link href="/dashboard/links">Ver todos os links</Link>
            </Button>
          </form>
          {selected && (
            <QrEditor
              key={selected.id}
              id={selected.id}
              slug={selected.slug}
              url={selected.shortUrl}
              initial={qrSchema.safeParse(selected.qr).data}
            />
          )}
          <section className="panel analytics-panel">
            <h2>Histórico de QR Codes</h2>
            {history.length ? (
              <ul className="rank-list">
                {history.map((item) => (
                  <li key={item.id}>
                    <Link href={`/dashboard/qr?link=${item.id}`}>
                      {item.title}
                      <small>/r/{item.slug}</small>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Nenhuma imagem foi salva ainda.</p>
            )}
          </section>
        </>
      ) : (
        <section className="panel empty">
          <QrCode size={26} />
          <h2>Crie um link para gerar um QR Code</h2>
          <Button asChild>
            <Link href="/dashboard/links/novo">Criar link</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
