-- Reduz a superfície de ataque das funções SECURITY DEFINER.
-- Mantém authenticated nas funções usadas pelas políticas RLS.

-- Funções auxiliares usadas por políticas RLS: anon não precisa executá-las.
REVOKE EXECUTE ON FUNCTION public.current_workspace_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.current_workspace_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_manager() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid) FROM anon;

-- Funções internas de trigger/server-side: não são APIs públicas do frontend.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_membership_fields() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_owner_workspace_plan() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_team_directory_from_membership() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_team_directory_from_profile() FROM anon, authenticated;
