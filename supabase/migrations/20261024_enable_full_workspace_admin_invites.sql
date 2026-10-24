begin;

-- Permite convites com papel admin. A regra antiga
-- workspace_invitations_link_role_check aceitava somente gestor/colaborador.
alter table public.workspace_invitations
  drop constraint if exists workspace_invitations_link_role_check;

alter table public.workspace_invitations
  drop constraint if exists workspace_invitations_role_check;

alter table public.workspace_invitations
  add constraint workspace_invitations_role_check
  check (role in ('admin', 'gestor', 'colaborador'));

-- O membro convidado como admin passa a ser administrador real do workspace.
-- A função existente já grava invitation.role em workspace_members.role.
-- Recriamos somente a política de leitura de perfis para que o admin consiga
-- visualizar os dados cadastrais da equipe do workspace ativo, sem acesso a
-- perfis de outros workspaces.
drop policy if exists workspace_admin_profiles_read on public.profiles;
create policy workspace_admin_profiles_read
  on public.profiles
  for select
  to authenticated
  using (
    workspace_id = public.current_workspace_id()
    and public.has_workspace_role(workspace_id, array['admin'])
  );

-- Mantém o proprietário como referência do workspace e impede que o convite
-- admin seja usado para atravessar workspaces.
comment on constraint workspace_invitations_role_check on public.workspace_invitations
  is 'Convites podem conceder colaborador, gestor ou administrador somente no workspace do convite';

commit;
