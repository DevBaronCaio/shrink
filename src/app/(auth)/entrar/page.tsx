import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { auth, availableProviders } from "@/modules/auth/auth";
import { authContinuation } from "@/modules/auth/continuation";
import { ProviderButtons } from "./provider-buttons";
import { CredentialForm } from "@/modules/auth/credential-form";
import type { PageQuery } from "@/lib/query";

export const metadata = { title: "Entrar", robots: { index: false } };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const query = await searchParams;
  const providers = availableProviders();
  const continuation = authContinuation(query);
  if (await auth()) redirect(continuation.callback);
  return (
    <main id="main-content" className="auth-page">
      <Brand />
      <section className="panel auth-card">
        <h1>Entre no Shrink</h1>
        <p>
          {continuation.destination
            ? "Entre para continuar com o link que você informou."
            : "Acesse seus links e acompanhe os cliques."}
        </p>
        {query.error && (
          <p role="alert" className="error">
            {query.error === "OAuthAccountNotLinked"
              ? "Entre pelo provedor usado ao criar a conta."
              : "Falha na autenticação. Tente novamente."}
          </p>
        )}
        <CredentialForm mode="login" returnTo={continuation.callback} />
        {(providers.github || providers.google) && (
          <>
            <p className="auth-divider">ou continue com</p>
            <ProviderButtons
              providers={providers}
              callback={continuation.callback}
            />
          </>
        )}
        <p className="auth-switch">
          Ainda não tem conta?{" "}
          <Link href={`/criar-conta${continuation.query}`}>Criar conta</Link>
        </p>
        <Link href="/demo">Explorar a demonstração</Link>
      </section>
      <Link className="muted" href="/privacidade">
        Política de privacidade
      </Link>
    </main>
  );
}
