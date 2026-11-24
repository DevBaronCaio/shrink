# Case técnico do Shrink

**Problema.** Links de divulgação precisam ser curtos, editáveis e mensuráveis. Alterar o destino exige preservar o endereço compartilhado e o histórico. Limitar acessos exige uma regra que permaneça válida em concorrência.

**Arquitetura.** Uma aplicação Next.js e um PostgreSQL cobrem o fluxo. Dashboard e API compartilham regras de validação e propriedade. Landing, documentação e demonstração funcionam sem conta.

**Concorrência.** O redirecionamento usa o índice único do slug e um UPDATE condicional com INSERT dependente. A unidade de trabalho é a instrução SQL. O teste de integração com 160 chamadas no mesmo link aceitou 100, gravou 100 eventos e recusou 60. Uma falha forçada de INSERT deixou o contador zerado.

**Analytics.** PostgreSQL agrupa eventos no fuso da conta, resolve o período anterior e deduplica hashes no período inteiro. CSV leva agregados. Contador acumulado e histórico filtrável têm janelas diferentes por causa da retenção.

**Segurança.** Filtros por proprietário protegem recursos privados. Chaves usam hash e escopos. Um HMAC opcional minimiza dados de rede e dificulta correlação entre contas. A moderação exige o ID imutável de um provedor OAuth.

**Consultas.** Índices compostos seguem caminhos de leitura e ordenação. SQL sumariza séries e rankings antes de enviar dados à interface. O runtime usa pooling do Neon. A garantia de cota concentra contenção nos slugs mais ativos.

**Evidências.** Os testes locais exercitam rollback, limite por clique e por requisição, moderação, isolamento, deduplicação, exportação, retenção e revogação. Consulte [metodologia de carga](BENCHMARKS.md).

**Trade-offs.** Sessões persistidas facilitam revogação e exclusão. Cada acesso aceito depende do banco e retorna 503 diante de erro. A estimativa de visitantes pode perder precisão devido a NAT e rotação de chave. Fixtures públicas mostram fluxos de leitura sem alterar contas reais.
