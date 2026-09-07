-- StudioDesk — diagnóstico somente leitura da arquitetura de equipe.
-- Pode ser executado a qualquer momento. Não altera nenhuma tabela.

-- 1. Deve retornar zero nas três colunas.
select
  count(*) filter (where p.id is null) as usuarios_sem_perfil,
  count(*) filter (where wm.user_id is null) as perfis_ativos_sem_membership,
  count(*) filter (where tm.id is null) as memberships_sem_diretorio
from auth.users u
left join public.profiles p on p.id = u.id
left join public.workspace_members wm
  on wm.user_id = u.id and wm.workspace_id = p.workspace_id
left join public.team_members tm
  on tm.workspace_id = wm.workspace_id and tm.id = 'tm_' || wm.user_id::text;

-- 2. Deve retornar zero linhas. Detecta equipes acima do limite do plano.
select
  w.id,
  w.name,
  w.plan,
  count(wm.user_id) as membros,
  case w.plan
    when 'studio' then 10
    when 'empresa' then 25
    when 'agencia' then 50
    else 1
  end as limite
from public.workspaces w
left join public.workspace_members wm on wm.workspace_id = w.id
group by w.id, w.name, w.plan
having count(wm.user_id) > case w.plan
  when 'studio' then 10
  when 'empresa' then 25
  when 'agencia' then 50
  else 1
end;

-- 3. Inventário para conferência manual: uma linha por workspace.
select
  w.id,
  w.name,
  w.plan,
  count(wm.user_id) as membros_ativos,
  count(tm.id) as cartoes_no_diretorio
from public.workspaces w
left join public.workspace_members wm on wm.workspace_id = w.id
left join public.team_members tm
  on tm.workspace_id = wm.workspace_id and tm.id = 'tm_' || wm.user_id::text
group by w.id, w.name, w.plan
order by w.created_at;
