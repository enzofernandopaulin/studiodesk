import React from 'react';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AccessDenied: React.FC = () => {
  const { setCurrentView } = useApp();
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white border border-[#DDE3E8] rounded-3xl p-8 text-center shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="font-display text-xl font-black uppercase">Acesso restrito</h2>
        <p className="text-sm text-[#6B7280] mt-2">Seu perfil não possui permissão para acessar esta área.</p>
        <button onClick={() => setCurrentView('dashboard')} className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111111] text-white text-xs font-bold">
          <ArrowLeft className="w-4 h-4" /> Voltar ao dashboard
        </button>
      </div>
    </div>
  );
};
