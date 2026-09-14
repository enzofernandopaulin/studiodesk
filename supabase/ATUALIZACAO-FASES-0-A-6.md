# Atualização do Supabase — Fases 0 a 6

Para uma instalação existente, prefira executar somente:

`APLICAR-Fases-0-A-6.sql`

O arquivo consolidado contém as mudanças de banco das Fases 1, 2, 3 e 6 em uma única transação. As Fases 0, 4 e 5 são alterações de CI/frontend e não precisam de comandos SQL.

## Procedimento

1. Faça backup do banco.
2. Execute o arquivo completo primeiro em staging.
3. Confirme que o diagnóstico final retorna `ok = true` em todas as linhas.
4. Teste login, criação de conta, convite de gestor/colaborador, troca de workspace e avatar.
5. Repita em produção numa janela de manutenção.
6. Só depois publique a aplicação da branch correspondente.

As novas FKs usam `NOT VALID`: protegem novas gravações sem falhar por registros órfãos antigos. A validação integral deve ser feita após uma auditoria dos dados existentes.
