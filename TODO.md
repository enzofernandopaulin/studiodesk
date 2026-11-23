# TODO — Portal do Cliente

## Concluído nesta rodada
- [x] Login por link individual opaco assinado e código gerado pelo sistema; o cliente não informa IDs técnicos.
- [x] Hash e verificação do código exclusivamente no servidor com Argon2id.
- [x] Sessão com cookie HttpOnly, Secure e SameSite; banco recebe somente hash do token.
- [x] Validação composta de `workspace_id`, `project_id` e `client_id` a partir do vínculo persistido.
- [x] Logout, expiração, revogação e proteção CSRF para operações de escrita.
- [x] Não expor `service_role`, hashes, URLs privadas ou dados internos no frontend.
- [x] Mostrar somente a etapa atual do projeto; tarefas permanecem em lista neutra porque `tasks` não possui vínculo com coluna.
- [x] Confirmar e usar `tasks.completed_at` sem criar coluna nova.
- [x] Filtrar `approval_requests` por workspace, projeto e cliente.
- [x] Endpoint de aprovação preparado para RPC transacional, sem update/insert separado.
- [x] Interface administrativa para gerar link, código, consultar e revogar acesso.
- [x] Regenerar `PORTAL-CODIGO-COMPLETO.txt`.

## Migrations pendentes — não executar sem aprovação
- [ ] Aprovar e executar a migration de rate limit distribuído (`supabase/PROPOSTA-MIGRATION-PORTAL-ATOMICIDADE.sql` ou a proposta de rate limit isolada).
- [ ] Aprovar e executar a migration da RPC `apply_client_portal_approval_action` incluída na proposta de atomicidade.

## Validação pendente
- [x] Executar `npm run lint`.
- [x] Executar `npm run build`.
- [x] Executar `git diff --check`.
- [ ] Testar isolamento cruzado com dois registros reais em `client_project_access`.
- [ ] Testar sessão expirada/revogada e ações de aprovação com registros reais.
- [ ] Fazer teste HTTP autenticado do link/código após as migrations aprovadas.
