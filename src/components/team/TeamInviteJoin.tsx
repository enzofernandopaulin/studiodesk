import React, { useEffect, useState } from 'react';
import { Building2, LogIn, Plus, Users, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { callServerApi } from '../../lib/serverApi';

type InvitePreview = {
  workspaceName: string;
  role: 'admin' | 'gestor' | 'colaborador';
  expiresAt: string;
  emailRestricted: boolean;
};

const roleLabel: Record<InvitePreview['role'], string> = {
  admin: 'Administrador',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
};

function clearInviteUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete('team_invite');
  window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
}

function resumeDashboard() {
  sessionStorage.setItem('studiodesk_resume_view', 'dashboard');
  window.location.replace(window.location.origin);
}

export const TeamInviteJoin: React.FC = () => {
  const { isAuthenticated, authReady, setCurrentView, addToast, user } = useApp();
  const token = new URLSearchParams(window.location.search).get('team_invite');
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(Boolean(token));
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    setLoadingPreview(true);
    fetch(`/api/team/invitations?token=${encodeURIComponent(token)}`)
      .then(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload?.error || 'Não foi possível consultar o convite.');
        return payload as InvitePreview;
      })
      .then(setPreview)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Convite inválido.'))
      .finally(() => setLoadingPreview(false));
  }, [token]);

  useEffect(() => {
    if (!token || !authReady || isAuthenticated) return;
    setCurrentView('auth');
  }, [token, authReady, isAuthenticated, setCurrentView]);

  if (!token) return null;
  if (!authReady || loadingPreview) {
    return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="rounded-3xl bg-white p-8 text-center shadow-2xl"><Users className="mx-auto mb-3 h-8 w-8 animate-pulse text-[#2F6F9C]" /><p className="font-bold text-[#111111]">Carregando convite...</p></div></div>;
  }
  if (!isAuthenticated) {
    return <div className="fixed inset-x-0 top-0 z-[110] flex items-center justify-center gap-2 bg-[#111111] px-4 py-3 text-center text-xs font-bold text-white"><Users className="h-4 w-4 text-[#66acd7]" />Faça login ou crie uma conta. Depois você poderá escolher se entra na equipe.</div>;
  }

  const keepCurrent = () => {
    clearInviteUrl();
    setCurrentView('dashboard');
    addToast('info', 'Convite mantido separado', 'Você continuou no seu workspace atual.');
  };

  const joinTeam = async () => {
    if (!preview) return;
    setWorking(true);
    try {
      await callServerApi('/api/team/join', { method: 'POST', body: JSON.stringify({ token }) });
      clearInviteUrl();
      addToast('success', 'Equipe vinculada', `Agora você está no workspace ${preview.workspaceName}.`);
      resumeDashboard();
    } catch (reason) {
      setWorking(false);
      setError(reason instanceof Error ? reason.message : 'Não foi possível entrar na equipe.');
    }
  };

  const createWorkspace = async () => {
    const suggested = user.companyName && user.companyName !== preview?.workspaceName ? user.companyName : '';
    const name = window.prompt('Qual será o nome do seu novo workspace?', suggested);
    if (!name?.trim()) return;
    setWorking(true);
    try {
      await callServerApi('/api/workspaces', { method: 'POST', body: JSON.stringify({ name: name.trim() }) });
      clearInviteUrl();
      addToast('success', 'Workspace criado', `${name.trim()} agora é seu workspace ativo.`);
      resumeDashboard();
    } catch (reason) {
      setWorking(false);
      setError(reason instanceof Error ? reason.message : 'Não foi possível criar o workspace.');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C]">Convite de equipe</p><h2 className="mt-1 text-2xl font-black text-[#111111]">Escolha onde trabalhar</h2></div>
          <button onClick={keepCurrent} disabled={working} className="rounded-lg p-2 text-[#6B7280] hover:bg-[#F5F7F9]" aria-label="Fechar convite"><X className="h-5 w-5" /></button>
        </div>

        {error ? <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div> : null}

        {preview ? (
          <div className="mt-5 rounded-2xl border border-[#66acd7]/40 bg-[#66acd7]/10 p-4">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-white p-2 text-[#2F6F9C]"><Users className="h-5 w-5" /></div><div><p className="font-bold text-[#111111]">{preview.workspaceName}</p><p className="text-xs text-[#6B7280]">Acesso como {roleLabel[preview.role]}</p></div></div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3">
          <button onClick={joinTeam} disabled={working || !preview} className="flex items-center justify-between rounded-2xl bg-[#111111] px-5 py-4 text-left text-white transition-colors hover:bg-[#2F6F9C] disabled:cursor-not-allowed disabled:opacity-50"><span><strong className="block text-sm">Entrar nesta equipe</strong><span className="text-xs text-white/70">Vincula sua conta sem apagar seus outros workspaces.</span></span><LogIn className="h-5 w-5 text-[#66acd7]" /></button>
          <button onClick={keepCurrent} disabled={working} className="flex items-center justify-between rounded-2xl border border-[#DDE3E8] px-5 py-4 text-left transition-colors hover:bg-[#F5F7F9] disabled:opacity-50"><span><strong className="block text-sm text-[#111111]">Continuar no meu workspace</strong><span className="text-xs text-[#6B7280]">Não aceita este convite agora.</span></span><Building2 className="h-5 w-5 text-[#2F6F9C]" /></button>
          <button onClick={createWorkspace} disabled={working} className="flex items-center justify-between rounded-2xl border border-[#DDE3E8] px-5 py-4 text-left transition-colors hover:bg-[#F5F7F9] disabled:opacity-50"><span><strong className="block text-sm text-[#111111]">Criar um workspace próprio</strong><span className="text-xs text-[#6B7280]">Cria outro ambiente e o torna ativo.</span></span><Plus className="h-5 w-5 text-[#2F6F9C]" /></button>
        </div>
      </div>
    </div>
  );
};
