# StudioDesk — CRM Kanban para Agências Criativas

StudioDesk é um CRM/Kanban para agências criativas, agora preparado para uma arquitetura Serverless com **Vercel + Supabase**.

## Arquitetura da primeira fase

- **Vercel:** hospedagem do frontend React/Vite e futura camada de Serverless Functions.
- **Supabase Auth:** autenticação de usuários.
- **Supabase PostgreSQL:** persistência do perfil e do workspace.
- **Supabase RLS:** isolamento dos dados por usuário autenticado.
- **Supabase Realtime/Storage:** preparados para as próximas fases.
- **GitHub:** versionamento e CI/CD com a Vercel.

Nesta primeira etapa, o domínio existente foi preservado e o estado do workspace é armazenado em uma coluna `jsonb`. Isso reduz o risco da migração e permite colocar o projeto em produção antes de normalizar cada entidade em tabelas independentes.

## Configuração local

### 1. Instale as dependências

```bash
npm install
```

### 2. Crie um projeto no Supabase

No SQL Editor do projeto, execute:

```text
supabase/schema.sql
```

### 3. Configure as variáveis

Crie `.env.local` a partir de `.env.example`:

```env
VITE_SUPABASE_URL="https://SEU-PROJETO.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="SUA_ANON_KEY"
```

A chave `anon` pode ser utilizada no frontend quando as políticas RLS estiverem corretamente configuradas. **Nunca coloque a `service_role` em uma variável `VITE_*`.**

### 4. Execute

```bash
npm run dev
```

## Deploy na Vercel

1. Suba o projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` nas Environment Variables.
4. Faça o deploy.

A cada push no branch de produção, a Vercel poderá executar o build e publicar uma nova versão.

## Próximas fases

1. Normalizar leads, clientes, projetos, tarefas e demais entidades em tabelas PostgreSQL.
2. Implementar Storage para vídeos, imagens e documentos.
3. Implementar Realtime no Kanban, mensagens e aprovações.
4. Adicionar Serverless Functions na Vercel para integrações externas e segredos.
5. Implementar observabilidade e auditoria.

## Serverless — Fase 5

O StudioDesk agora está preparado para arquivos privados no Supabase Storage. Uploads de aprovações, vídeos e thumbnails usam referências `storage://...` e signed URLs temporárias, mantendo o bucket privado e isolado por workspace.

## Serverless — Fase 6
O StudioDesk utiliza Supabase Realtime com um canal multiplexado por workspace para sincronizar CRM, Kanban, projetos, tarefas, aprovações, mensagens e demais entidades. Eventos são agrupados em uma pequena janela para reduzir consultas redundantes.

## Serverless — Fase 7

A camada server-side da Vercel foi adicionada em `api/`. O frontend continua com Supabase Auth/RLS, enquanto operações que exigem contexto server-side usam Serverless Functions. A chave `SUPABASE_SERVICE_ROLE_KEY` é estritamente server-only.

Endpoints base: `/api/health`, `/api/me` e `/api/storage/signed-url`. Webhooks de terceiros serão adicionados apenas quando cada integração tiver sua validação de assinatura e contrato de entrada definidos.

## Segurança — Fase 8

A camada Serverless inclui headers de segurança, validação de payload, proteção de origem para operações de escrita, rate limiting best-effort, validação de caminhos do Storage e tratamento seguro de erros. Segredos continuam restritos às variáveis server-only da Vercel.

## Fase 9 — Integrações Serverless

Endpoints server-side opcionais para IA, WhatsApp, e-mail transacional e webhook de leads. Segredos nunca usam `VITE_` e devem ser configurados somente no ambiente da Vercel.


## Produção: autenticação Supabase

Esta versão não possui login de demonstração nem dados mock. Para executar localmente, crie `.env.local` na raiz com `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `APP_URL=http://localhost:3000`. Não publique `.env.local`.

O cadastro usa `supabase.auth.signUp`. O trigger `on_auth_user_created` em `supabase/schema.sql` cria automaticamente `workspaces`, `workspace_members` e `profiles`. Se a confirmação de e-mail estiver habilitada no Supabase, o usuário deve confirmar o e-mail antes de entrar.
