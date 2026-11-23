## Revisão final de segurança e dados — 23/11/2026

A auditoria do schema confirmou que `tasks` possui `project_id`, mas não possui `column_id`, status de Kanban ou posição. O Portal não distribui tarefas por colunas artificialmente: destaca somente a etapa atual do projeto e apresenta as tarefas em uma lista neutra. `tasks.completed_at` existe e continua sendo consultado para o estado de conclusão.

A sessão retorna apenas indicadores `has_file`, `has_video` e `has_thumbnail`, nunca URLs de Storage. Arquivos de aprovação são entregues apenas por endpoint autorizado, com validação da sessão, do projeto e do cliente; referências `storage://` são assinadas pelo Supabase e URLs HTTPS diretas só são aceitas no host Supabase configurado.

O acesso do cliente não exige IDs técnicos: o administrador gera um link individual por projeto, assinado com HMAC server-side, e um código aleatório. O código é armazenado somente como hash Argon2id em `client_project_access.password_hash` e é exibido uma única vez na resposta de provisionamento. A chave HMAC usa `PORTAL_ACCESS_SECRET` ou, em ambiente já configurado, `SUPABASE_SERVICE_ROLE_KEY`; o segredo nunca vai para o frontend.

O logout exige CSRF. A sessão e todas as consultas são vinculadas a workspace, projeto e cliente. A consulta de aprovações também filtra `client_id`. Ações de aprovação passam exclusivamente pela RPC transacional proposta, que bloqueia estados finais e insere comentário na mesma transação. Enquanto a RPC não existir, a API retorna erro 503 explícito e não executa mutações parciais.

O limitador local continua reduzindo abuso na instância, mas a API não ignora falhas do rate limit distribuído: sem a RPC, ou diante de erro operacional, o login retorna 503 claramente. A proteção entre instâncias depende da aprovação e execução de `supabase/PROPOSTA-MIGRATION-PORTAL-ATOMICIDADE.sql` (ou da migration de rate limit equivalente, sem executar as duas duplicadamente).

Nenhuma migration, commit ou deploy foi executado nesta rodada. `npm run lint`, `npm run build` e `git diff --check` passaram. O isolamento real entre dois clientes/projetos ainda requer teste manual com registros reais em `client_project_access`, sem criar dados artificiais.
