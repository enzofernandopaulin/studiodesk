import React, { useEffect, useState } from 'react';
import { LogIn, UserRound } from 'lucide-react';
import { useApp } from '../../context/AppContext';

type Preview = { workspaceName: string; clientName: string; expiresAt: string };

export const ClientInviteJoin: React.FC = () => {
  const { authReady, isAuthenticated, currentView, setCurrentView, user, addToast } = useApp();
  const token = new URLSearchParams(window.location.search).get('client_invite');
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/team/invitations?resource=client&token=${encodeURIComponent(token)}`)
      .then(async response => { const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload?.error || 'Convite inválido.'); return payload as Preview; })
      .then(setPreview)
      .catch(reason => setError(reason instanceof Error ? reason.message : 'Convite inválido.'));
  }, [token]);

  useEffect(() => {
    if (!token || !authReady) return;
    if (!isAuthenticated) { setCurrentView('auth'); return; }
    if (user.role === 'cliente' && user.clientId) {
      const url = new URL(window.location.href); url.searchParams.delete('client_invite'); window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      addToast('success', 'Portal liberado', 'Sua conta agora está vinculada ao portal do cliente.');
    }
  }, [token, authReady, isAuthenticated, user.role, user.clientId, setCurrentView, addToast]);

  if (!token || (isAuthenticated && user.role === 'cliente' && user.clientId)) return null;
  if (!authReady || !preview) return <div className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 bg-[#111111] px-4 py-3 text-center text-xs font-bold text-white"><UserRound className="h-4 w-4 text-[#66acd7]" />{error || 'Validando convite do portal...'}</div>;
  return <div className="fixed inset-x-0 top-0 z-[120] flex items-center justify-center gap-2 bg-[#111111] px-4 py-3 text-center text-xs font-bold text-white"><LogIn className="h-4 w-4 text-[#66acd7]" />Faça login ou crie uma conta para acessar o portal de {preview.clientName} em {preview.workspaceName}.</div>;
};
