# StudioDesk — Fase 2: Banco Relacional

A Fase 2 substitui o armazenamento do domínio inteiro em `workspace_states.state` por um modelo relacional no Supabase.

## O que mudou

- `workspaces` e `workspace_members` para isolamento multi-tenant.
- `profiles` vinculado ao workspace.
- CRM: `leads`, `clients`.
- Projetos: `projects`, `kanban_columns`, `project_deliverables`.
- Aprovações: `approval_requests`, `media_approvals`, `approval_comments`.
- Operação: `tasks`, `calendar_events`.
- Comunicação: `messages`, `communications`.
- Auditoria: `timeline_events`.
- Equipe e integrações: `team_members`, `integrations`.
- RLS em todas as tabelas de domínio.
- RPC `sync_workspace(jsonb)` para sincronização transacional do estado atual do frontend.

## Como instalar

1. Crie um projeto no Supabase.
2. Abra **SQL Editor**.
3. Execute todo o conteúdo de `schema.sql`.
4. No projeto local, crie `.env.local` a partir de `.env.example`.
5. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
6. Rode `npm install` e depois `npm run dev`.

## Compatibilidade com o frontend

A aplicação continua usando os tipos existentes em `src/types.ts`. A diferença é que `src/lib/workspaceRepository.ts` converte entre os tipos TypeScript atuais e as tabelas relacionais do PostgreSQL.

Isso permite uma migração gradual: o próximo passo pode trocar o snapshot completo por operações CRUD individuais e consultas específicas por tela, sem precisar refazer a interface agora.

## Observação sobre dados da Fase 1

O código da Fase 2 não consulta mais `workspace_states`. Se você já tinha dados reais armazenados nessa tabela em um projeto Supabase da Fase 1, não execute uma exclusão dessa tabela antes de exportar/migrar os dados. O arquivo atual não apaga a tabela legada automaticamente.
