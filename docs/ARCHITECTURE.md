# Arquitetura

O Shrink é um monólito modular Next.js App Router. Páginas de marketing, OAuth, dashboard, redirecionamento e REST são executados no mesmo projeto Vercel. PostgreSQL hospeda o estado operacional.

| Camada      | Responsabilidade                                              |
| ----------- | ------------------------------------------------------------- |
| App Router  | SEO público, páginas, Server Actions e Route Handlers         |
| Domínios    | Validação, autorização e regras de negócio                    |
| Prisma      | Consultas tipadas, transações, migrations e SQL parametrizado |
| Componentes | Formulários, filtros na URL, tabela e visualizações           |

Server Components acessam diretamente os serviços internos. Server Actions validam a sessão no servidor. A API usa chaves Bearer e os mesmos serviços. O dashboard e as respostas autenticadas usam cache privado desabilitado. Recharts e Scalar são carregados sob demanda.

Em GET /r/[slug], a CTE roda no PostgreSQL sob Read Committed. O UPDATE usa o índice único e verifica status, validade e cota. Requisições concorrentes aguardam o bloqueio e reavaliam a condição sobre a versão atual da linha. A CTE insere o evento apenas para o link atualizado. O PostgreSQL desfaz as duas mudanças em caso de falha. Uma consulta mínima depois da recusa distingue 404, 410 e mudanças de estado transitórias. O 302 é emitido após a persistência.

Auth.js 4 estável fornece OAuth e sessões. Prisma 7 usa @prisma/adapter-pg para conectar ao PgBouncer e reproduzir a mesma semântica no PostgreSQL local. @vercel/functions ajuda a liberar conexões inativas no Fluid Compute. Bibliotecas de QR, parsing de User-Agent, tabelas e gráficos atendem funções específicas. O dashboard carrega dados no servidor e usa estado local para formulários e interações.

A retenção roda em uma chamada autenticada ao Route Handler pelo cron da Vercel. Logs nativos recebem operação, duração, status e ID de requisição. O health check consulta SELECT 1 e informa a disponibilidade. A demonstração pública usa fixtures determinísticas e independe de sessão e banco.
