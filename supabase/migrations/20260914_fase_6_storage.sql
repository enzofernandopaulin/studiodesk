-- Fase 6: metadado canônico do avatar.
alter table public.profiles add column if not exists avatar text not null default '';
-- O bucket de arquivos de negócio permanece privado; avatars são públicos por decisão
-- de produto, pois aparecem no diretório da equipe. Apenas o dono pode gravar seu caminho.
