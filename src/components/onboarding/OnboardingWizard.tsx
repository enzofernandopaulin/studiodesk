import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  User, 
  Mail, 
  Image as ImageIcon, 
  Building2, 
  Film, 
  Megaphone, 
  Share2, 
  Laptop, 
  Sparkles, 
  LayoutTemplate,
  Layers,
  Columns3,
  Globe,
  Users,
  MessageSquare
} from 'lucide-react';

export const OnboardingWizard: React.FC = () => {
  const { user, setUser, setCurrentView, addToast, setKanbanColumns } = useApp();
  const [step, setStep] = useState(1);

  // Form states initialized with current user profile
  const [name, setName] = useState(user.name || '');
  const [email, setEmail] = useState(user.email || '');
  const [avatar, setAvatar] = useState(user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80');
  const [businessType, setBusinessType] = useState(user.businessType || 'Agência');
  const [teamSize, setTeamSize] = useState(user.teamSize || (user.plan === 'individual' ? '1' : '6–10'));
  const [objectives, setObjectives] = useState<string[]>(user.objectives || [
    'Organizar clientes',
    'Gerenciar projetos',
    'Usar Kanban',
    'Captar leads',
    'Integrar meu site',
    'Centralizar comunicação'
  ]);
  const [template, setTemplate] = useState(user.template || 'Audiovisual');

  const businessTypes = [
    { label: 'Agência', icon: Building2, desc: 'Agência de marketing ou publicidade' },
    { label: 'Produtora', icon: Film, desc: 'Produção e pós-produção audiovisual' },
    { label: 'Marketing', icon: Megaphone, desc: 'Equipes internas e consultoria' },
    { label: 'Social Media', icon: Share2, desc: 'Criação e gestão de conteúdo' },
    { label: 'Freelancer', icon: Laptop, desc: 'Profissional independente / criativo' },
    { label: 'Outro', icon: Sparkles, desc: 'Outros segmentos de serviços' }
  ];

  const teamSizes = ['1', '2–5', '6–10', '10+'];

  const allObjectives = [
    { id: 'clientes', label: 'Organizar clientes', desc: 'Centralizar histórico e dados de contato' },
    { id: 'projetos', label: 'Gerenciar projetos', desc: 'Acompanhar prazos e entregas' },
    { id: 'kanban', label: 'Usar Kanban', desc: 'Visualizar produção em colunas de status' },
    { id: 'leads', label: 'Captar leads', desc: 'Receber oportunidades do formulário do site' },
    { id: 'site', label: 'Integrar meu site', desc: 'Conectar vitrine digital ao fluxo do CRM' },
    { id: 'equipe', label: 'Organizar equipe', desc: 'Atribuir responsáveis e tarefas' },
    { id: 'comunicacao', label: 'Centralizar comunicação', desc: 'Evitar mensagens e áudios soltos' }
  ];

  const templates = [
    {
      id: 'Audiovisual',
      name: 'Fluxo Audiovisual',
      desc: 'Briefing → Roteiro → Gravação → Edição → Revisão → Aprovação → Entrega',
      columns: [
        { id: 'col_briefing', title: 'BRIEFING & ROTEIRO', color: '#66acd7', order: 0 },
        { id: 'col_producao', title: 'GRAVAÇÃO / PRODUÇÃO', color: '#2F6F9C', order: 1 },
        { id: 'col_edicao', title: 'EDIÇÃO & MOTION', color: '#8B5CF6', order: 2 },
        { id: 'col_revisao', title: 'REVISÃO INTERNA', color: '#F59E0B', order: 3 },
        { id: 'col_aprovacao', title: 'APROVAÇÃO DO CLIENTE', color: '#EC4899', order: 4 },
        { id: 'col_concluido', title: 'ENTREGA & CONCLUÍDO', color: '#10B981', order: 5 },
      ]
    },
    {
      id: 'Marketing',
      name: 'Campanhas de Marketing',
      desc: 'Planejamento → Criação → Copy & Design → Aprovação → Veiculação → Relatório',
      columns: [
        { id: 'col_plan', title: 'PLANEJAMENTO', color: '#66acd7', order: 0 },
        { id: 'col_copy', title: 'COPY & DESIGN', color: '#2F6F9C', order: 1 },
        { id: 'col_aprov', title: 'APROVAÇÃO', color: '#EC4899', order: 2 },
        { id: 'col_veic', title: 'VEICULAÇÃO', color: '#8B5CF6', order: 3 },
        { id: 'col_concl', title: 'CONCLUÍDO', color: '#10B981', order: 4 },
      ]
    },
    {
      id: 'Social Media',
      name: 'Calendário de Social Media',
      desc: 'Ideias → Roteiro/Artes → Aprovação do Cliente → Agendado → Publicado',
      columns: [
        { id: 'col_ideias', title: 'IDEIAS DE CONTEÚDO', color: '#66acd7', order: 0 },
        { id: 'col_artes', title: 'ROTEIRO & ARTES', color: '#8B5CF6', order: 1 },
        { id: 'col_aprov_sm', title: 'APROVAÇÃO', color: '#EC4899', order: 2 },
        { id: 'col_agendado', title: 'AGENDADO', color: '#2F6F9C', order: 3 },
        { id: 'col_publicado', title: 'PUBLICADO', color: '#10B981', order: 4 },
      ]
    },
    {
      id: 'Projetos gerais',
      name: 'Projetos Gerais (Tradicional)',
      desc: 'A Fazer → Em Andamento → Em Revisão → Bloqueado → Concluído',
      columns: [
        { id: 'col_todo', title: 'A FAZER', color: '#66acd7', order: 0 },
        { id: 'col_doing', title: 'EM ANDAMENTO', color: '#2F6F9C', order: 1 },
        { id: 'col_review', title: 'EM REVISÃO', color: '#F59E0B', order: 2 },
        { id: 'col_done', title: 'CONCLUÍDO', color: '#10B981', order: 3 },
      ]
    }
  ];

  const toggleObjective = (objLabel: string) => {
    setObjectives(prev => 
      prev.includes(objLabel) ? prev.filter(o => o !== objLabel) : [...prev, objLabel]
    );
  };

  const handleFinish = () => {
    // 1. Save user configurations
    setUser(prev => ({
      ...prev,
      name,
      email,
      avatar,
      businessType,
      teamSize,
      objectives,
      template
    }));

    // 2. Set selected Kanban columns template
    const selectedTpl = templates.find(t => t.id === template);
    if (selectedTpl && selectedTpl.columns) {
      setKanbanColumns(selectedTpl.columns);
    }

    addToast('success', 'StudioDesk Configurado', 'Seu espaço de trabalho foi configurado com sucesso!');
    setCurrentView('first_access');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#66acd7]/30">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="text-right">
            <span className="text-xs font-bold text-[#6B7280]">Etapa {step} de 6</span>
            <div className="w-32 h-1.5 bg-[#DDE3E8] rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#66acd7] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Wizard Card */}
        <div className="bg-white rounded-2xl border border-[#DDE3E8] shadow-xl p-5 sm:p-8 space-y-5" id="onboarding-step-card">
          {/* ETAPA 1 */}
          {step === 1 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-[#66acd7]/20 flex items-center justify-center text-[#2F6F9C] mx-auto">
                <Layers className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C] bg-[#66acd7]/15 px-3 py-1 rounded-full border border-[#66acd7]/30">
                  Bem-vindo ao StudioDesk
                </span>
                <h2 className="font-display text-3xl sm:text-4xl font-black text-[#111111] uppercase tracking-tight">
                  Vamos configurar seu StudioDesk.
                </h2>
                <p className="text-sm text-[#6B7280] max-w-md mx-auto leading-relaxed">
                  Em poucos passos rápidos, vamos personalizar o CRM, as colunas do Kanban e as integrações para se adaptarem perfeitamente à sua rotina criativa.
                </p>
              </div>

              <div className="p-4 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] text-xs text-[#111111] text-left space-y-2 max-w-md mx-auto">
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Configuração de Perfil e Agência</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Estruturação do Kanban (Briefing → Entrega)</span>
                </div>
                <div className="flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Preparação do Funil de Leads & Página Institucional</span>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all shadow-sm inline-flex items-center gap-2"
                id="onboarding-step1-next"
              >
                <span>Começar Configuração</span>
                <ArrowRight className="w-4 h-4 text-[#66acd7]" />
              </button>
            </div>
          )}

          {/* ETAPA 2 */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Etapa 2</span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight mt-0.5">
                  Seus dados principais
                </h2>
                <p className="text-xs text-[#6B7280]">Como você gostaria de ser identificado nos projetos e na equipe?</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Nome Completo</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Seu nome"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">E-mail Profissional</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu.email@empresa.com"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Foto / Avatar (URL)</label>
                  <div className="flex items-center gap-3">
                    <img
                      src={avatar}
                      alt="Preview"
                      className="w-12 h-12 rounded-xl object-cover border border-[#DDE3E8]"
                    />
                    <div className="relative flex-1">
                      <ImageIcon className="w-4 h-4 text-[#6B7280] absolute left-3 top-3" />
                      <input
                        type="text"
                        value={avatar}
                        onChange={e => setAvatar(e.target.value)}
                        placeholder="https://..."
                        className="w-full pl-9 pr-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ETAPA 3 */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Etapa 3</span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight mt-0.5">
                  Como você trabalha?
                </h2>
                <p className="text-xs text-[#6B7280]">Selecione a categoria que melhor representa o seu modelo de atuação.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {businessTypes.map(item => {
                  const Icon = item.icon;
                  const isSelected = businessType === item.label;
                  return (
                    <div
                      key={item.label}
                      onClick={() => setBusinessType(item.label)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#66acd7] bg-blue-50/50 shadow-xs'
                          : 'border-[#DDE3E8] bg-white hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#2F6F9C]' : 'text-[#6B7280]'}`} />
                      <h4 className="text-xs font-bold text-[#111111]">{item.label}</h4>
                      <p className="text-[10px] text-[#6B7280] mt-0.5 leading-tight">{item.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Etapa 4</span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight mt-0.5">
                  Quantas pessoas vão utilizar?
                </h2>
                <p className="text-xs text-[#6B7280]">Defina o tamanho aproximado da sua equipe de produção e atendimento.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {teamSizes.map(size => {
                  const isSelected = teamSize === size;
                  return (
                    <div
                      key={size}
                      onClick={() => setTeamSize(size)}
                      className={`p-6 rounded-2xl border-2 text-center cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#66acd7] bg-[#111111] text-white shadow-md'
                          : 'border-[#DDE3E8] bg-white text-[#111111] hover:border-gray-300'
                      }`}
                    >
                      <span className="font-display text-3xl font-black block">{size}</span>
                      <span className="text-[11px] font-semibold opacity-80 mt-1 block">
                        {size === '1' ? 'Pessoa (Solo)' : 'Usuários'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 5 */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Etapa 5</span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight mt-0.5">
                  Quais são seus principais objetivos?
                </h2>
                <p className="text-xs text-[#6B7280]">Marque todos os recursos que você deseja priorizar no StudioDesk.</p>
              </div>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allObjectives.map(obj => {
                  const isChecked = objectives.includes(obj.label);
                  return (
                    <div
                      key={obj.id}
                      onClick={() => toggleObjective(obj.label)}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isChecked
                          ? 'border-[#66acd7] bg-blue-50/40 text-[#111111]'
                          : 'border-[#DDE3E8] bg-white text-[#6B7280] hover:border-gray-300'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-bold text-[#111111] block">{obj.label}</span>
                        <span className="text-[11px] text-[#6B7280]">{obj.desc}</span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          isChecked ? 'bg-[#2F6F9C] border-[#2F6F9C] text-white' : 'border-[#DDE3E8] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ETAPA 6 */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Etapa 6</span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight mt-0.5">
                  Como você organiza seus projetos?
                </h2>
                <p className="text-xs text-[#6B7280]">Escolha um template inicial para as colunas do seu Kanban (você poderá personalizar a qualquer momento).</p>
              </div>

              <div className="space-y-3">
                {templates.map(tpl => {
                  const isSelected = template === tpl.id;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => setTemplate(tpl.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-[#66acd7] bg-blue-50/40 shadow-xs'
                          : 'border-[#DDE3E8] bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">{tpl.name}</span>
                        {isSelected && <span className="text-[10px] bg-[#66acd7] text-[#111111] font-black px-2 py-0.5 rounded">Selecionado</span>}
                      </div>
                      <p className="text-[11px] font-mono text-[#2F6F9C] mt-1.5 bg-white p-2 rounded-lg border border-[#DDE3E8]/80">
                        {tpl.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          {step > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-[#DDE3E8]">
              <button
                onClick={() => setStep(prev => Math.max(prev - 1, 1))}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6B7280] hover:text-[#111111] px-3 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>

              {step < 6 ? (
                <button
                  onClick={() => setStep(prev => prev + 1)}
                  className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
                >
                  <span>Próximo</span>
                  <ArrowRight className="w-4 h-4 text-[#66acd7]" />
                </button>
              ) : (
                <button
                  onClick={handleFinish}
                  className="bg-[#66acd7] hover:bg-[#529dc9] text-[#111111] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span>Concluir e Abrir StudioDesk</span>
                  <Check className="w-4 h-4 text-[#111111]" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
