# ADR 0003 — Agregação SQL e retenção diária

**Decisão.** Guardar eventos por 90 dias, calcular relatórios no PostgreSQL e expurgar eventos com cron Vercel. Preservar o contador acumulado no link.

**Consequência.** O histórico consultável respeita a janela retida e a latência depende do volume de eventos.
