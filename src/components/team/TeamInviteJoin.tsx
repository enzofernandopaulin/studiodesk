import React, { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { callServerApi } from '../../lib/serverApi';
import { supabase } from '../../lib/supabase';

export const TeamInviteJoin: React.FC = () => {
  const { isAuthenticated, authReady, setCurrentView, addToast } = useApp();
  const token = new URLSearchParams(window.location.search).get('team_invite');
  const attempted = useRef(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (!token || !authReady) return;
    if (!isAuthenticated) { setCurrentView('auth'); return; }
    if (attempted.current) return;
    attempted.current = true;
    setJoining(true);
    void callServerApi<{ joined: true }>('/api/team/join', {
      method: 'POST', body: JSON.stringify({ token }),
    }).then(async () => {
      sessionStorage.setItem('studiodesk_team_joined', '1');
      await supabase?.auth.signOut({ scope: 'local' });
      window.location.replace(window.location.origin);
    }).catch(error => {
      setJoining(false);
      addToast('error', 'Não foi possível entrar', error instanceof Error ? error.message : 'Convite inválido.');
    });
  }, [token, authReady, isAuthenticated, setCurrentView, addToast]);

  useEffect(() => {
    if (sessionStorage.getItem('studiodesk_team_joined') !== '1') return;
    sessionStorage.removeItem('studiodesk_team_joined');
    addToast('success', 'Equipe vinculada', 'Faça login para abrir o workspace da sua equipe.');
  }, [addToast]);

  if (!token) return null;
  if (!joining) return <div className="fixed inset-x-0 top-0 z-[110] flex items-center justify-center gap-2 bg-[#111111] px-4 py-3 text-center text-xs font-bold text-white"><Users className="h-4 w-4 text-[#66acd7]" />Faça login ou crie uma conta para entrar nesta equipe.</div>;
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"><div className="rounded-3xl bg-white p-8 text-center shadow-2xl"><Users className="mx-auto mb-3 h-8 w-8 text-[#2F6F9C]" /><p className="font-bold text-[#111111]">Entrando na equipe...</p></div></div>;
};
