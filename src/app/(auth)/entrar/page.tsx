import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { availableProviders } from "@/modules/auth/auth";
import { ProviderButtons } from "./provider-buttons";

export const metadata = { title: "Entrar", robots: { index: false } };
type Params = { destino?: string; callbackUrl?: string; error?: string };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Params>;
}) {
  const query = await searchParams;
  const providers = availableProviders();
  const callback = query.destino
    ? `/dashboard/links/novo?destino=${encodeURIComponent(query.destino.slice(0, 2048))}`
    : "/dashboard";
  return (
    <main id="main-content" className="auth-page">
      <Brand />
      <section className="panel auth-card">
        <h1>Entre no Shrink</h1>
        <p>Use sua conta para gerenciar seus links e acompanhar os acessos.</p>
        {query.error && (
          <p role="alert" className="error">
            {query.error === "OAuthAccountNotLinked"
              ? "Entre pelo provedor usado ao criar a conta."
              : "Falha na autenticação. Tente novamente."}
          </p>
        )}
        <ProviderButtons providers={providers} callback={callback} />
        {!providers.github && !providers.google && (
          <p>As integrações de login aguardam configuração neste ambiente.</p>
        )}
        <Link href="/demo">Explorar a demonstração</Link>
      </section>
      <Link className="muted" href="/privacidade">
        Política de privacidade
      </Link>
    </main>
  );
}
