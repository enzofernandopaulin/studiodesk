import { getAdminClient } from '../_lib/supabaseAdmin.js';
import { json, methodNotAllowed, sendWebResponse, serverError, toWebRequest } from '../_lib/http.js';
import { rateLimit, verifyHmacSignature } from '../_lib/security.js';
type Body = { name?: unknown; email?: unknown; phone?: unknown; whatsapp?: unknown; company?: unknown; serviceInterest?: unknown; source?: unknown; notes?: unknown; value?: unknown };
const text = (value: unknown, max = 500) => typeof value === 'string' ? value.trim().slice(0, max) : '';
function secrets(): Record<string,string> {
  try {
    const value=JSON.parse(process.env.LEADS_WEBHOOK_SECRETS_JSON || '{}');
    return Object.fromEntries(Object.entries(value).filter(([id,secret]) => /^[0-9a-f-]{36}$/i.test(id) && typeof secret === 'string' && secret.length >= 32)) as Record<string,string>;
  } catch { return {}; }
}
async function webHandler(request: Request): Promise<Response> {
  if (request.method !== 'POST') return methodNotAllowed(['POST']);
  const limited=rateLimit(request,30); if (limited) return limited;
  try {
    const workspaceId=text(request.headers.get('x-studiodesk-workspace-id'),36);
    const signature=text(request.headers.get('x-studiodesk-signature'),128);
    const secret=secrets()[workspaceId];
    if (!workspaceId || !secret) return json({error:'Webhook não configurado para este workspace.'},401);
    const raw=await request.text();
    if (new TextEncoder().encode(raw).byteLength > 64*1024) return json({error:'Payload muito grande.'},413);
    if (!verifyHmacSignature(raw,signature,secret)) return json({error:'Assinatura do webhook inválida.'},401);
    const body=JSON.parse(raw) as Body; const name=text(body.name,160);
    if (!name) return json({error:'name é obrigatório.'},400);
    const admin=getAdminClient();
    const {data:workspace,error:workspaceError}=await admin.from('workspaces').select('id').eq('id',workspaceId).maybeSingle();
    if (workspaceError) throw workspaceError; if (!workspace) return json({error:'Workspace não encontrado.'},404);
    const allowed=['Site Institucional','Instagram','Indicação','WhatsApp Direto','Google','Outro'] as const;
    const requested=text(body.source,60); const source=allowed.includes(requested as any)?requested as typeof allowed[number]:'Outro';
    const {data,error}=await admin.from('leads').insert({workspace_id:workspaceId,name,company:text(body.company,160),email:text(body.email,320),phone:text(body.phone,40),whatsapp:text(body.whatsapp,40),source,service_interest:text(body.serviceInterest,200),assigned_to:'',notes:text(body.notes,4000),status:'novo',value:typeof body.value==='number'&&Number.isFinite(body.value)?Math.max(0,body.value):null}).select('id,name,status,created_at').single();
    if (error) throw error; return json({received:true,lead:data},201);
  } catch(error) {
    if (error instanceof SyntaxError) return json({error:'JSON inválido.'},400);
    console.error('POST /api/webhooks/leads failed',error); return serverError();
  }
}
export default async function handler(request:any,response:any){return sendWebResponse(await webHandler(toWebRequest(request)),response);}
