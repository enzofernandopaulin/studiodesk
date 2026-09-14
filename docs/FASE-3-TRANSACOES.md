# Fase 3 — transações

O endpoint de bootstrap agora faz uma única chamada RPC. A função usa bloqueio transacional por usuário, cria o workspace com `owner_id`, cria o vínculo administrativo e salva o perfil na mesma transação. Qualquer falha desfaz tudo, evitando perfil vazio ou workspace órfão.
