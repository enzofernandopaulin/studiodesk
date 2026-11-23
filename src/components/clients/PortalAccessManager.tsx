import React, { useEffect, useState } from 'react';
import { Check, Copy, KeyRound, Link2, ShieldOff, UserRoundCheck } from 'lucide-react';
import { callServerApi } from '../../lib/serverApi';
import type { Project } from '../../types';

type Access = { id: string; project_id: string; client_id: string; is_active: boolean; created_at: string; updated_at: string };
type Provisioned = { accessCode: string; portalUrl: string };
interface Props { clientId: string; projects: Project[]; }

export const PortalAccessManager: React.FC<Props> = ({ clientId, projects }) => {
  const [accesses, setAccesses] = useState<Access[]>([]);
  const [credentials, setCredentials] = useState<Record<string, Provisioned>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const load = async () => {
    try {
      const result = await callServerApi<{ accesses: Access[] }>(`/api/portal/access?clientId=${encodeURIComponent(clientId)}`);
      setAccesses(result.accesses || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os acessos do Portal.'); }
  };
  useEffect(() => { void load(); }, [clientId]);
  const provision = async (project: Project) => {
    setBusy(project.id); setMessage('');
    try {
      const result = await callServerApi<Provisioned>('/api/portal/access', { method: 'POST', body: JSON.stringify({ projectId: project.id, clientId }) });
      setCredentials(previous => ({ ...previous, [project.id]: { accessCode: result.accessCode, portalUrl: result.portalUrl } }));
      await load();
      setMessage('Acesso gerado. Copie o link e o código e envie ao cliente por um canal seguro.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível gerar o acesso.'); }
    finally { setBusy(null); }
  };
  const revoke = async (access: Access) => {
    setBusy(access.id); setMessage('');
    try { await callServerApi('/api/portal/access', { method: 'DELETE', body: JSON.stringify({ accessId: access.id }) }); await load(); setCredentials(previous => { const next = { ...previous }; delete next[access.project_id]; return next; }); setMessage('Acesso revogado e sessões encerradas.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível revogar o acesso.'); }
    finally { setBusy(null); }
  };
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); setMessage('Copiado para a área de transferência.'); };
  return <section className="rounded-2xl border border-[#DDE3E8] bg-white p-5 shadow-2xs sm:p-6"><div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><UserRoundCheck className="h-5 w-5 text-[#2F6F9C]" /><h3 className="font-display text-base font-black uppercase tracking-tight">Acesso ao Portal do Cliente</h3></div><p className="mt-1 text-xs leading-5 text-[#6B7280]">Gere um link individual por projeto e um código de acesso. O código é mostrado somente nesta tela após a geração.</p></div><Link2 className="h-5 w-5 shrink-0 text-[#66acd7]" /></div>{message && <p className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-semibold text-[#2F6F9C]">{message}</p>}<div className="mt-5 space-y-3">{projects.length === 0 ? <p className="rounded-xl border border-dashed border-[#DDE3E8] p-4 text-center text-xs text-[#6B7280]">Cadastre um projeto para liberar o Portal.</p> : projects.map(project => { const access = accesses.find(item => item.project_id === project.id); const credential = credentials[project.id]; return <div key={project.id} className="rounded-xl border border-[#DDE3E8] bg-[#F8FAFC] p-4"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><div><p className="text-sm font-bold">{project.title}</p><p className="mt-1 text-[11px] text-[#6B7280]">{access?.is_active ? 'Acesso ativo' : access ? 'Acesso revogado' : 'Sem acesso provisionado'}</p></div><div className="flex flex-wrap gap-2">{access?.is_active && <button type="button" disabled={busy === access.id} onClick={() => void revoke(access)} className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"><ShieldOff className="h-3.5 w-3.5" />{busy === access.id ? 'Revogando...' : 'Revogar acesso'}</button>}<button type="button" disabled={busy === project.id} onClick={() => void provision(project)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#111111] px-3 py-2 text-xs font-bold text-white hover:bg-[#2F6F9C] disabled:opacity-50"><KeyRound className="h-3.5 w-3.5 text-[#66acd7]" />{busy === project.id ? 'Gerando...' : access?.is_active ? 'Gerar novo acesso' : 'Gerar acesso'}</button></div></div>{credential && <div className="mt-3 grid gap-2 rounded-xl border border-[#B9D8EA] bg-white p-3 text-xs sm:grid-cols-[1fr_auto]"><div className="min-w-0"><p className="font-bold text-[#2F6F9C]">Link individual</p><p className="mt-1 truncate text-[#6B7280]">{credential.portalUrl}</p><p className="mt-3 font-bold text-[#2F6F9C]">Código de acesso</p><p className="mt-1 font-mono font-bold tracking-wider text-[#111111]">{credential.accessCode}</p></div><button type="button" onClick={() => void copy(`Link: ${credential.portalUrl}\nCódigo: ${credential.accessCode}`)} className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#DDE3E8] px-3 py-2 font-bold hover:bg-[#F5F7F9]"><Copy className="h-3.5 w-3.5" />Copiar</button></div>}</div>; })}</div></section>;
};
