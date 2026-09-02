# StudioDesk — Fase 9

## Integrações Serverless

Endpoints adicionados:

- `POST /api/ai/generate` — Gemini (`GEMINI_API_KEY`).
- `POST /api/integrations/whatsapp/send` — Evolution API (`EVOLUTION_API_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE`).
- `POST /api/integrations/email/send` — Resend (`RESEND_API_KEY`, `EMAIL_FROM`).
- `POST /api/webhooks/leads` — entrada de leads com `LEADS_WEBHOOK_SECRET`.

As integrações são opcionais e as credenciais ficam somente no servidor. Sem configuração, as APIs retornam `503` de forma controlada.

### Webhook de leads

O webhook recebe `workspaceId` e `name` no JSON. O segredo deve ser enviado por `X-StudioDesk-Webhook-Secret`. Para ferramentas que não suportam headers, `token` na query string também é aceito.

```json
{
  "workspaceId": "uuid-do-workspace",
  "name": "Maria Silva",
  "email": "maria@example.com",
  "company": "Empresa Exemplo",
  "serviceInterest": "Vídeo institucional",
  "source": "Site Institucional"
}
```


## Correção pós-ativação local

A chave do frontend usa `VITE_SUPABASE_PUBLISHABLE_KEY`, compatível com as novas API keys do Supabase. O app local roda na porta `3000`, portanto `APP_URL` deve ser `http://localhost:3000` durante o desenvolvimento.
