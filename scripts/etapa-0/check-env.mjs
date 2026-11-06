import { pathToFileURL } from 'node:url';

// Recebe variáveis do processo. Nunca imprime nomes arbitrários nem valores.
const clean = value => (value || '').trim().replace(/^['"]|['"]$/g, '').trim();
function jwtPayload(value) {
  try { return JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()); }
  catch { return {}; }
}
function origin(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash && u.pathname === '/' ? u.origin : null;
  } catch { return null; }
}
const placeholder = value => /SEU.PROJETO|SUA.CHAVE|SUA_ANON|gere_um_segredo/i.test(value);
export function checkEnv(input) {
  const env = Object.fromEntries(Object.entries(input).map(([key, value]) => [key, clean(value)]));
  const errors = [];
  const warnings = [];
  for (const key of ['VITE_SUPABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'APP_URL']) {
    if (!env[key] || placeholder(env[key])) errors.push(`${key}: ausente ou exemplo não substituído.`);
  }
  const publicKey = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || '';
  if (!publicKey || placeholder(publicKey)) errors.push('Chave pública Supabase: ausente ou exemplo não substituído.');
  else if (!publicKey.startsWith('sb_publishable_') && jwtPayload(publicKey).role !== 'anon') errors.push('Chave pública Supabase: formato/papel inesperado.');
  for (const [key, value] of Object.entries(env)) {
    if (key.startsWith('VITE_') && value && (/secret|service_role|password|token/i.test(key) || value.startsWith('sb_secret_') || jwtPayload(value).role === 'service_role' || value === env.SUPABASE_SERVICE_ROLE_KEY)) {
      errors.push('Variável VITE_* contém um possível segredo; revise localmente.');
      break;
    }
  }
  const serverKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (serverKey && !placeholder(serverKey) && !serverKey.startsWith('sb_secret_') && jwtPayload(serverKey).role !== 'service_role') errors.push('SUPABASE_SERVICE_ROLE_KEY: formato/papel inesperado.');
  const front = origin(env.VITE_SUPABASE_URL);
  const back = origin(env.SUPABASE_URL);
  if (!front || !back) errors.push('URLs Supabase: use origens HTTPS sem caminho, credenciais ou parâmetros.');
  else if (front !== back) errors.push('URLs Supabase: frontend e servidor apontam para projetos diferentes.');
  if (!origin(env.APP_URL)) errors.push('APP_URL: use a origem HTTPS do ambiente.');
  if (env.STUDIODESK_ENV === 'staging') {
    const production = origin(env.STUDIODESK_PRODUCTION_SUPABASE_URL);
    if (!production) errors.push('Staging: informe STUDIODESK_PRODUCTION_SUPABASE_URL para comparar isolamento.');
    else if (front === production || back === production) errors.push('Staging está apontando para o banco de produção.');
  } else if (env.STUDIODESK_ENV !== 'production') {
    errors.push('STUDIODESK_ENV: informe staging ou production para esta verificação.');
  }
  for (const [key, value] of [['pública', publicKey], ['servidor', serverKey]]) {
    const ref = jwtPayload(value).ref;
    if (ref && front && new URL(front).hostname.endsWith('.supabase.co') && new URL(front).hostname.split('.')[0] !== ref) errors.push(`Chave ${key}: referência JWT difere da URL Supabase.`);
  }
  if (!env.LEADS_WEBHOOK_SECRET || placeholder(env.LEADS_WEBHOOK_SECRET) || env.LEADS_WEBHOOK_SECRET.length < 32) warnings.push('Webhook: configure segredo aleatório de pelo menos 32 caracteres antes de habilitar a integração.');
  warnings.push('Verificação estática: não autentica chaves, não consulta o banco e não comprova RLS ou isolamento efetivo.');
  return { ok: errors.length === 0, errors, warnings };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const report = checkEnv(process.env);
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.ok ? 0 : 1;
}
