-- StudioDesk: diagnóstico prévio da tabela de leads.
-- Somente leitura: não altera schema, dados ou políticas.
-- Execute no SQL Editor do Supabase antes de aplicar
-- supabase/migrations/20261025_lead_webhook_idempotency.sql.

-- 1) Confirma a existência e os tipos das colunas usadas pelo webhook.
select
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name = 'leads'
order by c.ordinal_position;

-- 2) Confirma se RLS está habilitado e se FORCE RLS está habilitado.
select
  n.nspname as schema_name,
  t.relname as table_name,
  t.relrowsecurity as rls_enabled,
  t.relforcerowsecurity as force_rls
from pg_class t
join pg_namespace n on n.oid = t.relnamespace
where n.nspname = 'public'
  and t.relname = 'leads';

-- 3) Lista todas as políticas atuais da tabela, incluindo permissões permissivas.
-- Revise USING/WITH CHECK: as operações de usuário autenticado devem restringir
-- registros ao workspace do usuário. O webhook usa service_role e não é protegido
-- por estas políticas; por isso o endpoint também fixa LEADS_WEBHOOK_WORKSPACE_ID.
select
  policyname,
  permissive,
  roles,
  cmd,
  qual as using_expression,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'leads'
order by policyname;

-- 4) Confirma a existência do índice de idempotência.
select
  indexname,
  indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'leads'
  and indexname = 'leads_workspace_idempotency_key_uidx';

-- 5) Verifica se já existem chaves duplicadas não nulas antes da migração.
-- O índice parcial não deve falhar por duplicatas.
select workspace_id, idempotency_key, count(*) as duplicate_count
from public.leads
where idempotency_key is not null
group by workspace_id, idempotency_key
having count(*) > 1;
