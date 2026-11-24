# Segurança e privacidade

- Sessões Auth.js persistidas com cookies HttpOnly, SameSite Lax e Secure em HTTPS. OAuth tem proteção CSRF no Auth.js. Server Actions usam a verificação de origem do Next.js e exigem sessão quando privadas. Dois provedores com o mesmo e-mail não são vinculados automaticamente.
- Cadastro público exige senha de pelo menos 12 caracteres. Senhas são armazenadas com scrypt e salt aleatório; tentativas de cadastro e login são limitadas por rede e por e-mail usando buckets atômicos no PostgreSQL. Contas não são verificadas por e-mail porque o produto não depende de um serviço de envio; acesso ao endereço não é comprovado.
- A aplicação guarda associações OAuth por provedor e ID remoto. Omite tokens de acesso e atualização persistentes. Avatares são carregados pelo navegador.
- Os serviços escopam leituras e mutações por proprietário. Chaves usam um segredo aleatório de 256 bits, SHA-256 e comparação em tempo constante. Último uso tem granularidade de até um minuto.
- Destinos aceitam HTTP(S), sem credenciais embutidas, hosts locais, IPs não públicos, domínio próprio ou entradas de BLOCKED_DOMAINS. A validação é sintática e o servidor não consulta destinos. Mudanças de DNS, redirecionamentos de terceiros e reputação de conteúdo ficam fora do controle.
- Denúncias são limitadas por rede. Moderação exige identidade OAuth imutável em MODERATOR_IDENTITIES, por exemplo github:12345. O estado de moderação é independente da ativação pelo proprietário.
- CSP com nonce protege scripts. Cabeçalhos restringem framing e permissões. Estilos em linha atendem componentes dinâmicos. O CSV neutraliza os prefixos de fórmulas.
- Logs usam operação, código, tempo e ID de requisição. Credenciais ficam fora do Git.

## Dados e retenção

Cada evento guarda horário, identificador do link, dispositivo, navegador, sistema operacional, país/região da Vercel quando disponíveis, classificação estimada de bot e hostname do referrer. A ausência de referrer pode indicar omissão pelo navegador ou entrada direta.

Com ANALYTICS_HASH_SECRET, o Shrink aplica HMAC a dados de rede de cabeçalho confiável da Vercel. Combina o resultado com o ID da conta antes de persistir, deduplicando entre links da mesma conta. A chave derivada rotaciona a cada 90 dias. IP bruto, user-agent integral e fingerprints não são persistidos. Trate o hash como dado pseudonimizado. Uma rede compartilhada pode representar várias pessoas, e uma mudança de rede ou de época pode aumentar a estimativa. Sem cabeçalho ou segredo válidos, a estimativa é nula.

O rate limiting deriva outro HMAC com contexto diário. A rotina diária remove eventos com mais de 90 dias, sessões e janelas expiradas e denúncias com mais de 180 dias. A contagem acumulada sobrevive à remoção dos eventos. A janela de restauração do Neon depende do plano.

A política pública fica em /privacidade. Use /denunciar para denunciar destinos, e as configurações para exportação ou exclusão de conta. A instância deve divulgar seu canal de contato de privacidade.
