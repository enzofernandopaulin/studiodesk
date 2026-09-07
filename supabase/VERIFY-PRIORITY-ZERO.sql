-- Diagnóstico somente leitura para a migration de Prioridade 0.
-- Execute no SQL Editor depois de 20260907_priority_zero_security.sql.

select 'sync_workspace_removida' as check_name,
       to_regprocedure('public.sync_workspace(jsonb)') is null as ok
union all
select 'bootstrap_transacional_instalado',
       to_regprocedure('public.bootstrap_user_session(uuid,text,text,text)') is not null
union all
select 'remocao_de_membro_instalada',
       to_regprocedure('public.remove_workspace_member(uuid,uuid,text)') is not null
union all
select 'team_members_tem_user_id',
       exists (
         select 1
         from information_schema.columns
         where table_schema = 'public'
           and table_name = 'team_members'
           and column_name = 'user_id'
       )
union all
select 'convites_com_rls',
       coalesce((
         select relrowsecurity
         from pg_class
         where oid = 'public.workspace_invitations'::regclass
       ), false)
union all
select 'convites_sem_acesso_authenticated',
       not has_table_privilege('authenticated', 'public.workspace_invitations', 'select')
       and not has_table_privilege('authenticated', 'public.workspace_invitations', 'insert')
       and not has_table_privilege('authenticated', 'public.workspace_invitations', 'update')
       and not has_table_privilege('authenticated', 'public.workspace_invitations', 'delete')
union all
select 'convites_sem_acesso_anon',
       not has_table_privilege('anon', 'public.workspace_invitations', 'select')
       and not has_table_privilege('anon', 'public.workspace_invitations', 'insert')
       and not has_table_privilege('anon', 'public.workspace_invitations', 'update')
       and not has_table_privilege('anon', 'public.workspace_invitations', 'delete')
union all
select 'sem_link_admin_reutilizavel',
       not exists (
         select 1
         from public.workspace_invitations
         where role = 'admin'
           and accepted_at is null
           and expires_at > now()
       )
order by check_name;
