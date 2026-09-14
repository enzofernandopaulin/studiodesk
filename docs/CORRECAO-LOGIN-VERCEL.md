# Correção da inicialização do Supabase na Vercel

O frontend tenta primeiro as variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` incorporadas pelo Vite. Se elas não estiverem no bundle, `/api/public-config` entrega somente a URL e a chave pública antes da renderização.

O endpoint nunca lê nem devolve `SUPABASE_SERVICE_ROLE_KEY`. Depois deste commit é necessário gerar um novo deploy. Para o fallback, configure também `SUPABASE_PUBLISHABLE_KEY`, ou mantenha as variáveis `VITE_*` disponíveis para a função.
