# Vercel — ações necessárias na etapa 0

## 1. Obter acesso à equipe correta

O status GitHub da main aponta para o projeto `studiodesk` na equipe `lembre`:
https://vercel.com/lembre/studiodesk/9g2fuZg6WogKjabYkgxWaP8zw9YS

Abra o projeto com uma conta autorizada. A conexão usada nesta execução não tem acesso a essa equipe (403); a solicitação de link de autorização retornou “Team not found” (404). Um administrador da equipe precisa conceder acesso à conta Vercel usada na conexão; depois, autorizar essa equipe na integração. A senha de login do StudioDesk não concede esse acesso.

## 2. Conferir o vínculo e a produção

Em Settings/Git, confira o repositório `enzofernandopaulin/studiodesk` e a branch de produção `main`. Registre o SHA do deployment que atende o domínio de produção, a URL e a data. Não mude a branch de produção para a branch das correções.

Em Build & Deployment, confira o projeto Vite, diretório raiz do aplicativo, instalação com lockfile, build `npm run build` e saída `dist`. Não sobrescreva configurações diferentes antes de entender o motivo.

## 3. Separar as variáveis

Confira as variáveis de Production sem revelar seus valores. Quando o Supabase staging estiver preparado, configure overrides de Preview específicos para `atualizacao-studiodesk-Ruan-Beguetto`.

| Variável | Production | Preview da branch |
|---|---|---|
| `VITE_SUPABASE_URL` | URL do Supabase produção | URL do Supabase staging |
| `VITE_SUPABASE_PUBLISHABLE_KEY` OU `VITE_SUPABASE_ANON_KEY` | Chave pública da produção | Chave pública do staging |
| `SUPABASE_URL` | Mesma URL pública da produção | Mesma URL pública do staging |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo de servidor da produção | Segredo de servidor do staging |
| `APP_URL` | Origem HTTPS do site em produção | Origem HTTPS estável do Preview de homologação |
| `LEADS_WEBHOOK_SECRET` | Segredo próprio se webhook habilitado | Outro segredo, apenas se for testar webhook |
| `STUDIODESK_ENV` | `production` | `staging` |
| `STUDIODESK_PRODUCTION_SUPABASE_URL` | Não necessário | URL pública do projeto produção para o verificador comparar |

As duas últimas variáveis são usadas pelo verificador da etapa 0, não alteram o app. Para executar esse verificador no ambiente de build, após preencher a tabela, configure o comando `npm run check:env && npm run build`. Não habilite esse bloqueio antes de cadastrar as variáveis, pois o build passará a falhar quando a configuração estiver incompleta.

Nunca use prefixo `VITE_` em segredos de servidor. Não reutilize chaves de email, WhatsApp ou IA de produção no staging. As variáveis de integrações opcionais continuam opcionais; habilite cada integração de teste separadamente.

## 4. Revisar Preview antes de utilizá-lo

O push desta branch pode disparar Preview automaticamente se a integração Git estiver ativa. Não utilize esse Preview para criar dados antes de conferir o isolamento: ele pode herdar variáveis de produção. Restrinja o acesso de homologação com os controles disponíveis na equipe.

Escolha a URL estável de homologação, ajuste `APP_URL` e as URLs de Auth no Supabase staging e gere um novo Preview após atualizar variáveis. As variáveis `VITE_*` entram no build; alterar somente o painel não atualiza um bundle já publicado.

## 5. Verificar

Confirme que o deployment mostra o commit da branch, status Ready e o banco de staging. Execute a matriz em [ETAPA-0.md](ETAPA-0.md). `/api/health` responder 200 não comprova acesso ao banco: esse endpoint é estático. Verifique também login, sessão, persistência e isolamento real.

Não promova esse Preview para produção nem faça merge automático. A entrega atual prepara a operação; a liberação comercial depende das demais etapas e da homologação.
