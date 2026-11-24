import Link from "next/link";
import { redirect } from "next/navigation";
import { Brand } from "@/components/layout/brand";
import { auth, availableProviders } from "@/modules/auth/auth";
import { authContinuation } from "@/modules/auth/continuation";
import { CredentialForm } from "@/modules/auth/credential-form";
import type { PageQuery } from "@/lib/query";
import { ProviderButtons } from "../entrar/provider-buttons";

export const metadata = { title: "Criar conta", robots: { index: false } };

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<PageQuery>;
}) {
  const query = await searchParams;
  const continuation = authContinuation({
    ...query,
    callbackUrl: query.callbackUrl ?? query.returnTo,
  });
  const providers = availableProviders();
  if (await auth()) redirect(continuation.callback);
  return (
    <main id="main-content" className="auth-page">
      <Brand />
      <section className="panel auth-card">
        <h1>Crie sua conta</h1>
        <p>
          {continuation.destination
            ? "Seu link estará preenchido assim que você criar a conta."
            : "Crie links curtos e acompanhe seus resultados."}
        </p>
        <CredentialForm mode="signup" returnTo={continuation.callback} />
        {(providers.github || providers.google) && (
          <>
            <p className="auth-divider">ou crie com</p>
            <ProviderButtons
              providers={providers}
              callback={continuation.callback}
            />
          </>
        )}
        <p className="auth-switch">
          Já tem conta?{" "}
          <Link href={`/entrar${continuation.query}`}>Entrar</Link>
        </p>
      </section>
      <Link className="muted" href="/privacidade">
        Política de privacidade
      </Link>
    </main>
  );
}
