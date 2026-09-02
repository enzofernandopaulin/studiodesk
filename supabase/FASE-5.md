# StudioDesk — Fase 5: Storage de arquivos

Esta fase adiciona armazenamento privado de arquivos usando Supabase Storage, sem alterar a arquitetura visual do CRM.

## O que foi implementado

- Bucket privado `studiodesk-files` com limite de 500 MB.
- Políticas RLS por workspace no `storage.objects`.
- Upload seguro com caminho `<workspace_id>/<categoria>/<user_id>/<uuid>-<arquivo>`.
- Validação de tamanho e tipos MIME no frontend e reforço no bucket.
- Referências persistidas como `storage://studiodesk-files/...` para não salvar URLs assinadas que expiram.
- Signed URLs temporárias geradas apenas quando um arquivo é exibido/aberto.
- Upload direto de arquivos na criação/edição de solicitações de aprovação.
- Upload de vídeo e thumbnail no módulo de aprovação de mídia do projeto.
- Componente reutilizável `StorageAsset` para resolver referências privadas sem expor caminhos permanentes.
- Exclusão de arquivos restrita a gestores/admins no Storage.

## Categorias atuais

- `approvals`
- `project-videos`
- `project-thumbnails`

A estrutura permite adicionar outras categorias posteriormente sem mudar a política de segurança.

## Configuração posterior

Você não precisa criar o projeto no Supabase agora. Quando chegar a hora, execute o `supabase/schema.sql` completo no SQL Editor. O bloco da Fase 5 cria/atualiza o bucket e suas políticas de forma idempotente.

## Decisão arquitetural

O bucket é **privado**. O banco guarda uma referência `storage://...`, e o frontend solicita uma signed URL temporária. Isso evita transformar arquivos de clientes em conteúdo público e evita persistir links assinados que expiram.
