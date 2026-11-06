-- ETAPA 0: executar depois de 01, sozinho. false = investigar; true NÃO certifica segurança.
begin transaction read only;
set local statement_timeout = '30s';
with expected(name) as (values
 ('workspaces'),('workspace_members'),('workspace_invitations'),('profiles'),
 ('leads'),('clients'),('kanban_columns'),('projects'),('project_deliverables'),
 ('media_approvals'),('approval_comments'),('approval_requests'),('calendar_events'),
 ('tasks'),('messages'),('communications'),('timeline_events'),('team_members'),('integrations')
), functions(signature) as (values
 ('public.bootstrap_user_session(uuid,text,text,text)'),
 ('public.accept_workspace_invitation(text,uuid,text,text)'),
 ('public.remove_workspace_member(uuid,uuid,text)'),
 ('public.create_workspace_for_user(uuid,text)'),
 ('public.complete_studiodesk_onboarding(text,text,text,text,text,jsonb,text,jsonb)'),
 ('public.convert_lead_to_client(text,jsonb,jsonb,jsonb)')
)
select 'table_exists:' || name as check_name, to_regclass('public.' || name) is not null as ok from expected
union all
select 'rls_enabled:' || e.name, coalesce(c.relrowsecurity,false)
from expected e left join pg_class c on c.oid=to_regclass('public.' || e.name)
union all
select 'function_exists:' || signature, to_regprocedure(signature) is not null from functions
union all
select 'legacy_sync_absent', to_regprocedure('public.sync_workspace(jsonb)') is null
order by check_name;
-- Storage separado: somente configurações dos buckets, nunca nomes de objetos.
select id, public, file_size_limit, allowed_mime_types
from storage.buckets where id in ('studiodesk-files','studiodesk-avatars') order by id;
rollback;
