# StudioDesk — Fase 8: segurança avançada

A Fase 8 endurece a camada Serverless sem introduzir dependências externas desnecessárias.

## Implementado

- Headers de segurança na Vercel: HSTS, X-Frame-Options, nosniff, Referrer-Policy e Permissions-Policy.
- Respostas JSON sem cache.
- Validação de tamanho de payload para APIs JSON (64 KB).
- Validação estrita de caminhos do Storage e bloqueio de traversal (`.`/`..`).
- Verificação de `Origin` para operações de escrita quando `APP_URL` está configurado.
- Rate limit best-effort por IP e rota, adequado apenas como primeira barreira; limites persistentes devem usar uma camada compartilhada quando houver necessidade de escala.
- Erros internos não são expostos ao cliente; detalhes ficam somente no log do servidor.
- `/api/me` diferencia falhas de autenticação de falhas internas.
- Assinatura HMAC em utilitário reutilizável para futuros webhooks.
- Nenhuma chave `service_role` ou segredo foi colocado no bundle do frontend.

## Variáveis novas

`APP_URL` deve conter a origem oficial da aplicação, por exemplo `https://seu-dominio.vercel.app`.

`WEBHOOK_SECRET` permanece reservado para a fase de integrações. Não é necessário configurá-lo agora.

## Observação sobre rate limiting

O limitador atual é por instância da função. Em Serverless, instâncias podem ser múltiplas; portanto ele não substitui um rate limiter distribuído. A escolha foi intencional para evitar uma nova infraestrutura paga nesta fase.
