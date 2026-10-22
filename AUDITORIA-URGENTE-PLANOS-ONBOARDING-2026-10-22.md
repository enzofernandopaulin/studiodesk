# Auditoria urgente — planos e onboarding

## Estado geral

A causa raiz do plano voltar para Solo/Individual após recarregar foi confirmada no fluxo de persistência. A seleção funcionava apenas em memória no React; ao concluir o onboarding, o frontend enviava `p_plan`, mas a função SQL `complete_studiodesk_onboarding` não gravava esse parâmetro em `profiles`. Na próxima sessão, `loadProfile()` lia novamente `individual` do banco.

## Fluxo auditado

1. **Landing / criação da conta**
   - Os botões dos planos chamavam `handleStartPlan`, mas o parâmetro recebido era ignorado.
   - Resultado: clicar em Solo, Studio, Empresa ou Agência não preservava a intenção até a autenticação.

2. **Seleção de plano após autenticação**
   - `ProfileSelection` chamava `setPlan(selectedPlan)` e avançava para o onboarding.
   - O valor ficava somente no estado local até o final do wizard.

3. **Onboarding**
   - `completeOnboarding()` enviava corretamente `p_plan: user.plan` para o RPC.
   - A função SQL recebia `p_plan`, porém o `UPDATE profiles` não incluía `plan` na versão problemática aplicada no banco/script.

4. **Recarga da sessão**
   - `loadAuthenticatedData()` chama `/api/session/bootstrap` e depois `loadProfile()`.
   - `loadProfile()` usa `profiles.plan` como valor canônico.
   - Como `profiles.plan` permanecia `individual`, a interface reaparecia com o plano Solo/Individual.

## Correções feitas no código

- `src/components/landing/LandingPage.tsx`
  - Preserva o plano clicado em `sessionStorage` antes de abrir a autenticação.

- `src/components/onboarding/ProfileSelection.tsx`
  - Recupera o plano escolhido na landing e o aplica uma vez ao estado do onboarding.

- `supabase/migrations/20261022_fix_onboarding_plan_persistence.sql`
  - Migration corretiva idempotente.
  - Persiste `p_plan` em `profiles.plan`.
  - Sincroniza `workspaces.plan` quando o usuário é o dono do workspace.
  - Mantém whitelist de planos válidos.
  - Preserva validações de sessão, membership e colunas do Kanban.

- `supabase/FASE-1-INTEGRIDADE.sql`
  - Atualizado para que novos ambientes não reintroduzam o mesmo defeito.

- `supabase/migrations/20261022_security_and_workspace_isolation.sql`
  - Mantida a correção anterior da função `has_workspace_role(uuid, text[])`.

## Validações

- `npm ci`: aprovado; 0 vulnerabilidades reportadas.
- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- `git diff --check`: aprovado.

## Ação necessária no Supabase

A migration abaixo precisa ser executada no SQL Editor ou no processo oficial de migrations antes do teste final em produção:

`supabase/migrations/20261022_fix_onboarding_plan_persistence.sql`

A execução não foi feita automaticamente para evitar alterar o banco sem confirmação explícita.

## Teste manual recomendado após aplicar a migration

Para cada plano (`solo`, `studio`, `empresa`, `agencia`):

1. Clicar no plano na landing.
2. Criar uma conta nova.
3. Confirmar que o plano chega selecionado na etapa de planos.
4. Concluir todas as seis etapas do onboarding.
5. Confirmar o plano exibido no workspace.
6. Recarregar a página.
7. Encerrar e iniciar a sessão novamente.
8. Confirmar que `profiles.plan` e `workspaces.plan` permanecem iguais ao plano escolhido.

Para contas antigas que já foram gravadas como `individual`, o sistema não tem como inferir com segurança qual plano o usuário pretendia escolher. Essas contas devem concluir novamente a seleção/onboarding após a migration.

## Git

Nenhum commit, push ou deploy foi feito.
