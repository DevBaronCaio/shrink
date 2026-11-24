import Link from "next/link";
import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Reference } from "./reference";

export const metadata = {
  title: "API para desenvolvedores",
  description: "Referência OpenAPI 3.1 da API REST do Shrink.",
  alternates: { canonical: "/docs" },
};

const examples = {
  cURL: `curl -X POST "$SHRINK_URL/api/v1/links" \\
  -H "Authorization: Bearer $SHRINK_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"title":"Guia","destinationUrl":"https://example.com/guia"}'`,
  JavaScript: `const response = await fetch(process.env.SHRINK_URL + "/api/v1/links", {
  method: "POST",
  headers: {
    Authorization: "Bearer " + process.env.SHRINK_KEY,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    title: "Guia", destinationUrl: "https://example.com/guia",
  }),
});
if (!response.ok) throw new Error("HTTP " + response.status);
console.log((await response.json()).data.shortUrl);`,
  TypeScript: `type LinkResponse = { data: { id: string; shortUrl: string } };
const response = await fetch(process.env.SHRINK_URL + "/api/v1/links", {
  headers: { Authorization: "Bearer " + process.env.SHRINK_KEY },
});
if (!response.ok) throw new Error("HTTP " + response.status);
const result: { data: LinkResponse["data"][] } = await response.json();
console.log(result.data.map((link) => link.shortUrl));`,
  Python: `import json, os, urllib.request

request = urllib.request.Request(
    os.environ["SHRINK_URL"] + "/api/v1/links",
    headers={"Authorization": "Bearer " + os.environ["SHRINK_KEY"]},
)
with urllib.request.urlopen(request) as response:
    print(json.load(response)["data"])`,
};

export default function DocsPage() {
  return (
    <>
      <header className="marketing-header">
        <div className="shell nav-shell">
          <Brand />
          <div className="page-actions">
            <Button variant="ghost" asChild>
              <Link href="/demo">Demonstração</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/developers">Gerenciar chaves</Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="shell docs-main stack views-gap">
        <header className="section-intro">
          <p className="eyebrow">Desenvolvedores</p>
          <h1>API REST do Shrink</h1>
          <p>
            Gerencie links e leia analytics com as mesmas regras do dashboard. A
            referência abaixo descreve os contratos e códigos HTTP da versão 1.
          </p>
          <Button variant="outline" asChild>
            <a href="/api/v1/openapi">OpenAPI 3.1 (JSON)</a>
          </Button>
        </header>
        <section className="panel analytics-panel">
          <h2>Autenticação e limites</h2>
          <p>
            Crie uma chave no dashboard e envie{" "}
            <code>Authorization: Bearer</code> com a chave completa. Leitura de
            links e métricas exige READ. Criação, edição e exclusão exigem
            WRITE.
          </p>
          <p>
            A API usa janelas fixas de 120 requisições por chave por minuto e
            600 por rede por minuto. Cada conta pode criar 30 links por hora,
            incluindo o dashboard. Em caso de 429, use <code>Retry-After</code>{" "}
            antes de tentar novamente.
          </p>
        </section>
        <section className="panel analytics-panel">
          <h2>Exemplos de requisição</h2>
          <p>
            Defina <code>SHRINK_URL</code> com o endereço da sua instalação e{" "}
            <code>SHRINK_KEY</code> com a chave no ambiente do servidor.
          </p>
          {Object.entries(examples).map(([language, example], index) => (
            <details
              className="docs-example"
              key={language}
              open={index === 0 || undefined}
            >
              <summary>{language}</summary>
              <pre>
                <code>{example}</code>
              </pre>
            </details>
          ))}
        </section>
        <section aria-label="Referência OpenAPI" className="scalar-wrap">
          <Reference />
        </section>
      </main>
    </>
  );
}
