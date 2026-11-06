# Etapa 0 — preparação, diagnóstico e recuperação

Data: 06/11/2026. Branch de trabalho para as etapas: `atualizacao-studiodesk-Ruan-Beguetto`.
Base: `main`, commit `28f6ca5fff78031f6db06c72d34d282c9fc48f15`.

**Estado: preparação do repositório entregue; etapa 0 operacional ainda pendente.**
Não aplicar as etapas 1–6 como parte deste pacote. Nenhum SQL de alteração de produção está autorizado por este roteiro. Os dois SQL novos apenas consultam metadados em transações somente de leitura.

## Entregue e verificado

- Diagnóstico do banco: tabelas, colunas, RLS, políticas, privilégios, assinaturas de funções, constraints, índices, triggers e Realtime.
- Preflight com presença das 19 tabelas esperadas, RLS, RPCs usadas pelo aplicativo e configuração dos buckets.
- Manifesto SHA-256 dos 20 arquivos SQL do repositório para detectar mudanças. É inventário, não registro das migrações aplicadas remotamente.
- Verificador de configuração sem imprimir valores: obrigatórias, projetos divergentes, staging apontando para produção e possíveis segredos em `VITE_*`.
- Dez testes automatizados do verificador; compilação TypeScript e build Vite aprovados.
- Os dois SQL foram executados em PostgreSQL embarcado (PGlite) com fixtures mínimas: presença/ausência e RLS ativo/inativo. Isso não substitui o teste no Supabase real.
- Pastas de backups, evidências privadas e configuração local da Vercel excluídas do Git.

## Limites encontrados

O status GitHub do commit-base registra deploy bem-sucedido em 22/10/2026:
https://vercel.com/lembre/studiodesk/9g2fuZg6WogKjabYkgxWaP8zw9YS

Isso identifica a equipe `lembre` e um deploy histórico; não comprova qual commit atende o domínio de produção hoje. O acesso à equipe retornou 403; a tentativa de gerar autorização para a equipe retornou 404. A conexão atual mostra somente o projeto Dumonti em outra equipe. Não foram alteradas configurações Vercel.

Não há conexão administrativa Supabase disponível nesta execução. Portanto, inventário remoto, backup, restauração, baseline reproduzível e testes reais de isolamento ainda não estão comprovados. Os arquivos SQL históricos redefinem funções e políticas; não há justificativa para executá-los todos em ordem alfabética.

## Ordem de execução

1. Siga [SUPABASE-ETAPA-0.md](SUPABASE-ETAPA-0.md): identifique o projeto e rode apenas os diagnósticos 01 e 02.
2. Faça backup e ensaio de restauração conforme esse roteiro, em destino isolado.
3. Retorne os resultados dos diagnósticos de forma privada, sem chaves, senhas, tokens ou dados de clientes. Com eles será possível reconciliar o banco existente e preparar a sequência exata de migrações. **A baseline de instalação ainda não foi gerada nem homologada.**
4. Configure o ambiente de testes seguindo [VERCEL-ETAPA-0.md](VERCEL-ETAPA-0.md), depois de obter acesso à equipe correta e preparar um Supabase separado.
5. Execute a matriz de homologação abaixo. Somente então encerre a etapa 0.

## Matriz de homologação pendente

Criar pelo fluxo normal do aplicativo, somente em staging, dois workspaces sintéticos (`QA A` e `QA B`) e seis contas de teste controladas: admin, gestor e colaborador em cada workspace. Usar senhas exclusivas fora do Git. Não inserir usuários diretamente em `auth.users`.

| Verificação | Evidência necessária | Situação |
|---|---|---|
| Vercel / Supabase separados | Referências distintas e variáveis do Preview conferidas | Pendente |
| Instalação reproduzível | Banco vazio + baseline revisada + preflight | Pendente |
| Backup e recuperação | Data, duração, quantidade de registros/objetos e resultado de restauração | Pendente |
| Login e sessão | Entrar, recarregar, sair e recuperar acesso com contas sintéticas | Pendente |
| Isolamento A/B | Conta A não lê/altera registro ou arquivo B, inclusive via API | Pendente |
| Papéis | Admin, gestor e colaborador respeitam a matriz de permissões definida | Pendente |
| Persistência | Criar um lead, cliente, projeto e tarefa sintéticos e recarregar | Pendente |
| Arquivos | Upload, download autorizado e bloqueio entre workspaces | Pendente |
| Realtime | Mudança em duas sessões do mesmo workspace, sem evento de outro workspace | Pendente |

## Verificação local

```bash
npm ci --ignore-scripts
npm run test:etapa0
npm run check:sql
npm run lint
npm run build
```

Para verificar configuração: carregue as variáveis reais apenas em um terminal privado. Com Node compatível com `--env-file`, use `node --env-file=.env.local scripts/etapa-0/check-env.mjs`. `npm run check:env` verifica as variáveis já exportadas; não lê `.env.local` automaticamente. Um resultado positivo só verifica formato e consistência, não autentica chaves.

Para atualizar o manifesto após uma alteração SQL revisada:

```bash
node scripts/etapa-0/sql-manifest.mjs > supabase/etapa-0/sql-manifest.json
npm run check:sql
```

O build mantém o aviso pré-existente de bundle acima de 500 kB; a otimização pertence a uma etapa posterior. Não há mudança visual ou funcional de negócio neste pacote. Não houve merge na main nem promoção manual para produção.
