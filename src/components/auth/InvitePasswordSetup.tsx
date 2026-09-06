import React, { useEffect, useState } from 'react';
import { Lock, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useApp } from '../../context/AppContext';

export const InvitePasswordSetup: React.FC = () => {
  const { addToast } = useApp();
  const [isInvite, setIsInvite] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    const inspect = async () => {
      const { data } = await supabase.auth.getSession();
      setIsInvite(Boolean(data.session?.user.user_metadata?.invited_workspace_id));
    };
    void inspect();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsInvite(Boolean(session?.user.user_metadata?.invited_workspace_id));
    });
    return () => subscription.unsubscribe();
  }, []);

  if (!isInvite) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 8) return setError('Use uma senha com pelo menos 8 caracteres.');
    if (password !== confirmation) return setError('As duas senhas precisam ser iguais.');
    if (!supabase) return setError('Supabase não está configurado.');
    setSubmitting(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const metadata = sessionData.session?.user.user_metadata ?? {};
    const { error: updateError } = await supabase.auth.updateUser({
      password,
      data: { ...metadata, invited_workspace_id: null, invitation_accepted: true },
    });
    setSubmitting(false);
    if (updateError) return setError(updateError.message);
    setIsInvite(false);
    addToast('success', 'Convite aceito', 'Sua senha foi criada e o acesso à equipe está ativo.');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#66acd7]/15">
          <Lock className="h-6 w-6 text-[#2F6F9C]" />
        </div>
        <h2 className="font-display text-2xl font-black uppercase text-[#111111]">Aceitar convite</h2>
        <p className="mt-1 text-sm text-[#6B7280]">Crie sua senha para acessar o workspace da equipe.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Nova senha" className="w-full rounded-xl border border-[#DDE3E8] bg-[#F5F7F9] px-4 py-3 text-sm outline-none focus:bg-white" />
          <input type="password" required value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Confirmar nova senha" className="w-full rounded-xl border border-[#DDE3E8] bg-[#F5F7F9] px-4 py-3 text-sm outline-none focus:bg-white" />
          {error && <p className="rounded-xl bg-rose-50 p-3 text-xs font-semibold text-rose-700">{error}</p>}
          <button disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111111] px-4 py-3 text-sm font-bold text-white disabled:bg-gray-400">
            <CheckCircle2 className="h-4 w-4 text-[#66acd7]" />
            {submitting ? 'Salvando...' : 'Criar senha e entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};
