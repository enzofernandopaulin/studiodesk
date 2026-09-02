import React from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { User, Building2, Check, ArrowRight, Sparkles, Layers } from 'lucide-react';
import { PlanType } from '../../types';
import { PLANS_LIST } from '../../data/plans';

export const ProfileSelection: React.FC = () => {
  const { user, setUser, setPlan, setCurrentView, addToast } = useApp();

  const handleSelect = (selectedPlan: PlanType) => {
    setPlan(selectedPlan);
    setUser(prev => ({ ...prev, plan: selectedPlan }));
    addToast(
      'info',
      `Perfil ${selectedPlan.toUpperCase()} Selecionado`,
      'Vamos personalizar seu onboarding com as melhores práticas para sua rotina.'
    );
    setCurrentView('onboarding');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-[#66acd7]/30">
      <div className="w-full max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <Logo size="lg" className="mx-auto" />
          <h1 className="font-display text-3xl sm:text-4xl font-black text-[#111111] uppercase tracking-tight pt-2">
            Escolha seu Plano & Perfil de Operação
          </h1>
          <p className="text-sm text-[#6B7280] max-w-lg mx-auto">
            Sua escolha ajusta automaticamente a capacidade da equipe, a estrutura do Kanban e os recursos do StudioDesk.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS_LIST.map((p) => {
            const isSelected = user.plan === p.id || (user.plan === 'individual' && p.id === 'solo');
            const isDark = p.id === 'studio' || p.id === 'empresa';

            return (
              <div
                key={p.id}
                onClick={() => handleSelect(p.id)}
                className={`p-6 rounded-3xl border-2 transition-all cursor-pointer hover:shadow-xl group flex flex-col justify-between space-y-5 ${
                  p.id === 'studio'
                    ? 'bg-[#111111] text-white border-[#66acd7] ring-2 ring-[#66acd7]/30 relative'
                    : 'bg-white text-[#111111] border-[#DDE3E8] hover:border-[#66acd7]'
                }`}
                id={`profile-card-${p.id}`}
              >
                {p.popular && (
                  <div className="absolute top-3 right-3">
                    <span className="bg-[#66acd7] text-[#111111] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                      Mais Escolhido
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{p.icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      p.id === 'studio' ? 'bg-white/10 text-[#66acd7]' : 'bg-[#F5F7F9] text-[#6B7280]'
                    }`}>
                      {p.userLimitText}
                    </span>
                  </div>

                  <div>
                    <h3 className={`font-display text-xl font-black uppercase ${p.id === 'studio' ? 'text-white' : 'text-[#111111]'}`}>
                      {p.name}
                    </h3>
                    <p className={`text-xs font-semibold ${p.id === 'studio' ? 'text-[#66acd7]' : 'text-[#2F6F9C]'}`}>
                      {p.targetAudience}
                    </p>
                  </div>

                  <div className={`py-2 border-y ${p.id === 'studio' ? 'border-white/10' : 'border-[#DDE3E8]'}`}>
                    <span className={`text-2xl font-black font-display ${p.id === 'studio' ? 'text-[#66acd7]' : 'text-[#111111]'}`}>
                      {p.priceFormatted}
                    </span>
                    <span className={`text-xs ${p.id === 'studio' ? 'text-gray-400' : 'text-[#6B7280]'}`}>/mês</span>
                  </div>

                  <p className={`text-xs leading-relaxed line-clamp-2 ${p.id === 'studio' ? 'text-gray-300' : 'text-[#6B7280]'}`}>
                    {p.description}
                  </p>

                  <div className="space-y-1.5 text-xs pt-1">
                    {p.features.slice(0, 3).map((feat, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${p.id === 'studio' ? 'text-[#66acd7]' : 'text-emerald-600'}`} />
                        <span className={`text-[11px] leading-tight ${p.id === 'studio' ? 'text-gray-200' : 'text-[#111111]'}`}>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  className={`w-full font-bold text-xs py-3 rounded-xl transition-colors flex items-center justify-center gap-1.5 ${
                    p.id === 'studio'
                      ? 'bg-[#66acd7] hover:bg-[#529dc9] text-[#111111]'
                      : 'bg-[#F5F7F9] group-hover:bg-[#111111] text-[#111111] group-hover:text-white'
                  }`}
                >
                  <span>Selecionar {p.name}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <button
            onClick={() => setCurrentView('landing')}
            className="text-xs text-[#6B7280] hover:text-[#111111] font-semibold"
          >
            ← Voltar para a página inicial
          </button>
        </div>
      </div>
    </div>
  );
};
