-- StudioDesk: idempotência do webhook de leads Dumonti.
-- Aplicar primeiro em staging, após backup, e validar duplicidades existentes.

alter table public.leads
  add column if not exists idempotency_key text;

create unique index if not exists leads_workspace_idempotency_key_uidx
  on public.leads (workspace_id, idempotency_key)
  where idempotency_key is not null;

comment on column public.leads.idempotency_key is
  'Chave de idempotência de integrações externas confiáveis.';
