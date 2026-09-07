import React, { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown, Plus } from 'lucide-react';
import { callServerApi } from '../../lib/serverApi';
import { useApp } from '../../context/AppContext';

type Workspace = { id: string; name?: string; role: string };
type WorkspaceList = { activeWorkspaceId: string | null; workspaces: Workspace[] };

export const WorkspaceSwitcher: React.FC = () => {
  const { addToast, user } = useApp();
  const [data, setData] = useState<WorkspaceList | null>(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void callServerApi<WorkspaceList>('/api/workspaces')
      .then(setData)
      .catch(error => console.error('StudioDesk: falha ao listar workspaces', error));
  }, []);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const reloadDashboard = () => {
    sessionStorage.setItem('studiodesk_resume_view', 'dashboard');
    window.location.reload();
  };

  const selectWorkspace = async (workspace: Workspace) => {
    if (workspace.id === data?.activeWorkspaceId) return setOpen(false);
    setWorking(true);
    try {
      await callServerApi('/api/workspaces', { method: 'PATCH', body: JSON.stringify({ workspaceId: workspace.id }) });
      reloadDashboard();
    } catch (error) {
      setWorking(false);
      addToast('error', 'Não foi possível trocar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const createWorkspace = async () => {
    const name = window.prompt('Nome do novo workspace:', user.companyName || 'Meu workspace');
    if (!name?.trim()) return;
    setWorking(true);
    try {
      await callServerApi('/api/workspaces', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      reloadDashboard();
    } catch (error) {
      setWorking(false);
      addToast('error', 'Não foi possível criar', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const active = data?.workspaces.find(workspace => workspace.id === data.activeWorkspaceId);
  return (
    <div className="relative" ref={rootRef}>
      <button type="button" onClick={() => setOpen(value => !value)} disabled={working} className="flex max-w-44 items-center gap-1.5 rounded-xl border border-[#DDE3E8] bg-[#F5F7F9] px-2.5 py-1.5 text-xs font-semibold text-[#111111] hover:bg-gray-100 disabled:opacity-60" title="Trocar de workspace">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#2F6F9C]" />
        <span className="truncate">{active?.name || user.companyName || 'Workspace'}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#6B7280]" />
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-2xl border border-[#DDE3E8] bg-white p-2 shadow-xl">
          <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">Seus workspaces</p>
          <div className="max-h-56 overflow-y-auto">
            {(data?.workspaces || []).map(workspace => (
              <button key={workspace.id} onClick={() => void selectWorkspace(workspace)} className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left hover:bg-[#F5F7F9]">
                <span className="min-w-0"><span className="block truncate text-xs font-bold text-[#111111]">{workspace.name || 'Workspace sem nome'}</span><span className="block text-[10px] capitalize text-[#6B7280]">{workspace.role}</span></span>
                {workspace.id === data?.activeWorkspaceId ? <Check className="h-4 w-4 shrink-0 text-emerald-600" /> : null}
              </button>
            ))}
          </div>
          <button onClick={() => void createWorkspace()} className="mt-1 flex w-full items-center gap-2 rounded-xl border-t border-[#DDE3E8] px-3 py-2.5 text-left text-xs font-bold text-[#2F6F9C] hover:bg-[#F5F7F9]"><Plus className="h-4 w-4" />Criar novo workspace</button>
        </div>
      ) : null}
    </div>
  );
};
