-- O EXECUTE padrão é concedido a PUBLIC; revogá-lo é necessário
-- para que o privilégio mínimo seja efetivo.

-- Funções auxiliares usadas pelas políticas RLS: somente authenticated.
REVOKE EXECUTE ON FUNCTION public.current_workspace_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_workspace_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_manager() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_workspace_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_workspace_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_manager() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

-- Funções internas de trigger/server-side: nenhum papel de API pública.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_membership_fields() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_owner_workspace_plan() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_team_directory_from_membership() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_team_directory_from_profile() FROM PUBLIC, anon, authenticated;
