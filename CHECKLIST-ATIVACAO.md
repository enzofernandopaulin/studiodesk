# StudioDesk — ativação Supabase

Esta versão não possui login de demonstração nem dados mock no runtime.

## 1. Segurança primeiro

O arquivo `.env.example` da versão anterior continha uma chave secreta real. Gere uma **nova Secret key** no Supabase e revogue a antiga antes de publicar o projeto. A chave publishable pode ficar no frontend; a Secret key nunca pode usar prefixo `VITE_`.

## 2. `.env.local`

Crie `.env.local` na mesma pasta de `package.json`:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE

SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sb_secret_SUA_NOVA_CHAVE
APP_URL=http://localhost:3000
```

Na Vercel, cadastre cada variável sem aspas e sem `=` no campo do nome. Marque
Production, Preview e Development e faça um novo deploy; variáveis `VITE_*`
só entram no site durante o build. Projetos Supabase antigos também podem usar
`VITE_SUPABASE_ANON_KEY` no lugar de `VITE_SUPABASE_PUBLISHABLE_KEY`.

As integrações opcionais podem permanecer vazias durante o primeiro teste.

## 3. Supabase Auth

No painel do Supabase, em **Authentication > URL Configuration**:

- Site URL local: `http://localhost:3000`
- Adicione `http://localhost:3000/**` à lista de Redirect URLs.
- Quando publicar na Vercel, adicione também o domínio de produção.

O `schema.sql` já deve ter sido executado. Não é necessário executá-lo novamente se a criação anterior terminou com sucesso.

## 4. Teste local

```bash
npm install
npm run build
npm run dev
```

A aplicação abre em `http://localhost:3000`.

## 5. Cadastro

1. Clique em **Criar cadastro gratuito**.
2. Informe nome, empresa, e-mail e senha.
3. O frontend chama `supabase.auth.signUp`.
4. O trigger `on_auth_user_created` cria automaticamente `workspaces`, `workspace_members` e `profiles`.
5. Se confirmação de e-mail estiver habilitada, confirme o e-mail antes de entrar.
6. No primeiro acesso, o usuário passa pela escolha de perfil e onboarding; depois entra no workspace vazio.

## 6. Conferência no Supabase

Verifique:

- Authentication > Users: usuário criado;
- Table Editor > `profiles`: linha com o mesmo UUID do usuário;
- `workspace_members`: membership com papel `admin`;
- `workspaces`: workspace da empresa.

Se algo não aparecer, execute **somente** `supabase/DIAGNOSTICO-AUTH.sql` e confira as colunas `ok`, `has_profile` e `has_membership`.
