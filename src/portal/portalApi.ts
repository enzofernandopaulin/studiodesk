export type PortalData = {
  scope: { projectId: string; clientId: string; clientName: string; clientCompany: string };
  project: { id: string; title: string; description: string; status: string; column_id: string | null; progress: number; created_at: string };
  columns: Array<{ id: string; title: string; color: string; sort_order: number }>;
  tasks: Array<{ id: string; title: string; project_id: string | null; deadline: string | null; priority: string; description: string | null; completed: boolean; completed_at: string | null; created_at: string }>;
  approvals: Array<{ id: string; title: string; description: string; project_id: string | null; category: string; created_at: string; due_date: string | null; status: string; priority: string; file_type: string | null; has_file: boolean; feedback_notes: string | null; rejection_reason: string | null; revision_notes: string | null; reviewed_at: string | null }>;
  mediaApprovals: Array<{ id: string; title: string; version: string; status: string; has_video: boolean; has_thumbnail: boolean }>;
  comments: Array<{ id: string; approval_request_id: string | null; media_approval_id: string | null; author: string; author_role: string | null; comment_role: string | null; timestamp_value: string; timecode: string | null; text_value: string | null; content: string | null; resolved: boolean }>;
};
let csrfToken = '';
function cookie(name: string): string { return document.cookie.split('; ').find(value => value.startsWith(`${name}=`))?.slice(name.length + 1) || ''; }
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { ...init, credentials: 'include', headers: { 'content-type': 'application/json', ...(init.method && init.method !== 'GET' ? { 'x-csrf-token': csrfToken || cookie('studiodesk_portal_csrf') } : {}), ...(init.headers || {}) } });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error || 'Não foi possível concluir a solicitação.');
  return payload as T;
}
export async function login(accessKey: string, accessCode: string) { const result = await request<{ ok: true; csrfToken: string }>('/api/portal/login', { method: 'POST', body: JSON.stringify({ accessKey, accessCode }) }); csrfToken = result.csrfToken; return result; }
export async function loadPortalData() { return request<PortalData>('/api/portal/session'); }
export async function portalAction(approvalId: string, action: string, comment: string) { return request<{ ok: true }>('/api/portal/approval-action', { method: 'POST', body: JSON.stringify({ approvalId, action, comment }) }); }
export async function logout() { csrfToken = ''; return request<{ ok: true }>('/api/portal/logout', { method: 'POST' }); }
