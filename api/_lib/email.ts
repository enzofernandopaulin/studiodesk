import { createHash } from 'node:crypto';

type InviteEmail = {
  to: string;
  recipientName?: string;
  inviterName?: string;
  workspaceName: string;
  role: string;
  inviteUrl: string;
};

function cleanEnv(value: string | undefined): string {
  return (value || '').trim().replace(/^['"]|['"]$/g, '').trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  })[character] || character);
}

export async function sendInviteEmail(invite: InviteEmail): Promise<string> {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const from = cleanEnv(process.env.INVITE_FROM_EMAIL);
  if (!apiKey) throw new Error('RESEND_API_KEY_NOT_CONFIGURED');
  if (!from || !from.includes('@')) throw new Error('INVITE_FROM_EMAIL_NOT_CONFIGURED');

  const workspaceName = escapeHtml(invite.workspaceName);
  const recipient = escapeHtml(invite.recipientName || 'Olá');
  const inviter = escapeHtml(invite.inviterName || 'Um administrador');
  const role = escapeHtml(invite.role);
  const inviteUrl = escapeHtml(invite.inviteUrl);
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `workspace-invite/${createInviteKey(invite.inviteUrl)}`,
    },
    body: JSON.stringify({
      from,
      to: [invite.to],
      subject: `${invite.inviterName || 'StudioDesk'} convidou você para ${invite.workspaceName}`,
      html: `
        <div style="background:#f5f7f9;padding:32px 16px;font-family:Arial,sans-serif;color:#111">
          <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #dde3e8;border-radius:20px;padding:32px">
            <p style="margin:0 0 8px;color:#2f6f9c;font-size:12px;font-weight:700;text-transform:uppercase">Convite StudioDesk</p>
            <h1 style="margin:0 0 16px;font-size:24px">Você foi convidado para uma equipe</h1>
            <p style="line-height:1.6">${recipient}, <strong>${inviter}</strong> convidou você para o workspace <strong>${workspaceName}</strong>, com acesso de <strong>${role}</strong>.</p>
            <p style="line-height:1.6">O link funciona para quem já possui conta e também para quem ainda precisa criar uma.</p>
            <a href="${inviteUrl}" style="display:inline-block;margin-top:12px;background:#111;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:12px">Abrir convite</a>
            <p style="margin-top:24px;color:#6b7280;font-size:12px">O convite expira em 7 dias. Se você não esperava este e-mail, pode ignorá-lo.</p>
          </div>
        </div>`,
      text: `${invite.recipientName || 'Olá'}, ${invite.inviterName || 'um administrador'} convidou você para ${invite.workspaceName} como ${invite.role}. Abra o convite: ${invite.inviteUrl}`,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = typeof payload?.message === 'string' ? payload.message : `HTTP ${response.status}`;
    throw new Error(`RESEND_SEND_FAILED: ${detail}`);
  }
  return String(payload.id || 'sent');
}

function createInviteKey(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}
