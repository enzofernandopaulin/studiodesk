# Fase 6 — arquivos e avatares

Arquivos de até 6 MB usam upload simples. Acima disso, o navegador usa o protocolo TUS em blocos de 6 MB, permitindo uploads grandes sem passar por uma função da Vercel. Referências `storage://` agora aceitam somente o bucket privado esperado e rejeitam caminhos inválidos.

Ao trocar uma mídia, o objeto anterior é removido após a atualização do banco. O avatar passa a ser salvo também em `profiles.avatar`, tornando-o visível no diretório da equipe. O bucket de avatar permanece público por decisão de produto; escrita e substituição continuam limitadas ao próprio usuário.
