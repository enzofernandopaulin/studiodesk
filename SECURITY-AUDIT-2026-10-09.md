# Auditoria de RLS e Segurança — StudioDesk

**Data:** 2026-10-09  
**Projeto Supabase:** `studiodesk` (`uehiqlrqxfouzapoesba`)  
**Escopo:** RLS, Storage, funções `SECURITY DEFINER`, APIs server-side, segredos e headers.

## Resumo executivo

O isolamento de dados por workspace está implementado e as policies atuais são restritas ao papel `authenticated`. Não foi encontrado segredo real versionado no repositório e a `SUPABASE_SERVICE_ROLE_KEY` permanece server-only.

Foram identificados três pontos para endurecimento adicional:

1. privilégios de tabela para `anon` permanecem concedidos no ACL, embora o RLS bloqueie efetivamente as tabelas por não haver policies para `anon`;
2. alguns endpoints de escrita ainda não usam rate limiting nem validação de origem centralizada;
3. os headers atuais não incluem uma Content Security Policy (CSP) nem políticas Cross-Origin modernas.

Nenhuma alteração foi aplicada nesta auditoria.

## 1. RLS do schema `public`

### Situação encontrada

- RLS está habilitado em todas as tabelas públicas do StudioDesk.
- As policies de dados usam exclusivamente `authenticated`.
- As consultas são limitadas pelo `workspace_id` ativo e pela membership do usuário.
- `profiles` permite leitura/alteração apenas do próprio perfil.
- `workspace_members` permite leitura do próprio vínculo ou de administradores e alterações administrativas.
- `workspace_invitations` possui RLS e acesso direto revogado para `anon` e `authenticated`; é manipulada pelas APIs server-side.
- `studiodesk_schema_migrations` possui RLS sem policy e acesso direto não destinado ao frontend.

### Policies consideradas corretas

As policies de entidades usam padrões como:

```sql
workspace_id = current_workspace_id()
AND is_workspace_member(workspace_id)
```

ou, para operações administrativas:

```sql
workspace_id = current_workspace_id()
AND is_workspace_manager()
```

Isso protege contra acesso entre workspaces e separa permissões de colaborador, gestor e administrador.

### Ponto de endurecimento

O ACL das tabelas públicas ainda concede privilégios de tabela a `anon` e `authenticated`. O RLS impede o acesso efetivo de `anon` porque as policies são direcionadas a `authenticated`, mas o privilégio de tabela continua mais amplo do que o necessário.

**Recomendação:** revogar `SELECT/INSERT/UPDATE/DELETE` de `anon` nas tabelas públicas do StudioDesk. Não revogar os privilégios necessários de `authenticated`, pois o frontend usa Supabase diretamente para as entidades protegidas por RLS.

Essa mudança deve ser aplicada em migration e validada com o fluxo de login e cadastro.

## 2. Storage

As policies do Storage estão bem delimitadas:

### Avatares

- bucket: `studiodesk-avatars`;
- leitura, inserção, alteração e exclusão somente pelo próprio usuário;
- o primeiro segmento do caminho precisa ser o `auth.uid()`.

### Arquivos do workspace

- bucket: `studiodesk-files`;
- leitura e inserção somente por membros do workspace;
- alteração e exclusão somente por gestores;
- o primeiro segmento do caminho precisa ser o workspace ativo.

Não foi encontrado bucket público nas policies auditadas.

## 3. Funções `SECURITY DEFINER`

As funções possuem `SET search_path TO 'public'`, o que reduz o risco de search-path hijacking.

A migration de privilégio mínimo aplicada anteriormente deixou o estado efetivo assim:

- `anon`: sem execução nas funções auxiliares de RLS;
- `PUBLIC`: sem execução nas funções auxiliares e internas;
- `authenticated`: execução apenas nas funções auxiliares usadas pelas policies RLS;
- funções de trigger internas: sem execução por papéis da API;
- funções de onboarding e conversão de lead: continuam acessíveis a `authenticated` porque são chamadas pelo frontend.

Os alertas restantes do Supabase são esperados para essas funções necessárias ao sistema.

## 4. APIs server-side

### Pontos positivos

- `SUPABASE_SERVICE_ROLE_KEY` não aparece em código frontend.
- Não há arquivos `.env.local` ou segredos reais rastreados no Git.
- Autenticação server-side valida o Bearer token com `admin.auth.getUser()`.
- APIs sensíveis verificam membership e papel.
- Uploads validam caminho e workspace.
- Webhook de leads usa segredo e comparação resistente a timing attack.
- Payloads JSON possuem limite de 64 KB.
- Há rate limiting best-effort em vários endpoints.

### Endpoints que precisam de endurecimento

Os seguintes endpoints de escrita não usam de forma consistente o rate limiting e a validação de origem centralizados:

- `/api/session/bootstrap`;
- `/api/team/join`;
- `/api/team/invitations`;
- `/api/workspaces`.

Embora a maioria exija Bearer token e não esteja vulnerável ao CSRF clássico por cookie, a ausência de rate limiting permite abuso de chamadas de bootstrap, criação/alteração de workspace e tentativas repetidas de convite.

**Recomendação:** adicionar `rateLimit()` e `requireAllowedOrigin()` aos endpoints de escrita, com limites específicos por rota.

O endpoint de consulta de convite usa o token na query string. O token possui alta entropia, mas URLs podem aparecer em logs e histórico. **Recomendação futura:** migrar a prévia para POST com o token no corpo e limpar a URL imediatamente no frontend.

## 5. Headers de segurança

Headers atuais:

- `X-Content-Type-Options: nosniff`;
- `X-Frame-Options: DENY`;
- `Referrer-Policy: strict-origin-when-cross-origin`;
- `Permissions-Policy` restritiva;
- `Strict-Transport-Security`.

Headers ainda ausentes:

- `Content-Security-Policy`;
- `Cross-Origin-Opener-Policy`;
- `Cross-Origin-Resource-Policy`;
- `X-XSS-Protection` não é recomendado como correção moderna e não deve ser adicionado.

A CSP deve ser criada após confirmar fontes externas, chamadas Supabase, Vercel e eventuais integrações; uma política excessivamente rígida pode quebrar o frontend.

## 6. Dependências e build

A validação anterior confirmou:

- `npm audit --omit=dev`: 0 vulnerabilidades;
- instalação limpa: aprovada;
- TypeScript/lint: aprovado;
- build de produção: aprovado.

## 7. Prioridade recomendada

### Prioridade alta

1. Revogar privilégios de tabela de `anon` no schema `public`.
2. Adicionar rate limiting aos endpoints de escrita restantes.
3. Validar configuração de proteção contra senhas vazadas no Supabase Auth.

### Prioridade média

4. Adicionar CSP compatível com o frontend.
5. Adicionar headers Cross-Origin modernos.
6. Migrar prévia de convite de GET com token na URL para POST com token no corpo.

### Não recomendado neste momento

- adicionar policies artificiais a `workspace_invitations` ou `studiodesk_schema_migrations` apenas para remover avisos do linter;
- revogar os privilégios necessários de `authenticated` nas entidades usadas diretamente pelo frontend;
- remover as funções `SECURITY DEFINER` usadas pelas policies RLS.
