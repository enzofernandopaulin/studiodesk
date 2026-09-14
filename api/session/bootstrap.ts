import { getAdminClient } from '../_lib/supabaseAdmin.js';

export default async function handler(request: any, response: any) {
  response.setHeader('Cache-Control', 'no-store');
  if (request.method !== 'POST') return response.status(405).json({ error: 'Método não permitido.' });
  try {
    const accessToken=String(request.headers?.authorization || '').replace(/^Bearer\s+/i,'').trim();
    const admin=getAdminClient();
    const {data:auth,error:authError}=await admin.auth.getUser(accessToken);
    if (authError || !auth.user) return response.status(401).json({error:'Sessão inválida.'});

    const metadata=auth.user.user_metadata || {};
    const {data,error}=await admin.rpc('bootstrap_studiodesk_user',{
      p_user_id:auth.user.id,
      p_name:String(metadata.name || auth.user.email?.split('@')[0] || '').trim().slice(0,160),
      p_email:String(auth.user.email || '').trim().slice(0,320),
      p_company_name:String(metadata.company_name || 'Meu Workspace').trim().slice(0,120),
    });
    if (error) throw error;
    const result=data as {ready:boolean;workspaceId:string};
    const {data:workspace,error:workspaceError}=await admin.from('workspaces').select('plan').eq('id',result.workspaceId).single();
    if (workspaceError) throw workspaceError;
    return response.status(200).json({...result,plan:workspace.plan});
  } catch(error) {
    console.error('POST /api/session/bootstrap failed',error);
    const message=error instanceof Error?error.message:'';
    if (/bootstrap_studiodesk_user|relation .* does not exist|schema cache/i.test(message)) {
      return response.status(503).json({error:'Execute a migration da Fase 3 no Supabase antes de publicar esta versão.'});
    }
    return response.status(500).json({error:'Não foi possível preparar o perfil e o workspace desta conta.'});
  }
}
