# StudioDesk — Fase 4

## Autenticação e autorização

Esta fase transforma o papel do usuário em uma regra de segurança real, e não apenas em um valor visual do React.

### Papéis
- `admin`: administração completa do workspace, equipe e integrações.
- `gestor`: gestão operacional de CRM, projetos, agenda, aprovações e Kanban.
- `colaborador`: execução operacional de tarefas, comunicação, agenda e aprovações.

### Camadas
1. Supabase Auth identifica o usuário.
2. `workspace_members` define o papel real.
3. `profiles` exibe o perfil, mas não é fonte de autorização.
4. RLS impede mutações incompatíveis com o papel.
5. React usa `permissions.ts` para esconder/bloquear áreas antes da chamada ao banco.

### Importante
O SQL deve ser executado no Supabase antes de testar usuários reais. Nenhuma chave é incluída no projeto.
