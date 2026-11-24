# ADR 0001 — Monólito modular Next.js

**Decisão.** App Router serve páginas, ações privadas, REST e redirecionamento. Neon hospeda o estado e Vercel publica a aplicação em um projeto.

**Consequência.** Dashboard e API compartilham regras. Cada instância possui pool limitado e o banco coordena todo estado persistente.
