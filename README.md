# Shrink

**Links menores. Insights maiores.** Crie endereços curtos editáveis e acompanhe seus acessos. Um único projeto Next.js serve a landing, o dashboard, o redirecionamento e a API REST.

- [Instância na Vercel](https://shrink-iota.vercel.app) e [demonstração pública](https://shrink-iota.vercel.app/demo) com dados de exemplo isolados.
- [API pública](https://shrink-iota.vercel.app/docs) com OpenAPI 3.1 e exemplos em cURL, JavaScript, TypeScript e Python.
- [Case de portfólio](docs/CASE-STUDY.md) com a arquitetura, os trade-offs e as evidências de teste.

## Funcionalidades

- Login GitHub e Google, sessões no PostgreSQL, perfil, tema, fuso, exportação e exclusão da conta.
- Slug automático ou personalizado, tags, expiração, limite de cliques e campanhas UTM. A listagem oferece busca, filtros e paginação no servidor.
- Redirecionamento 302 sem cache. O incremento do contador e a gravação do evento são atômicos.
- Analytics por conta e por link, filtros, comparação, CSV e QR Codes em PNG ou SVG.
- API Keys com hash SHA-256, escopos, expiração e revogação. Rate limiting persistido.
- Denúncia de links, bloqueio por moderação e retenção diária. Demonstração pública somente para leitura.

## Arquitetura

Next.js 16 e React 19 com TypeScript strict, Tailwind, componentes shadcn/ui, Radix, TanStack Table e Recharts. Auth.js estável com adaptador Prisma. PostgreSQL no Neon e runtime Node.js na Vercel. Vitest, Playwright, k6 e GitHub Actions cobrem teste e entrega.

```text
src/app/          Páginas, Route Handlers e metadados
src/components/   Componentes de interface e layout
src/modules/      Auth, links, redirecionamento, analytics, QR, UTM, API e abuso
src/lib/          Prisma, rate limiting e observabilidade
prisma/           Schema, migrations versionadas e seed local
tests/            Unitários, integração, navegador e carga
docs/             Arquitetura, segurança, deploy e case técnico
```

```mermaid
erDiagram
    USER ||--o{ ACCOUNT : vincula
    USER ||--o{ SESSION : autentica
    USER ||--o{ LINK : possui
    USER ||--o{ API_KEY : emite
    USER ||--o{ TAG : organiza
    LINK ||--o{ LINK_TAG : recebe
    TAG ||--o{ LINK_TAG : classifica
    LINK ||--o{ CLICK_EVENT : gera
    LINK ||--o{ LINK_REPORT : recebe
```

```mermaid
flowchart LR
    A["GET /r/:slug"] --> B["Validar slug"]
    B --> C["UPDATE condicional e INSERT do evento"]
    C -->|Commit do clique| D["302 para o destino"]
    C -->|Sem admissão| E["404 ou 410"]
    C -->|Falha no banco| F["503 sem redirecionar"]
```

- [Arquitetura](docs/ARCHITECTURE.md) e [ADRs](docs/adr/)
- [Modelagem e índices](docs/DATABASE.md)
- [API](docs/API.md), [segurança](docs/SECURITY.md) e [benchmarks](docs/BENCHMARKS.md)

## Executar localmente

Use Node.js 22, pnpm 10 e PostgreSQL 16 ou um branch de desenvolvimento do Neon.

```bash
corepack enable
pnpm install --frozen-lockfile
cp .env.example .env
```

Preencha a URL pooled, a URL direta e o segredo Auth.js em .env. Para entrar, configure os provedores OAuth com os callbacks locais descritos no [guia de deploy](docs/DEPLOYMENT.md). A landing e a demonstração funcionam sem OAuth.

```bash
pnpm db:deploy
pnpm dev
```

Acesse http://localhost:3000. Para um build de produção local, use pnpm build e pnpm start. O seed é opt-in e exige PostgreSQL local. A demonstração pública usa fixtures próprias.

### Variáveis de ambiente

| Variável                            | Uso                                        |
| ----------------------------------- | ------------------------------------------ |
| DATABASE_URL                        | Prisma em tempo de execução                |
| DIRECT_URL                          | Migrations pela conexão direta             |
| AUTH_SECRET                         | Auth.js e HMAC temporário do rate limiting |
| AUTH_GITHUB_ID e AUTH_GITHUB_SECRET | Login GitHub                               |
| AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET | Login Google                               |
| NEXTAUTH_URL e NEXT_PUBLIC_APP_URL  | Origens canônicas de OAuth e links         |
| ANALYTICS_HASH_SECRET               | Estimativa de visitantes, opcional         |
| CRON_SECRET                         | Autenticação do cron de retenção           |
| BLOCKED_DOMAINS                     | Domínios bloqueados                        |
| MODERATOR_IDENTITIES                | Identidades OAuth de moderação             |
| NEXT_PUBLIC_GITHUB_URL              | Destino público do link GitHub             |

## Testes e capturas

Use um PostgreSQL descartável para integração e E2E. O nome do banco deve terminar em _test.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build

export TEST_DATABASE_URL=postgresql://shrink:shrink@localhost:5432/shrink_test
DIRECT_URL="$TEST_DATABASE_URL" pnpm db:deploy
pnpm test:integration

pnpm exec playwright install chromium
pnpm test:e2e
```

O Playwright cria sessões no banco descartável. A autenticação da aplicação usa o mesmo código de produção. Para capturas reais, execute SHRINK_CAPTURE=1 pnpm test:e2e tests/e2e/demo.spec.ts. A landing e a demonstração serão gravadas como PNGs em docs/screenshots. As capturas permanecem pendentes nesta entrega.

## Publicação

Importe o repositório em um único projeto Vercel. Crie branches separados no Neon, aplique migrations por conexão direta e configure a pooled no runtime. O [guia de deploy](docs/DEPLOYMENT.md) detalha o domínio .vercel.app, OAuth, CI/CD e validação.

## Limites e próximos passos

Cada clique aceito grava um evento e atualiza uma linha. Requisições ao mesmo slug disputam essa linha. O Neon suspende o compute quando ocioso, conforme o plano. A estimativa de visitantes depende dos cabeçalhos da infraestrutura e de um segredo separado. A janela analítica cobre 90 dias e o contador acumulado permanece enquanto o link existir.

Próximos passos incluem medir planos de consulta com volume representativo e avaliar agregações incrementais se o uso justificar. A [metodologia de carga](docs/BENCHMARKS.md) descreve como coletar resultados.
