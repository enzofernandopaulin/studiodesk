# Implementação do Portal do Cliente — 24/10/2026

## Estado atual

Foi implementada a base funcional integrada do Portal do Cliente sobre a arquitetura existente do StudioDesk.

## Alterações aplicadas no código

- Novo papel `cliente`, separado de administrador, gestor e colaborador.
- Novo vínculo `profiles.client_id`.
- Redirecionamento automático de contas cliente para `client_portal`, sem acesso ao dashboard administrativo.
- Novo portal com:
  - projetos vinculados;
  - progresso, etapa, prazo e responsável;
  - tarefas/progresso derivados do projeto;
  - materiais e solicitações de aprovação;
  - ações aprovar, reprovar e solicitar ajustes;
  - comunicação por projeto;
  - envio de mensagens por RPC segura.
- Novo convite de Portal do Cliente gerado na carteira de clientes.
- Fluxo de convite com URL `client_invite`, autenticação e vínculo automático da conta ao cliente correto.
- Convites administrativos existentes continuam separados em `team_invite`.

## Banco de dados

A migration nova cria:

- `client_portal_invitations`;
- suporte ao papel `cliente` em `workspace_members`;
- função `is_workspace_client`;
- função `current_client_id`;
- RPC `client_send_message`;
- RPC `client_respond_to_approval`;
- policies RLS para limitar clientes ao próprio `client_id` e aos projetos vinculados;
- policies para projetos, entregáveis, mídia, aprovações, tarefas, comentários e mensagens.

Migration:

`supabase/migrations/20261024_client_portal_access.sql`

## Segurança

O cliente não recebe acesso às tabelas internas de CRM, equipe, integrações, calendário ou timeline. As operações de mensagem e aprovação não aceitam diretamente `workspace_id`, `client_id` ou autor enviados pelo navegador: esses valores são derivados da sessão autenticada e do perfil vinculado.

## Validações

- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `git diff --check`: aprovado.

O build continua exibindo apenas o aviso existente de chunks grandes do Vite.

## Pendências para conclusão operacional

1. Aplicar a migration no Supabase de produção.
2. Publicar o frontend/API na Vercel.
3. Testar com uma conta cliente real:
   - convite;
   - login;
   - isolamento de projetos;
   - envio de mensagem;
   - aprovação e solicitação de ajustes;
   - tentativa de acesso a outro projeto/workspace.
4. Implementar, em fase seguinte, notificações internas/e-mail, anexos no canal do cliente e seleção granular de tarefas visíveis.
