import Link from "next/link";
import {
  Activity,
  Braces,
  ChartNoAxesColumnIncreasing,
  Github,
  Link2,
  QrCode,
  ShieldCheck,
  Tags,
} from "lucide-react";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { appUrl, site } from "@/config/site";
import { HeroForm } from "./hero-form";
import { ProductPreview } from "./product-preview";

export const metadata = { alternates: { canonical: "/" } };

const features = [
  {
    icon: Link2,
    title: "Links sob seu controle",
    copy: "Personalize o slug, altere o destino e defina a validade ou o limite de cliques.",
  },
  {
    icon: Activity,
    title: "Analytics por link",
    copy: "Compare períodos e descubra quais links, dispositivos e origens geram acessos.",
  },
  {
    icon: QrCode,
    title: "QR Codes editáveis",
    copy: "Ajuste cores e tamanho. Baixe em PNG ou SVG e acompanhe os acessos ao link.",
  },
  {
    icon: Tags,
    title: "Campanhas com UTM",
    copy: "Monte URLs de campanha, preserve os parâmetros existentes e organize links com tags.",
  },
  {
    icon: Braces,
    title: "API versionada",
    copy: "Crie e gerencie links por REST com chaves revogáveis e escopos de acesso.",
  },
  {
    icon: ShieldCheck,
    title: "Privacidade por padrão",
    copy: "A plataforma limita a coleta de dados e mantém as informações de cada conta isoladas.",
  },
];

const questions = [
  [
    "Posso alterar o destino de um link?",
    "Sim. O endereço encurtado e o histórico de cliques são preservados ao editar o destino.",
  ],
  [
    "Preciso de conta para experimentar?",
    "Você pode usar a prévia e explorar a demonstração pública sem conta. Entre com GitHub ou Google para criar links.",
  ],
  [
    "O que acontece quando o link expira?",
    "O Shrink exibe uma página informativa e interrompe o redirecionamento. Você pode alterar a validade no painel.",
  ],
  [
    "O Shrink armazena meu endereço IP?",
    "A plataforma não armazena IP bruto. Quando a estimativa de visitantes está habilitada, ela usa identificadores pseudonimizados com retenção limitada.",
  ],
];

export default function Landing() {
  const origin = appUrl();
  return (
    <>
      <header className="marketing-header">
        <div className="shell nav-shell">
          <Brand />
          <nav className="marketing-nav" aria-label="Navegação principal">
            <a href="#recursos">Recursos</a>
            <a href="#analytics">Analytics</a>
            <a href="#developers">Desenvolvedores</a>
          </nav>
          <div className="nav-actions">
            <Button variant="ghost" size="icon" asChild>
              <a href={site.github} aria-label="GitHub">
                <Github size={19} />
              </a>
            </Button>
            <Button variant="ghost" className="nav-login" asChild>
              <Link href="/entrar">Entrar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/criar-conta">Começar gratuitamente</Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content">
        <section className="hero shell">
          <div className="hero-content">
            <h1>
              Links menores.
              <br />
              <em>Insights maiores.</em>
            </h1>
            <p>{site.description}</p>
            <HeroForm origin={origin} />
            <div className="hero-demo-link">
              <Link href="/demo">
                <ChartNoAxesColumnIncreasing size={17} /> Explorar dashboard
              </Link>
            </div>
          </div>
          <ProductPreview />
        </section>
        <section id="recursos" className="marketing-band">
          <div className="shell">
            <div className="section-intro">
              <p className="eyebrow">Recursos</p>
              <h2>Do link à análise</h2>
              <p>
                Crie endereços curtos, organize suas campanhas e entenda o que
                acontece após cada clique.
              </p>
            </div>
            <div className="feature-grid">
              {features.map(({ icon: Icon, title, copy }) => (
                <article key={title}>
                  <span>
                    <Icon size={21} />
                  </span>
                  <h3>{title}</h3>
                  <p>{copy}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="analytics" className="shell split-section">
          <div className="section-intro">
            <p className="eyebrow">Analytics</p>
            <h2>Entenda o que acontece depois do clique</h2>
            <p>
              Selecione um período, compare com o anterior e veja os acessos por
              origem, país, dispositivo e link. Exporte os dados agregados em
              CSV.
            </p>
            <Button asChild variant="outline">
              <Link href="/demo?aba=analytics">
                Ver analytics na demonstração
              </Link>
            </Button>
          </div>
          <div className="workflow">
            <h3>Como funciona</h3>
            <ul>
              <li>
                <Link2 size={20} />
                <div>
                  <strong>Crie seu link</strong>
                  <p>
                    Cole a URL e escolha um slug ou deixe o Shrink gerar um.
                  </p>
                </div>
              </li>
              <li>
                <QrCode size={20} />
                <div>
                  <strong>Compartilhe</strong>
                  <p>Use o link curto em uma campanha ou gere um QR Code.</p>
                </div>
              </li>
              <li>
                <Activity size={20} />
                <div>
                  <strong>Acompanhe</strong>
                  <p>
                    Veja quais links recebem cliques e de onde vêm os acessos.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>
        <section id="developers" className="marketing-band">
          <div className="shell split-section">
            <div className="section-intro">
              <p className="eyebrow">Desenvolvedores</p>
              <h2>Links para seus próprios apps</h2>
              <p>
                Integre o encurtador ao seu fluxo com uma API REST versionada,
                chaves com escopo e documentação OpenAPI.
              </p>
              <Button asChild variant="outline">
                <Link href="/docs">Ler documentação</Link>
              </Button>
            </div>
            <div className="code-window">
              <div>
                <Braces size={16} /> <span>POST /api/v1/links</span>
              </div>
              <pre>
                <code>
                  {
                    'curl "$SHRINK_URL/api/v1/links" \\\n  -H "Authorization: Bearer $SHRINK_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"title":"Guia","destinationUrl":"https://example.com/guia"}\''
                  }
                </code>
              </pre>
            </div>
          </div>
        </section>
        <section className="shell faq-section">
          <div className="section-intro">
            <p className="eyebrow">FAQ</p>
            <h2>Perguntas frequentes</h2>
          </div>
          <div className="faq-list">
            {questions.map(([title, answer]) => (
              <details key={title}>
                <summary>{title}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="shell final-cta">
          <h2>Crie seu primeiro link</h2>
          <p>Comece com sua conta GitHub ou Google.</p>
          <Button asChild size="lg">
            <Link href="/criar-conta">Começar gratuitamente</Link>
          </Button>
        </section>
      </main>
      <footer className="marketing-footer">
        <div className="shell">
          <Brand />
          <nav aria-label="Rodapé">
            <Link href="/demo">Demonstração</Link>
            <Link href="/docs">Documentação</Link>
            <Link href="/privacidade">Privacidade</Link>
            <Link href="/denunciar">Denunciar link</Link>
            <a href={site.github}>GitHub</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
