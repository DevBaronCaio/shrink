import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { availableProviders } from "@/modules/auth/auth";
import { CredentialForm } from "@/modules/auth/credential-form";
import { ProviderButtons } from "../entrar/provider-buttons";

export const metadata = { title: "Criar conta", robots: { index: false } };

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const callback = typeof returnTo === "string" && returnTo.startsWith("/dashboard") && !returnTo.startsWith("//") ? returnTo : "/dashboard";
  const providers = availableProviders();
  return (
    <main id="main-content" className="auth-page">
      <Brand />
      <section className="panel auth-card">
        <h1>Crie sua conta</h1>
        <p>Comece a encurtar links e acompanhar seus resultados.</p>
        <CredentialForm mode="signup" returnTo={callback} />
        {(providers.github || providers.google) && <><p className="auth-divider">ou crie com</p><ProviderButtons providers={providers} callback={callback} /></>}
        <p className="auth-switch">Já tem conta? <Link href={`/entrar?callbackUrl=${encodeURIComponent(callback)}`}>Entrar</Link></p>
      </section>
      <Link className="muted" href="/privacidade">Política de privacidade</Link>
    </main>
  );
}
