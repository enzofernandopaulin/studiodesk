# StudioDesk — Fase 7: Vercel Serverless Functions

A Fase 7 cria uma camada de API server-side na Vercel para operações que não devem depender do navegador, especialmente quando houver credenciais privadas ou integrações externas.

## Endpoints

- `GET /api/health` — health check sem autenticação.
- `GET /api/me` — valida o Bearer token do Supabase e retorna perfil/membership.
- `POST /api/storage/signed-url` — gera signed URL privada somente para arquivos do workspace do usuário.

## Segurança

O frontend continua usando `VITE_SUPABASE_ANON_KEY`. A `SUPABASE_SERVICE_ROLE_KEY` é usada apenas no runtime server-side da Vercel e nunca deve ser colocada em `VITE_*`.

As funções validam o token Supabase antes de usar privilégios server-side. O endpoint de Storage também confere que o caminho pertence ao workspace do usuário.

## Próxima evolução

As integrações reais (IA, WhatsApp, e-mail, pagamentos e webhooks de terceiros) devem entrar como funções independentes, cada uma com validação de entrada, autenticação/autorização, segredo próprio e tratamento de erros.
