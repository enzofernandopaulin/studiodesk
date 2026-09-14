# Execução segura — Fases 0 a 6

Este documento separa o que é preparado no repositório do que precisa ser
confirmado nos painéis do Supabase e da Vercel.

## Antes de aplicar em produção

- Criar ou selecionar um projeto Supabase de staging.
- Configurar um Preview Environment da Vercel apontando apenas para staging.
- Usar dados fictícios ou anonimizados.
- Exportar o schema atual de produção e registrar as migrations já aplicadas.
- Fazer backup do banco antes de qualquer migration.
- Confirmar as variáveis do Preview sem copiar segredos para arquivos Git.
- Executar o CI e os fluxos manuais de cadastro, onboarding, convite e Storage.

## Ordem de implantação

1. Aplicar migrations aditivas em staging.
2. Publicar a branch em Vercel Preview.
3. Executar testes de regressão e permissões.
4. Aplicar migrations compatíveis em produção.
5. Publicar o frontend e as Functions.
6. Executar smoke tests.
7. Remover estruturas antigas apenas depois da estabilização.

## Responsabilidades externas

A criação do projeto de staging, a configuração das variáveis e a publicação na
Vercel dependem de acesso aos painéis. Um commit no GitHub não executa essas
ações automaticamente.
