# PostgreSQL no Neon

Campos temporais são timestamptz. O vínculo proprietário–link entra nas cláusulas de leitura e alteração. LinkTag usa as tags que o serviço resolve na própria conta. Excluir uma conta remove por cascata associações OAuth, sessões, links, eventos, tags, denúncias vinculadas e chaves. Excluir um link remove eventos, relações com tags e denúncias associadas. Reduzir o limite abaixo do contador existente interrompe futuros acessos.

| Índice                                      | Consulta atendida                       |
| ------------------------------------------- | --------------------------------------- |
| Link.slug único                             | Busca e colisões globais                |
| Link(userId, createdAt DESC, id)            | Listagem recente por conta              |
| Link(userId, clickCount DESC, id)           | Listagem ordenada por cliques           |
| ClickEvent(linkId, createdAt)               | Eventos por link e período              |
| ClickEvent(createdAt)                       | Seleção por janela e retenção           |
| Tag(userId, name)                           | Resolução de tags sem duplicidade       |
| ApiKey.prefix único                         | Busca da chave antes de comparar o hash |
| RateLimitBucket(key, windowAt)              | Incremento por janela                   |
| RateLimitBucket.expiresAt e Session.expires | Remoção de registros vencidos           |

A busca parcial usa o filtro do proprietário e escapa caracteres especiais do LIKE. Um índice trigram só se justificará se a medição mostrar necessidade. A paginação usa offset limitado com desempate por ID e a consulta retorna contagem e página na mesma transação Repeatable Read.

Analytics agrupa por dia no fuso da conta e aplica COUNT(DISTINCT) sobre todo o período. As dimensões e os links mais acessados retornam até dez itens. Referrer e geolocalização indisponíveis são nulos. A comparação fica nula quando a janela anterior está fora da retenção ou o percentual teria divisão por zero. As datas incluem o dia final até o instante da consulta.

O runtime usa o endpoint -pooler com TLS. Migrations usam o endpoint direto, de preferência com sslmode=verify-full. Prisma mantém um pool limitado por instância. Veja [pooling do Neon](https://neon.com/docs/connect/connection-pooling).
