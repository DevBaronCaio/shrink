import Link from "next/link";
import { Brand } from "@/components/layout/brand";

export const metadata = {
  title: "Privacidade",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <>
      <header className="marketing-header">
        <div className="shell nav-shell">
          <Brand />
          <Link href="/docs">Documentação</Link>
        </div>
      </header>
      <main id="main-content" className="shell docs-main stack views-gap">
        <header className="section-intro">
          <h1>Política de privacidade</h1>
          <p>
            Veja quais dados o Shrink usa para gerenciar links, proteger contas
            e medir acessos.
          </p>
        </header>
        <section className="panel analytics-panel">
          <h2>Conta e sessões</h2>
          <p>
            Guardamos seu nome, e-mail, preferências e dados de sessão. No
            cadastro com senha, armazenamos apenas um hash da senha. Se você
            entrar com GitHub ou Google, guardamos o identificador do provedor e
            o avatar, quando disponível.
          </p>
        </section>
        <section className="panel analytics-panel">
          <h2>Dados de acesso</h2>
          <p>
            Registramos momento do acesso, link, domínio de origem, país e
            região quando fornecidos pela Vercel, além de navegador,
            dispositivo, sistema operacional e sinais estimados de robôs. A
            origem pode estar ausente devido às políticas do navegador ou do
            site de origem.
          </p>
          <p>
            Quando a estimativa de visitantes está habilitada, derivamos um
            identificador pseudonimizado com HMAC a partir das informações de
            rede. O Shrink não grava endereços IP brutos e não usa cookies de
            rastreamento no redirecionamento. Uma mesma rede pode representar
            várias pessoas e a rotação das chaves pode contar um visitante
            novamente.
          </p>
        </section>
        <section className="panel analytics-panel">
          <h2>Retenção</h2>
          <p>
            Analytics consulta até 90 dias de eventos e uma rotina diária remove
            os mais antigos. O contador acumulado permanece enquanto o link
            estiver cadastrado. A rotina também encerra sessões vencidas, remove
            janelas de rate limiting expiradas e apaga denúncias antigas de
            acordo com a política de retenção.
          </p>
        </section>
        <section className="panel analytics-panel">
          <h2>Exportação e exclusão</h2>
          <p>
            Nas configurações da conta, você pode exportar o perfil e os
            registros dos seus links ou excluir a conta. As páginas de analytics
            exportam agregados em CSV. Ao excluir um link ou a conta, os eventos
            vinculados são removidos da base ativa.
          </p>
        </section>
        <section className="panel analytics-panel">
          <h2>Infraestrutura e contato</h2>
          <p>
            A aplicação roda na Vercel com persistência PostgreSQL no Neon. Os
            provedores de login processam os dados necessários à autenticação.
            Para relatar uso abusivo, use o formulário de denúncia. A instância
            do Shrink deve indicar seu canal de privacidade na documentação do
            repositório.
          </p>
          <div className="page-actions">
            <Link className="accent" href="/denunciar">
              Denunciar link
            </Link>
            <Link className="accent" href="/dashboard/settings">
              Gerenciar meus dados
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
