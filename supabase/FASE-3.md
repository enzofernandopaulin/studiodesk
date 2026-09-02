# StudioDesk — Fase 3

## CRUD Serverless por entidade

A Fase 3 muda o fluxo de persistência do StudioDesk. O `AppContext` continua sendo a camada de estado da interface para evitar uma reescrita massiva dos componentes, mas as mutações agora são enviadas diretamente para as tabelas relacionais do Supabase.

### Fluxo

```text
Componente React
      ↓
AppContext
      ↓
entityRepository
      ↓
Supabase PostgreSQL
```

### Entidades migradas

- Leads
- Clientes
- Projetos
- Tarefas
- Colunas do Kanban
- Mensagens
- Comunicações
- Eventos da agenda
- Solicitações de aprovação
- Equipe
- Integrações
- Timeline / auditoria
- Entregáveis e aprovação de mídia vinculados aos projetos

### Estratégia de segurança

As gravações usam o `workspace_id` resolvido a partir do usuário autenticado. O banco continua protegido por RLS, então o frontend não é responsável por decidir sozinho a qual workspace um registro pertence.

### Compatibilidade

Sem Supabase configurado, o StudioDesk continua funcionando com os dados de demonstração em memória.

Com Supabase configurado:

- criação usa `upsert` na entidade correspondente;
- edição usa `upsert` do registro atual;
- exclusão usa `delete` limitado ao workspace;
- o estado visual é atualizado de forma otimista;
- falhas de sincronização geram toast sem bloquear a interface.

### Primeira inicialização

Quando um usuário autenticado ainda não possui dados no banco, o aplicativo executa o `sync_workspace` uma única vez para semear o ambiente com os dados de demonstração. Depois disso, as operações normais deixam de usar o snapshot completo.

### Próxima evolução

A próxima etapa pode remover progressivamente o `AppContext` como fonte intermediária para consultas, criando hooks/repositories especializados (`useLeads`, `useClients`, `useProjects`, etc.) e, posteriormente, adicionar Realtime onde houver valor real — especialmente Kanban, mensagens, aprovações e notificações.
