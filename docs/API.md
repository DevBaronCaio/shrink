# API REST v1

A referência em /docs usa o contrato OpenAPI 3.1 em GET /api/v1/openapi. Gere uma chave no dashboard e envie Authorization: Bearer seguido da chave completa. Leitura de links e relatórios requer READ. Escrita requer WRITE.

| Método | Caminho                     | Resposta                     |
| ------ | --------------------------- | ---------------------------- |
| POST   | /api/v1/links               | 201 com Location             |
| GET    | /api/v1/links               | 200 com meta paginada        |
| GET    | /api/v1/links/:id           | 200                          |
| PATCH  | /api/v1/links/:id           | 200                          |
| DELETE | /api/v1/links/:id           | 204 sem corpo                |
| GET    | /api/v1/links/:id/analytics | 200                          |
| GET    | /api/v1/analytics           | 200                          |
| GET    | /api/health                 | 200 ou 503, sem autenticação |

O sucesso em JSON retorna data e, na listagem, meta com página, limite, total e páginas. Falhas retornam error.code, error.message e requestId. Campos inválidos podem retornar error.details com caminhos e códigos da validação.

As janelas fixas permitem 120 requisições por chave por minuto e 600 por rede por minuto. Criação permite 30 por conta por hora, compartilhadas entre API e dashboard. No 429, Retry-After indica quantos segundos esperar. X-RateLimit-Limit, X-RateLimit-Remaining e X-RateLimit-Reset descrevem a janela. X-Request-Id correlaciona a resposta aos logs.

Analytics usa o fuso da conta. period aceita today, 7d, 30d, 90d e custom. Para custom, envie from e to em YYYY-MM-DD. traffic aceita all, non-bot e bot. A classificação de bots é estimada.

```bash
curl "$SHRINK_URL/api/v1/links?page=1&limit=20" \
  -H "Authorization: Bearer $SHRINK_KEY"
```
