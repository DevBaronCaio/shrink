import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { ReportForm } from "@/modules/abuse/controls";

export const metadata = { title: "Denunciar link", robots: { index: false } };

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ slug?: string }>;
}) {
  const { slug } = await searchParams;
  return (
    <main id="main-content" className="auth-page">
      <Brand />
      <section className="panel auth-card">
        <h1>Denunciar link</h1>
        <p>
          Informe o slug e descreva o problema. Evite incluir dados pessoais no
          relato.
        </p>
        <ReportForm
          slug={typeof slug === "string" ? slug.slice(0, 48) : undefined}
        />
      </section>
      <Link className="muted" href="/privacidade">
        Política de privacidade
      </Link>
    </main>
  );
}
