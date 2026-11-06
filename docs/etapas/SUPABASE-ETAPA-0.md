# Supabase — ordem manual da etapa 0

## 1. Confirmar o projeto

Abra o dashboard do Supabase e confira se o projeto corresponde a `SUPABASE_URL` e `VITE_SUPABASE_URL` usados pela produção. Guarde a referência do projeto e a data da conferência de forma privada. Não copie chaves ou senhas para issues, commits ou comentários.

## 2. Executar somente o inventário

No SQL Editor desse projeto, abra uma consulta nova, cole **todo** o arquivo [01-inventario-somente-leitura.sql](../../supabase/etapa-0/01-inventario-somente-leitura.sql) e execute. Salve o JSON resultante em local privado. O arquivo começa com uma transação somente de leitura e termina com rollback; não modifica clientes, usuários, permissões ou estrutura.

## 3. Executar o preflight

Em outra consulta, execute **todo** o arquivo [02-preflight-somente-leitura.sql](../../supabase/etapa-0/02-preflight-somente-leitura.sql). Salve os dois conjuntos de resultados: verificações e buckets. `false` significa necessidade de investigação; não execute um SQL antigo para tentar corrigir automaticamente. `true` indica somente a propriedade verificada, não uma certificação de segurança.

Se houver erro, registre a mensagem sem credenciais e interrompa essa sequência. Os scripts pressupõem os papéis padrão do Supabase e o schema Storage; o diagnóstico não cria esses recursos.

## 4. Backup e restauração isolada

Confirme a disponibilidade de backup do projeto no painel e registre data, retenção e método de recuperação. Se for necessário exportar/restaurar com CLI, siga o [procedimento oficial do Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), usando as versões e pré-requisitos indicados. Não coloque credenciais em comandos que serão publicados ou no repositório.

O [backup de banco não inclui o conteúdo dos arquivos do Storage](https://supabase.com/docs/guides/platform/backups). Faça também uma cópia privada dos objetos de cada bucket, preservando seus caminhos e metadados necessários, e registre contagens e checksums. Não trate a cópia de `storage.objects` como cópia dos arquivos.

Restaure em projeto de recuperação isolado, nunca sobre produção como teste. Mantenha esse destino restrito, sem app público, envios de email, WhatsApp ou webhooks. Confira usuários/perfis, relacionamentos, RLS, funções, contagens por tabela e amostras de objetos por checksum. Registre duração e erros. Não use dados reais recuperados como massa pública de homologação.

## 5. Preparar staging e reconciliar o SQL

Crie ou identifique um projeto Supabase separado para homologação. Antes de aplicar scripts de estrutura, compare os resultados de 01/02 com o código e os arquivos históricos. Esta entrega **não contém uma migração de escrita nem uma instalação limpa certificada**: faltam o estado real do banco e o teste de recuperação.

Referências para a reconciliação, e NÃO uma lista para executar:

| Arquivo/grupo | Responsabilidade / cuidado |
|---|---|
| `schema.sql` | Estrutura base; também recria a RPC legada `sync_workspace`, capaz de substituir dados |
| `20260907_priority_zero_security.sql` | Bootstrap, papéis, remoção da RPC legada e políticas |
| `CORRECAO-WORKSPACES-E-CONVITES.sql` | Correção consolidada de workspaces/convites; redefine funções |
| `FASE-1-INTEGRIDADE.sql` | Onboarding, conversão e criação de workspace |
| `FASE-2-PERFORMANCE.sql`, `FASE-4-PAGINACAO.sql` | Índices/performance |
| `20261009_*.sql` | Privilégios e índices; parte depende de funções criadas por outros arquivos |
| `20261022_security_and_workspace_isolation.sql` | Políticas e proteção do perfil |
| `MULTI-WORKSPACE.sql`, `TEAM-INVITES.sql`, outros auxiliares | Histórico a reconciliar; não executar em lote |

Após revisar o inventário será preparada uma baseline para banco vazio e, separadamente, as migrações mínimas para o banco existente. Cada uma deverá ser testada antes de qualquer aplicação em produção.

## 6. Homologar

Após a baseline validada, configure Auth com as URLs exatas do ambiente de testes e vincule-o somente ao Preview Vercel. Crie os dois workspaces e seis contas sintéticas descritos em [ETAPA-0.md](ETAPA-0.md). Execute a matriz de testes e registre os resultados. Só declare a etapa concluída após comprovar instalação, recuperação e isolamento.

**O que aplicar agora no banco existente: somente 01 e depois 02. Nenhum ALTER, DELETE, DROP ou migration antiga faz parte desta primeira aplicação.**
