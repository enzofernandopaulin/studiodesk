# Integração Dumonti → StudioDesk

## Estado e objetivo

A integração encaminha o formulário público da Dumonti para o CRM do StudioDesk usando duas funções server-side. O navegador nunca deve receber o segredo HMAC, o UUID do workspace nem a chave service role do Supabase.

**Atenção:** a configuração de produção só está completa quando todas as variáveis abaixo estiverem preenchidas nos projetos corretos e os testes de ponta a ponta forem aprovados. Não colocar valores fictícios nem chaves em variáveis `VITE_*`.

## Fluxo

1. O navegador envia o formulário para `POST /api/lead` na própria origem da Dumonti.
2. A função da Dumonti valida os campos, consentimento, honeypot, origem e limite de requisições.
3. A função cria o JSON e assina `timestamp + "." + body` com HMAC-SHA256.
4. A função envia o payload para `POST /api/webhooks/leads` do StudioDesk.
5. O StudioDesk valida a assinatura e o timestamp, exige o workspace configurado e grava o lead com chave de idempotência.

## Variáveis server-side da Dumonti (Vercel)

Configurar em Preview e Production, com valores reais:

```text
LEADS_WEBHOOK_SECRET=<segredo aleatório longo compartilhado com StudioDesk>
LEADS_WEBHOOK_WORKSPACE_ID=<UUID do workspace Dumonti autorizado no StudioDesk>
STUDIODESK_WEBHOOK_URL=<URL HTTPS completa do endpoint /api/webhooks/leads>
UPSTASH_REDIS_REST_URL=<URL REST do Redis/Upstash>
UPSTASH_REDIS_REST_TOKEN=<token REST do Redis/Upstash>
DUMONTI_ALLOWED_ORIGINS=<origens exatas autorizadas, separadas por vírgula>
```

`LEADS_WEBHOOK_SECRET` deve ter pelo menos 32 caracteres aleatórios. Use exatamente o mesmo segredo nos dois projetos. Não compartilhe o valor por commits, tickets, logs ou mensagens. `STUDIODESK_WEBHOOK_URL` precisa apontar para o deployment ativo do StudioDesk e usar HTTPS em produção.

## Variáveis server-side do StudioDesk (Vercel)

Manter as variáveis Supabase server-side existentes e configurar:

```text
LEADS_WEBHOOK_SECRET=<mesmo segredo aleatório configurado na Dumonti>
LEADS_WEBHOOK_WORKSPACE_ID=<mesmo UUID autorizado>
UPSTASH_REDIS_REST_URL=<mesma instância Redis/Upstash, se compartilhada>
UPSTASH_REDIS_REST_TOKEN=<token REST correspondente>
```

O StudioDesk precisa ter `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` apenas no ambiente server-side. Nunca expor a service role key ao frontend. Se os dois projetos usarem ambientes separados, confirme que cada Preview aponta para o endpoint e workspace de teste correspondentes.

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
  "source": "Site Institucional",
  "notes": "Mensagem opcional"
}
```

Headers obrigatórios:

```text
Content-Type: application/json
X-StudioDesk-Webhook-Timestamp: timestamp Unix em segundos
X-StudioDesk-Webhook-Signature: hex(HMAC-SHA256(secret, timestamp + "." + rawBody))
```

O endpoint normaliza a origem antiga `Site Institucional` para `Site Institucional (Formulário)`.

## Migração SQL

A migração desta branch está em:

`supabase/migrations/20261025_lead_webhook_idempotency.sql`

Antes de aplicar em staging:
1. Fazer backup apropriado.
2. Conferir se a tabela `public.leads` possui as colunas esperadas pelo handler (`workspace_id`, `idempotency_key`, `name`, `company`, `email`, `phone`, `whatsapp`, `source`, `service_interest`, `assigned_to`, `notes`, `status`, `value`, `created_at`).
3. Verificar as políticas RLS atuais e o isolamento entre workspaces. Alterações em `supabase/schema.sql` não são aplicadas automaticamente ao banco existente.
4. Aplicar a migração somente em staging e verificar a coluna e o índice único parcial `leads_workspace_idempotency_key_uidx).
5. Repetir em produção apenas depois da aprovação dos testes.

## Testes necessários antes de produção

- `npm run lint` e `npm run build` no StudioDesk.
- `npm run check`, `npm run typecheck` e `npm test` na Dumonti.
- Envio de lead válido com confirmação de gravação no workspace correto.
- Reenvio com a mesma chave: não deve criar outro lead.
- Assinatura incorreta e timestamp expirado: rejeitados.
- Workspace diferente do configurado: rejeitado.
- Limite de requisições e indisponibilidade do Redis: comportamento seguro.
- Falha de banco e payload inválido: resposta sem dados sensíveis.
- Testes de RLS com usuários de dois workspaces distintos.

## Respostas do webhook StudioDesk

- `201`: lead criado.
- `200`: duplicata reconhecida pela chave de idempotência.
- `400`: payload inválido.
- `401`: assinatura ou timestamp inválido.
- `403`: workspace diferente do configurado.
- `404`: workspace inexistente.
- `413`: payload maior que 64 KiB.
- `429`: limite excedido.
- `503`: configuração necessária ausente ou serviço de rate limit indisponível.

**Não considerar a integração pronta para produção até que as variáveis reais estejam configuradas e os testes ponta a ponta sejam aprovados.**
