-- StudioDesk — diagnóstico somente leitura do cadastro/autenticação.
-- Pode ser executado no SQL Editor sem alterar dados.

select 'trigger_on_auth_user_created' as check_name,
       exists (
         select 1
         from pg_trigger t
         join pg_class c on c.oid = t.tgrelid
         join pg_namespace n on n.oid = c.relnamespace
         where t.tgname = 'on_auth_user_created'
           and n.nspname = 'auth'
           and c.relname = 'users'
           and not t.tgisinternal
       ) as ok;

select 'function_handle_new_user' as check_name,
       to_regprocedure('public.handle_new_user()') is not null as ok;

select 'tables' as check_name,
       to_regclass('public.workspaces') is not null
       and to_regclass('public.workspace_members') is not null
       and to_regclass('public.profiles') is not null as ok;

select 'bucket_studiodesk_files' as check_name,
       exists (select 1 from storage.buckets where id = 'studiodesk-files') as ok;

-- Usuários recentes e confirmação de e-mail. Não mostra senha nem tokens.
select id, email, email_confirmed_at, created_at
from auth.users
order by created_at desc
limit 10;

-- Confere se cada usuário recente recebeu profile e membership.
select
  u.id as user_id,
  u.email,
  p.id is not null as has_profile,
  p.workspace_id,
  wm.user_id is not null as has_membership,
  wm.role
from auth.users u
left join public.profiles p on p.id = u.id
left join public.workspace_members wm on wm.user_id = u.id
order by u.created_at desc
limit 10;
