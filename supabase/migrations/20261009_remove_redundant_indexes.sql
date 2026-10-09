-- Remove índices duplicados ou estritamente redundantes.
-- Índices primários, únicos e índices usados como suporte de constraints foram preservados.

DROP INDEX IF EXISTS public.idx_approval_comments_workspace_media;
DROP INDEX IF EXISTS public.idx_project_deliverables_workspace_project;
DROP INDEX IF EXISTS public.media_workspace_project_idx;
DROP INDEX IF EXISTS public.idx_clients_workspace_created_id;
DROP INDEX IF EXISTS public.idx_leads_workspace_created_id;
DROP INDEX IF EXISTS public.idx_projects_workspace_created_id;
DROP INDEX IF EXISTS public.idx_tasks_workspace_created_id;
DROP INDEX IF EXISTS public.timeline_workspace_timestamp_idx;
DROP INDEX IF EXISTS public.idx_calendar_events_workspace_date;
DROP INDEX IF EXISTS public.idx_approval_requests_workspace_created;
DROP INDEX IF EXISTS public.idx_messages_workspace_timestamp;
DROP INDEX IF EXISTS public.idx_communications_workspace_timestamp;
DROP INDEX IF EXISTS public.idx_projects_workspace_created;
DROP INDEX IF EXISTS public.idx_tasks_workspace_created;
DROP INDEX IF EXISTS public.idx_timeline_events_workspace_timestamp;
