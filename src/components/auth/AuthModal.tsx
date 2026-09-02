import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { ArrowRight, Lock, Mail, User, Building2, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { setCurrentView, addToast, signIn, signUp, isSupabaseConfigured } = useApp();
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!isSupabaseConfigured) {
      setAuthError('Supabase não está configurado. Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env.local e reinicie o Vite.');
      return;
    }

    if (password.length < 6) {
      setAuthError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isRegisterMode) {
        const result = await signUp(name.trim(), email.trim(), password, company.trim());
        if (result.error) {
          setAuthError(result.error);
          return;
        }
        if (result.needsEmailConfirmation) {
          addToast('info', 'Confirme seu e-mail', 'Sua conta foi criada. Abra o link enviado pelo Supabase e depois faça login.');
          setPassword('');
          setIsRegisterMode(false);
          return;
        }
        addToast('success', 'Conta criada', 'Cadastro concluído. Vamos configurar seu StudioDesk.');
      } else {
        const result = await signIn(email.trim(), password);
        if (result.error) {
          setAuthError(result.error);
          return;
        }
        addToast('success', 'Login realizado', 'Sua sessão foi autenticada com sucesso.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setAuthError('');
    setPassword('');
    setIsRegisterMode(prev => !prev);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#66acd7]/30">
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <Logo size="md" onClick={() => setCurrentView('landing')} />
        <button onClick={() => setCurrentView('landing')} className="text-xs text-[#6B7280] hover:text-[#111111] font-semibold">
          ← Voltar para o site
        </button>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl border border-[#DDE3E8] shadow-xl p-6 sm:p-8 space-y-6" id="auth-card">
        <div>
          <h2 className="font-display text-2xl font-black text-[#111111] uppercase tracking-tight">
            {isRegisterMode ? 'Criar Conta StudioDesk' : 'Acesse seu StudioDesk'}
          </h2>
          <p className="text-xs text-[#6B7280] mt-1">
            {isRegisterMode
              ? 'Crie sua conta real. O Supabase cuidará da autenticação e do workspace.'
              : 'Entre com o e-mail e a senha cadastrados no Supabase.'}
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex gap-2 items-start">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              <strong>Supabase não configurado.</strong><br />
              Configure o arquivo <code>.env.local</code> e reinicie <code>npm run dev</code>. O acesso local sem autenticação foi removido.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegisterMode && (
            <>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Seu Nome Completo</label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Nome da Empresa / Agência</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                  <input type="text" required value={company} onChange={e => setCompany(e.target.value)} placeholder="Nome da sua empresa"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu.email@empresa.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#111111] mb-1">Senha</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
              <input type="password" required minLength={6} autoComplete={isRegisterMode ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]" />
            </div>
          </div>

          {authError && <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">{authError}</div>}

          <button type="submit" disabled={isSubmitting || !isSupabaseConfigured}
            className="w-full bg-[#111111] hover:bg-[#2F6F9C] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 mt-2">
            <span>{isSubmitting ? 'Processando...' : isRegisterMode ? 'Criar conta' : 'Entrar no StudioDesk'}</span>
            <ArrowRight className="w-4 h-4 text-[#66acd7]" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#DDE3E8]">
          <button onClick={toggleMode} className="text-xs text-[#2F6F9C] hover:underline font-semibold">
            {isRegisterMode ? 'Já possui uma conta? Faça login aqui' : 'Ainda não tem conta? Criar cadastro gratuito'}
          </button>
        </div>

        {isSupabaseConfigured && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span><strong>Supabase conectado:</strong> autenticação e persistência estão habilitadas.</span>
          </div>
        )}
      </div>
    </div>
  );
};
