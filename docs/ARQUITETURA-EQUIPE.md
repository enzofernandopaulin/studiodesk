# Arquitetura de equipe do StudioDesk

## Fonte de verdade

`workspace_members` é a única fonte de verdade para acesso, papel e contagem de usuários. A tabela `team_members` é um diretório visual derivado e nunca deve conceder acesso sozinha.

## Invariantes

1. Um usuário só acessa um workspace se existir `(workspace_id, user_id)` em `workspace_members`.
2. O workspace ativo de `profiles.workspace_id` deve possuir uma membership correspondente.
3. A entrada por convite, a conferência do plano e a criação do diretório acontecem na mesma transação.
4. A contagem do plano sempre usa `workspace_members`, incluindo o proprietário.
5. Remover um cartão da equipe deve remover a membership real.
6. O proprietário não pode ser removido pela tela de equipe.
7. Uma pessoa removida deve continuar com outro workspace válido ou receber um workspace pessoal.

## Fluxos oficiais

### Listar equipe

`GET /api/team/members` autentica o usuário, identifica o workspace ativo e monta a lista a partir de `workspace_members`. Perfil e diretório apenas complementam nome, e-mail, avatar e cargo.

### Entrar por link

`POST /api/team/join` chama `accept_workspace_invitation`, que bloqueia o workspace durante a operação, valida convite e limite, cria a membership, atualiza o perfil ativo e sincroniza o diretório.

### Remover membro

`DELETE /api/team/members` chama `remove_workspace_member`, que valida o administrador, protege o proprietário, remove o acesso e seleciona um workspace válido para a conta removida.

## Ordem de implantação

1. Publicar o código da branch `main`.
2. Executar `supabase/CORRECAO-WORKSPACES-E-CONVITES.sql` quando a estrutura base ainda não foi corrigida.
3. Executar `supabase/EQUIPE-PROFISSIONAL.sql`.
4. Executar `supabase/DIAGNOSTICO-EQUIPE.sql` e conferir os resultados.
5. Aguardar o deployment da Vercel ficar `Ready`.
6. Testar com duas contas e uma janela anônima.

## Critérios mínimos antes de considerar o fluxo pronto

- Administrador aparece na lista da própria equipe.
- Convidado aparece após entrar pelo link e também depois de atualizar a página.
- O convidado vê os dados do workspace correto.
- O workspace pessoal do convidado continua disponível no seletor.
- Plano lotado bloqueia uma nova entrada.
- Remoção encerra o acesso real.
- O diagnóstico retorna zero inconsistências.
