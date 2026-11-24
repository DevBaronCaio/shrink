import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main-content" className="auth-page">
      <Brand />
      <section className="panel auth-card">
        <p className="eyebrow">404</p>
        <h1>Página não encontrada</h1>
        <p>Confira o endereço ou volte à página inicial.</p>
        <Button asChild>
          <Link href="/">Ir para o início</Link>
        </Button>
      </section>
    </main>
  );
}
