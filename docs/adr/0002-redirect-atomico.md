# ADR 0002 — Contador e evento na mesma instrução

**Decisão.** Atualizar o contador somente se a admissão estiver autorizada e inserir o evento na mesma CTE. Erros de persistência retornam 503.

**Consequência.** A cota é consistente sob concorrência. Tráfego concentrado disputa a mesma linha.
