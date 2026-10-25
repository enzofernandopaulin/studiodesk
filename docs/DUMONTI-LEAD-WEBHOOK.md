# Integração Dumonti → StudioDesk

## Fluxo

O navegador envia o formulário apenas para `https://dumonti-lime.vercel.app/api/lead`. A Function server-side da Dumonti cria o JSON, assina `timestamp + "." + body` com HMAC-SHA256 e chama `POST /api/webhooks/leads` no StudioDesk. O navegador nunca recebe o segredo, o workspace UUID ou a service role key.

## Variáveis server-side

No StudioDesk, configurar em Preview e Production:

```text
LEADS_WEBHOOK_SECRET=<mesmo segredo salvo na Vercel da Dumonti>
LEADS_WEBHOOK_WORKSPACE_ID=<UUID real do workspace Dumonti>
UPSTASH_REDIS_REST_URL=<URL Redis REST>
UPSTASH_REDIS_REST_TOKEN=<token Redis REST>
```

Manter as variáveis Supabase já existentes. Não usar essas chaves em `VITE_*` ou no frontend.

## Payload aceito

```json
{
  "workspaceId": "UUID",
  "idempotencyKey": "dumonti-form-UUID",
  "name": "Carlos Eduardo",
  "company": "Restaurante Terraço",
  "email": "contato@empresa.com",
  "phone": "",
  "whatsapp": "+5513999999999",
  "serviceInterest": "Vídeo Institucional & Produção",
  "source": "Site Institucional (Formulário)",
  "notes": "Mensagem opcional"
}
```

Headers obrigatórios:

```text
Content-Type: application/json
X-StudioDesk-Webhook-Timestamp: Unix timestamp em segundos
X-StudioDesk-Webhook-Signature: hex(HMAC-SHA256(secret, timestamp + "." + rawBody))
```

O endpoint aceita temporariamente a origem antiga `Site Institucional` e a normaliza para `Site Institucional (Formulário)` para não quebrar a versão atual da Dumonti durante a migração.

## Respostas

- `201`: lead criado.
- `200`: reenvio reconhecido pela `idempotencyKey`.
- `400`: payload inválido.
- `401`: assinatura ou timestamp inválido.
- `403`: workspace diferente do configurado.
- `404`: workspace inexistente.
- `413`: payload maior que 64 KiB.
- `429`: limite excedido.
- `503`: configuração do webhook, Supabase ou Redis ausente.

## Ativação

1. Aplicar `supabase/LEADS-WEBHOOK-IDEMPOTENCIA.sql` em staging.
2. Confirmar que a tabela `public.leads` já contém a coluna `idempotency_key` e o índice único.
3. Configurar as variáveis server-side.
4. Executar `npm run lint` e `npm run build`.
5. Testar novo lead, duplicata, assinatura inválida, timestamp vencido, workspace incorreto, rate limit e falha do banco.
6. Só depois aplicar em produção.
