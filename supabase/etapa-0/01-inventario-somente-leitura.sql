-- ETAPA 0: executar sozinho no SQL Editor. Somente metadados, sem dados de clientes.
-- Copie o JSON resultante para armazenamento privado; não publique no GitHub.
begin transaction read only;
set local statement_timeout = '30s';
select jsonb_build_object(
  'collected_at', now(),
  'tables', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select n.nspname as schema, c.relname as name, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'storage') and c.relkind in ('r','p') order by 1,2
  ) t), '[]'::jsonb),
  'columns', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select table_name, column_name, data_type, is_nullable from information_schema.columns
    where table_schema = 'public' order by table_name, ordinal_position
  ) t), '[]'::jsonb),
  'policies', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
    from pg_policies where schemaname in ('public','storage') order by schemaname,tablename,policyname
  ) t), '[]'::jsonb),
  'functions', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select p.oid::regprocedure::text as signature, p.prosecdef as security_definer,
      p.proconfig as settings, p.proacl::text as explicit_acl,
      has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
      has_function_privilege('service_role', p.oid, 'EXECUTE') as service_execute
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' order by 1
  ) t), '[]'::jsonb),
  'table_grants', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select table_schema, table_name, grantee, privilege_type from information_schema.table_privileges
    where table_schema in ('public','storage') and grantee in ('anon','authenticated','service_role','PUBLIC') order by 1,2,3,4
  ) t), '[]'::jsonb),
  'constraints', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select c.conrelid::regclass::text as relation, c.conname as name, c.contype as type, c.convalidated as validated, pg_get_constraintdef(c.oid) as definition
    from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public' order by 1,2
  ) t), '[]'::jsonb),
  'indexes', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select tablename, indexname, indexdef from pg_indexes where schemaname='public' order by 1,2
  ) t), '[]'::jsonb),
  'triggers', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select c.oid::regclass::text as relation, t.tgname as name, t.tgenabled as enabled, t.tgfoid::regprocedure::text as function
    from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace
    where not t.tgisinternal and n.nspname in ('public','auth') order by 1,2
  ) t), '[]'::jsonb),
  'realtime', coalesce((select jsonb_agg(to_jsonb(t)) from (
    select pubname, schemaname, tablename from pg_publication_tables where pubname='supabase_realtime' order by 2,3
  ) t), '[]'::jsonb),
  'migration_history_present', to_regclass('supabase_migrations.schema_migrations') is not null
) as inventario;
rollback;
