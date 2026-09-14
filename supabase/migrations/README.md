# Ordem das migrations da auditoria

Execute em um projeto de staging, faça backup antes da produção e respeite a ordem:

1. `20260914_fase_1_seguranca_critica.sql`
2. `20260914_fase_2_integridade_e_indices.sql`
3. migrations das fases seguintes, na ordem numérica.

As chaves estrangeiras novas usam `NOT VALID`: novas gravações já são protegidas sem bloquear o deploy por dados antigos. Depois de corrigir eventuais órfãos, valide cada constraint em uma janela de manutenção.
