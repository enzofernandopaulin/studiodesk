import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  User, 
  Building2, 
  Columns3, 
  Bell, 
  Shield, 
  Database, 
  Check, 
  Palette,
  Layers,
  Users,
  CreditCard,
  ArrowUpRight
} from 'lucide-react';
import { PLANS_LIST, getPlanDetails, PlanType } from '../../data/plans';

export const SettingsView: React.FC = () => {
  const { 
    user, 
    setUser, 
    kanbanColumns, 
    setKanbanColumns, 
    addToast
  } = useApp();

  const [userName, setUserName] = useState(user.name);
  const userEmail = user.email;
  const [companyName, setCompanyName] = useState(user.companyName);
  const [template, setTemplate] = useState(user.template || 'Audiovisual');

  const currentPlanDetails = getPlanDetails(user.plan);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setUser(prev => ({
      ...prev,
      name: userName,
      companyName,
      template
    }));
    addToast('success', 'Configurações Salvas', 'Perfil e dados da empresa atualizados com sucesso.');
  };


  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6" id="settings-view">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
          Configurações do StudioDesk
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Personalize seu perfil, parâmetros do sistema, modelo do Kanban e detalhes da assinatura.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile & Agency Form */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#2F6F9C]" />
              <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
                Dados do Usuário & Empresa
              </h3>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Seu Nome</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">E-mail</label>
                  <input
                    type="email"
                    value={userEmail}
                    readOnly
                    className="w-full px-3 py-2 bg-[#EEF1F4] border border-[#DDE3E8] rounded-xl text-xs text-[#6B7280] cursor-not-allowed"
                  />
                  <p className="text-[10px] text-[#6B7280] mt-1">O e-mail de acesso é gerenciado pelo Supabase Auth.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#111111] mb-1">Nome da Empresa / Agência</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-xs"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>

          {/* Kanban Columns Customizer */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Columns3 className="w-5 h-5 text-[#8B5CF6]" />
                <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
                  Colunas Ativas do Kanban
                </h3>
              </div>
              <span className="text-xs text-[#6B7280]">
                {kanbanColumns.length} etapas ativas
              </span>
            </div>

            <div className="space-y-2">
              {kanbanColumns.map((col, idx) => (
                <div key={col.id} className="p-3 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="font-bold text-[#111111]">{col.title}</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#6B7280]">Etapa {idx + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Plan Info and Brand Guide */}
        <div className="space-y-6">
          {/* Plan Info Card (Read-only status, no change plan options) */}
          <div className="p-5 sm:p-6 bg-[#111111] text-white rounded-2xl border border-[#2F6F9C] shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{currentPlanDetails.icon}</span>
                <span className="text-xs font-black uppercase bg-[#66acd7] text-[#111111] px-2.5 py-0.5 rounded-full">
                  Plano {currentPlanDetails.name}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[#66acd7]">
                {currentPlanDetails.priceFormatted}{currentPlanDetails.pricePeriod}
              </span>
            </div>

            <div>
              <h3 className="font-display text-xl font-black uppercase text-white">
                {currentPlanDetails.name}
              </h3>
              <p className="text-xs text-[#66acd7] font-semibold mt-0.5">
                {currentPlanDetails.targetAudience} ({currentPlanDetails.userLimitText})
              </p>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                {currentPlanDetails.description}
              </p>
            </div>

            {/* Capacity meter */}
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-300 font-medium">Capacidade de Usuários</span>
                <span className="font-bold text-white">
                  {user.plan === 'solo' || user.plan === 'individual' ? '1 / 1 usuário ativo' : `${currentPlanDetails.userLimitText}`}
                </span>
              </div>
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#66acd7] rounded-full"
                  style={{ width: `${Math.min(100, (currentPlanDetails.userLimit / 50) * 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
              <span>Status da Assinatura:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Ativo
              </span>
            </div>
          </div>

          {/* Brand Identity & Design System card */}
          <div className="p-5 sm:p-6 bg-white rounded-2xl border border-[#DDE3E8] shadow-2xs space-y-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-[#66acd7]" />
              <h3 className="font-display text-sm font-black text-[#111111] uppercase tracking-tight">
                Identidade Visual StudioDesk
              </h3>
            </div>

            <p className="text-xs text-[#6B7280]">
              Paleta oficial e tipografia inspirada na precisão e legibilidade Apple:
            </p>

            <div className="grid grid-cols-4 gap-1.5 text-center">
              <div className="p-2 bg-[#66acd7] text-black rounded-lg text-[10px] font-bold">#66acd7</div>
              <div className="p-2 bg-[#2F6F9C] text-white rounded-lg text-[10px] font-bold">#2F6F9C</div>
              <div className="p-2 bg-[#111111] text-white rounded-lg text-[10px] font-bold">#111111</div>
              <div className="p-2 bg-[#8B5CF6] text-white rounded-lg text-[10px] font-bold">#8B5CF6</div>
            </div>

            <div className="text-xs text-[#6B7280] space-y-1">
              <div><strong>SF Pro / System:</strong> Tipografia ultra-nítida e legível em qualquer escala</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
