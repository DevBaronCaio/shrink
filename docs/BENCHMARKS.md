# Medição de desempenho

O teste de integração executa 160 chamadas concorrentes do Route Handler contra PostgreSQL 16 real. A execução local aceitou 100, recusou 60 com 410 e manteve 100 eventos e contador igual a 100. Outro teste força uma falha no INSERT e verifica 503, zero eventos e contador inalterado. Esses testes medem consistência.

## Rodar carga

Crie um link exclusivo de teste sem limite para medir o caminho aceito. Use um link com quota para medir também as recusas.

```bash
k6 run -e OWNED_TARGET=yes \
  -e SHRINK_URL=http://localhost:3000 \
  -e SHRINK_SLUG=link-de-teste \
  -e VUS=5 -e DURATION=30s tests/load/redirect.js
```

Reserve a execução para ambientes próprios e autorizados. O k6 relata média, p50, p95, p99, throughput e taxa de falhas. O script considera 302 e 410 esperados e verifica Cache-Control: no-store. Compare separadamente compute aquecido e suspenso. Registre versão, região, concorrência, data, estado inicial e volume.

Nenhum benchmark k6 foi executado nesta entrega.
