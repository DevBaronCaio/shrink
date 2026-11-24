# Publicação em um projeto Vercel

A instância entregue usa [shrink-iota.vercel.app](https://shrink-iota.vercel.app). A primeira publicação foi feita pelo CLI no projeto Shrink. O banco dedicado já tem migrations aplicadas em main, preview e development. Em produção, os provedores OAuth precisam dos quatro valores descritos na seção 4.

## 1. Neon

Crie um projeto PostgreSQL 16 em AWS US East (N. Virginia) para alinhar com a região Vercel iad1 em vercel.json. Use o branch principal para produção e branches sem dados de produção para preview e desenvolvimento. No diálogo **Connect** do branch, copie a string com **connection pooling** para o runtime e a direta para migrations. Use TLS para ambas.

## 2. Importação

Na Vercel, use **Add New → Project**, selecione o repositório GitHub e escolha Next.js na raiz. Use Node.js 22.x e pnpm com o lockfile versionado. O script de build gera o cliente Prisma e executa o Next.js. Configure a branch main como produção. As demais branches podem gerar previews no mesmo projeto.

No primeiro deploy use o domínio padrão atribuído. Se o projeto já existe, vincule sua conta GitHub em **Account Settings → Authentication** na Vercel, conceda acesso ao repositório privado no app Vercel do GitHub e execute vercel link --project shrink seguido de vercel git connect. [Integração GitHub + Vercel](https://vercel.com/docs/git/vercel-for-github).

## 3. Ambiente

- Defina DATABASE_URL com o branch pooled de cada ambiente. Mantenha DIRECT_URL no shell de migrations.
- Gere AUTH_SECRET e CRON_SECRET com openssl rand -hex 32. Use segredos diferentes por finalidade e ambiente. Defina um ANALYTICS_HASH_SECRET independente se quiser habilitar estimativas de visitantes.
- Em produção, defina NEXT_PUBLIC_APP_URL e NEXTAUTH_URL para a URL canônica .vercel.app.
- Para preview, a Vercel fornece a origem por deploy. Para OAuth, use um alias de branch estável, apps OAuth separados e NEXTAUTH_URL apontando para o alias escolhido.
- Consulte .env.example para a lista e as configurações opcionais.

## 4. OAuth

No GitHub, acesse **Developer settings → OAuth Apps → New OAuth App**. Configure Homepage URL com a base da instância e Authorization callback URL conforme a tabela. Gere um client secret. Use um OAuth App por ambiente quando houver callbacks distintos.

No Google Cloud, configure **Google Auth Platform**. Crie um cliente OAuth **Web application**, cadastre os endpoints como **Authorized redirect URIs** e adicione testadores se o consent screen estiver em modo de teste.

| Ambiente        | GitHub                                                  | Google                                                  |
| --------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| Desenvolvimento | http://localhost:3000/api/auth/callback/github          | http://localhost:3000/api/auth/callback/google          |
| Produção        | https://shrink-iota.vercel.app/api/auth/callback/github | https://shrink-iota.vercel.app/api/auth/callback/google |
| Preview         | https://SEU-PREVIEW.vercel.app/api/auth/callback/github | https://SEU-PREVIEW.vercel.app/api/auth/callback/google |

Inclua AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, AUTH_GOOGLE_ID e AUTH_GOOGLE_SECRET nos ambientes corretos. Gere novo deploy quando esses valores mudarem. [OAuth Apps no GitHub](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) · [OAuth web no Google](https://developers.google.com/identity/protocols/oauth2/web-server).

## 5. Migrations e publicação

Execute pnpm install --frozen-lockfile. Disponibilize DIRECT_URL no seu shell seguro. Execute pnpm db:deploy primeiro em preview e, após validar, em produção antes do deploy dependente do schema. Para mudanças incompatíveis, prefira expandir o schema e remover estruturas só depois de migrar os consumidores.

Publique por push para main com Git integrado ou execute vercel deploy --prod no projeto vinculado. A produção usa a agenda de vercel.json e CRON_SECRET. Vercel Hobby executa o cron diário com uma janela de imprecisão. Seeds são executados manualmente e apenas em desenvolvimento local. [Limites do cron](https://vercel.com/docs/schedules/cron-jobs/usage-and-pricing).

## 6. Validação de produção

1. Confira GET /api/health com HTTP 200 e status ok. Consulte /demo, /docs e /api/v1/openapi.
2. Faça login com cada provedor instalado. Crie um link, acesse /r/slug e confira o registro em Analytics.
3. Crie uma API Key READ, chame a API, revogue a chave e confirme 401. Confira exportação CSV e QR Code.
4. Em preview, repita a consulta de um link com outra conta e execute a suíte de concorrência em um banco descartável.
5. Consulte os logs da Vercel, a execução do cron e o consumo do Neon.

## CI e cotas

Em **Settings → Rules → Rulesets** do GitHub, crie uma regra para main que exija pull requests e o check **Qualidade e build**, junto do preview Vercel quando aplicável. No GitHub Free, rulesets para repositórios privados dependem de plano compatível. Playwright tem um workflow manual que usa PostgreSQL temporário. [Regras do GitHub](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets).

Vercel Hobby tem cotas de execução e transferência. Neon Free tem cotas de compute e armazenamento e pode suspender compute ocioso. Planeje carga e compare latências de compute frio e quente. [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Planos Neon](https://neon.com/pricing).
