# Fase 1 — configuração externa

Na Vercel, configure `LEADS_WEBHOOK_SECRETS_JSON` como JSON de UUID do workspace para segredo com pelo menos 32 caracteres. O integrador envia os cabeçalhos `x-studiodesk-workspace-id` e `x-studiodesk-signature` (HMAC-SHA256 hexadecimal do corpo bruto).

No Supabase, execute `supabase/migrations/20260914_fase_1_seguranca_critica.sql` primeiro em staging.
