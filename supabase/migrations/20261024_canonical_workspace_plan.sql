begin;

-- O workspace é a fonte canônica da capacidade e do plano contratado.
-- Corrige apenas divergências existentes; não altera workspaces nem cria dados.
update public.profiles p
set plan = w.plan,
    updated_at = now()
from public.workspaces w
where p.workspace_id = w.id
  and w.plan in ('individual', 'solo', 'studio', 'empresa', 'agencia')
  and p.plan is distinct from w.plan;

commit;
