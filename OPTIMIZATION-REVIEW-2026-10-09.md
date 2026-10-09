# Revisão de otimizações pendentes — StudioDesk

**Data:** 2026-10-09  
**Base revisada:** relatório de RLS/segurança, código atual, dependências, advisors e build.

## Estado atual

A base continua saudável:

- `npm run lint`: aprovado;
- `npm audit --omit=dev`: 0 vulnerabilidades;
- `npm run build`: aprovado;
- instalação e build continuam reproduzíveis;
- RLS permanece ativo e isolado por workspace;
- advisors do Supabase não apresentaram novos alertas críticos.

## Resultado da execução dos seis processos

Os itens de código e banco foram executados com sucesso. Foram removidos imports, setters, estados, handlers e exports comprovadamente não utilizados; a importação `motion` morta da landing page também foi removida. O diagnóstico `tsc --noUnusedLocals --noUnusedParameters` terminou sem diagnósticos.

Os quatro endpoints receberam validação de origem e rate limiting. A migration `20261009_revoke_anon_table_privileges.sql` foi aplicada no Supabase, e a consulta posterior confirmou zero privilégios de tabela pública para `anon`.

A proteção contra senhas vazadas foi tentada no Dashboard do Supabase, mas o próprio projeto recusou a alteração porque o recurso HaveIBeenPwned está disponível somente nos planos Pro ou superiores. Nenhuma configuração parcial foi deixada aplicada.

As validações finais passaram: lint, auditoria de dependências, build de produção, verificação de diff e TypeScript estrito de símbolos não utilizados.

## Pendências confirmadas

### Prioridade alta — endurecimento de segurança

1. **Revogar ACL de `anon` nas tabelas públicas — concluído**
   - O RLS bloqueia efetivamente `anon`, mas os grants de tabela ainda são amplos.
   - Migration aplicada e validada.
   - `authenticated` foi preservado.

2. **Adicionar rate limiting e origem permitida aos endpoints restantes — concluído**
   - `/api/session/bootstrap`;
   - `/api/team/join`;
   - `/api/team/invitations`;
   - `/api/workspaces`.
   
   Os quatro endpoints agora aplicam as proteções antes de autenticar ou processar o corpo da requisição.

3. **Ativar proteção contra senhas vazadas no Supabase Auth — bloqueado pelo plano**
   - O Dashboard confirmou que o recurso exige plano Pro ou superior.
   - A configuração permanece desativada e é a única pendência dos seis processos.

### Prioridade média — limpeza e performance

4. **Limpar imports e variáveis locais não usadas — concluído**
   - Os 189 diagnósticos foram reduzidos a zero sem alterar o comportamento funcional.

5. **Remover a importação `motion` não utilizada de `LandingPage.tsx` — concluído**
   - É um candidato de baixo risco e alta confiança.
   - `motion/react` é usado em `Toast` e `GlobalSearchModal`, mas a importação da landing page não é consumida.
   - Deve ser removida junto com imports de ícones não utilizados desse componente.

6. **Revisar exports internos não utilizados — concluído para os casos comprovados**
   O Knip apontou exports, não necessariamente módulos mortos:

   - `clearWorkspaceCache`;
   - `getServerProfile`;
   - exports de constantes usados apenas dentro do próprio módulo, como `PLANS_CONFIG`, `REALTIME_TABLES` e constantes de Storage.

   Remover o `export` de constantes internas é seguro após confirmar que não há consumidores externos. `clearWorkspaceCache` e `getServerProfile` precisam de inspeção funcional antes de serem deletados.

7. **Mover plugins exclusivamente de build para `devDependencies` — já aplicado**
   - `@tailwindcss/vite`;
   - `@vitejs/plugin-react`.

   Não é ganho direto no bundle do navegador, mas reduz dependências runtime declaradas e melhora a instalação de produção. Validar o comportamento do build na Vercel antes de aplicar.

## Bundle atual

- bundle inicial: aproximadamente **741,5 kB** minificado, **208,8 kB gzip**;
- módulo de métricas: aproximadamente **437,9 kB** minificado, **124,6 kB gzip**;
- CSS: aproximadamente **62,3 kB** minificado, **11,0 kB gzip**.

O módulo de métricas já é carregado por `React.lazy`, portanto o peso de `recharts` não é baixado no carregamento inicial. Não recomendo adicionar manual chunks ou trocar a biblioteca antes de obter um perfil real de navegação; isso poderia aumentar requisições e complexidade sem ganho perceptível.

## Falsos positivos mantidos

- Os 14 arquivos `api/**` marcados pelo Knip são entrypoints serverless da Vercel e não devem ser removidos.
- Os avisos de `SECURITY DEFINER` para helpers RLS e onboarding/conversão continuam compatíveis com o desenho atual.
- As tabelas sem policies (`workspace_invitations` e `studiodesk_schema_migrations`) permanecem deliberadamente fechadas.

## Ordem recomendada para a próxima execução

1. Remover imports mortos e a importação `motion` não utilizada.
2. Aplicar ACL mínimo para `anon` no Supabase.
3. Adicionar rate limiting/origin check aos quatro endpoints.
4. Validar senha vazada no Supabase Auth.
5. Reexecutar instalação limpa, audit, lint, build e advisors.
6. Só então avaliar otimizações mais profundas do bundle com medição de navegação.

O repositório está validado, mas as alterações ainda não foram commitadas ou publicadas.
