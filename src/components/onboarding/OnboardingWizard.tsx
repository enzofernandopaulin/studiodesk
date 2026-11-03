import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { completeOnboarding } from '../../lib/workspaceRepository';
import { uploadProfileAvatar } from '../../lib/storageRepository';
import { Logo } from '../common/Logo';
import { ArrowRight, ArrowLeft, Check, User, Mail, Image as ImageIcon, Building2, Film, Megaphone, Share2, Laptop, Sparkles, Layers, Plus, Trash2 } from 'lucide-react';
import { getPlanDetails } from '../../data/plans';
import type { KanbanColumn } from '../../types';

export const OnboardingWizard: React.FC = () => {
  const { user, setUser, setCurrentView, addToast, setKanbanColumns, kanbanColumns } = useApp();
  const [step, setStep] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  // Form states initialized with current user profile
  const [name, setName] = useState(user.name || '');
  const [avatar, setAvatar] = useState(user.avatar || '');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [businessType, setBusinessType] = useState(user.businessType || 'Agência');
  const [template, setTemplate] = useState(user.template || 'Audiovisual');
  const [customColumns, setCustomColumns] = useState<KanbanColumn[]>(() => (
    user.template === 'Personalizado' && kanbanColumns.length
      ? kanbanColumns.map(column => ({ ...column }))
      : [
          { id: 'custom_1', title: 'A FAZER', color: '#66acd7', order: 0 },
          { id: 'custom_2', title: 'EM ANDAMENTO', color: '#2F6F9C', order: 1 },
          { id: 'custom_3', title: 'CONCLUÍDO', color: '#10B981', order: 2 },
        ]
  ));

  const businessTypes = [
    { label: 'Agência', icon: Building2, desc: 'Agência de marketing ou publicidade' },
    { label: 'Produtora', icon: Film, desc: 'Produção e pós-produção audiovisual' },
    { label: 'Marketing', icon: Megaphone, desc: 'Equipes internas e consultoria' },
    { label: 'Social Media', icon: Share2, desc: 'Criação e gestão de conteúdo' },
    { label: 'Freelancer', icon: Laptop, desc: 'Profissional independente / criativo' },
    { label: 'Outro', icon: Sparkles, desc: 'Outros segmentos de serviços' }
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

  const handleAvatarUpload = async (file?: File) => {
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const url = await uploadProfileAvatar(user.id, file);
      setAvatar(url);
      addToast('success', 'Foto enviada', 'A foto foi salva no Supabase Storage.');
    } catch (error) {
      addToast('error', 'Foto não enviada', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleFinish = async () => {
    const completedUser = {
      ...user,
      name,
      email: user.email,
      avatar,
      businessType,
      // Mantém compatibilidade com o campo legado do banco; a capacidade real
      // é determinada exclusivamente pelo plano, nunca por uma resposta manual.
      teamSize: String(getPlanDetails(user.plan).userLimit),
      objectives: [],
      template
    };

    const selectedTpl = templates.find(t => t.id === template);
    const selectedColumns: KanbanColumn[] = template === 'Personalizado'
      ? customColumns.map((column, order) => ({ ...column, title: column.title.trim().toUpperCase(), order }))
      : (selectedTpl?.columns || []);
    if (!name.trim()) {
      addToast('error', 'Nome obrigatório', 'Informe seu nome para continuar.');
      return;
    }
    if (selectedColumns.length < 3 || selectedColumns.length > 12 || selectedColumns.some(column => !column.title.trim())) {
      addToast('error', 'Kanban inválido', 'Use entre 3 e 12 colunas e preencha todos os nomes.');
      return;
    }
    if (new Set(selectedColumns.map(column => column.title.trim().toLocaleLowerCase('pt-BR'))).size !== selectedColumns.length) {
      addToast('error', 'Nomes repetidos', 'Cada coluna do Kanban precisa ter um nome diferente.');
      return;
    }
    setIsFinishing(true);
    try {
      // Perfil e Kanban são confirmados na mesma transação do Supabase.
      await completeOnboarding(completedUser, selectedColumns);
    } catch (error) {
      setIsFinishing(false);
      addToast('error', 'Configuração não salva', error instanceof Error ? error.message : 'Tente novamente.');
      return;
    }

    setUser(completedUser);

    if (selectedColumns.length) setKanbanColumns(selectedColumns);

    addToast('success', 'StudioDesk Configurado', 'Seu espaço de trabalho foi configurado com sucesso!');
    setCurrentView('first_access');
    setIsFinishing(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-[#66acd7]/30">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Logo size="md" />
          <div className="text-right">
            <span className="text-xs font-bold text-[#6B7280]">Etapa {step} de 4</span>
            <div className="w-32 h-1.5 bg-[#DDE3E8] rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-[#66acd7] transition-all duration-300 rounded-full"
                style={{ width: `${(step / 4) * 100}%` }}
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
                      required
                      maxLength={160}
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
                      value={user.email}
                      readOnly
                      aria-readonly="true"
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-100 border border-[#DDE3E8] rounded-xl text-xs text-[#6B7280] cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-[#6B7280]">E-mail vinculado à sua conta; não precisa ser preenchido novamente.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#111111] mb-1">Foto do perfil (opcional)</label>
                  <div className="flex items-center gap-3">
                    {avatar ? (
                      <img src={avatar} alt="Prévia da foto" className="w-14 h-14 rounded-xl object-cover border border-[#DDE3E8]" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-[#F5F7F9] border border-[#DDE3E8] flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-[#6B7280]" />
                      </div>
                    )}
                    <label className="flex-1 cursor-pointer rounded-xl border border-[#DDE3E8] bg-[#F5F7F9] px-4 py-3 text-center text-xs font-bold text-[#111111] hover:border-[#66acd7]">
                      {isUploadingAvatar ? 'Enviando foto...' : avatar ? 'Trocar imagem' : 'Escolher imagem'}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        disabled={isUploadingAvatar}
                        className="hidden"
                        onChange={event => {
                          void handleAvatarUpload(event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <p className="mt-1 text-[10px] text-[#6B7280]">JPG, PNG ou WEBP, com até 5 MB. A imagem fica no Storage, não no banco.</p>
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
                <div
                  onClick={() => setTemplate('Personalizado')}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    template === 'Personalizado' ? 'border-[#66acd7] bg-blue-50/40 shadow-xs' : 'border-[#DDE3E8] bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111]">Personalizar Kanban</span>
                    {template === 'Personalizado' && <span className="text-[10px] bg-[#66acd7] text-[#111111] font-black px-2 py-0.5 rounded">Selecionado</span>}
                  </div>
                  <p className="text-[11px] text-[#6B7280] mt-1">Defina os nomes e a quantidade de etapas do seu fluxo.</p>
                </div>
                {template === 'Personalizado' && (
                  <div className="rounded-2xl border border-[#DDE3E8] bg-[#F5F7F9] p-4 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-bold text-[#111111]">Etapas do seu Kanban</p>
                      <span className="text-[10px] text-[#6B7280]">{customColumns.length}/12 colunas</span>
                    </div>
                    {customColumns.map((column, index) => (
                      <div key={column.id} className="flex items-center gap-2">
                        <span className="w-6 text-center text-[10px] font-bold text-[#6B7280]">{index + 1}</span>
                        <input
                          type="text"
                          value={column.title}
                          maxLength={160}
                          aria-label={`Nome da coluna ${index + 1}`}
                          onChange={event => setCustomColumns(current => current.map(item => item.id === column.id ? { ...item, title: event.target.value } : item))}
                          placeholder="Nome da etapa"
                          className="min-w-0 flex-1 rounded-lg border border-[#DDE3E8] bg-white px-3 py-2 text-xs text-[#111111] focus:outline-none focus:border-[#66acd7]"
                        />
                        <button
                          type="button"
                          aria-label={`Remover coluna ${index + 1}`}
                          disabled={customColumns.length <= 3}
                          onClick={() => setCustomColumns(current => current.filter(item => item.id !== column.id).map((item, order) => ({ ...item, order })))}
                          className="rounded-lg p-2 text-[#6B7280] hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      disabled={customColumns.length >= 12}
                      onClick={() => setCustomColumns(current => [...current, {
                        id: `custom_${crypto.randomUUID()}`,
                        title: '',
                        color: ['#66acd7', '#2F6F9C', '#8B5CF6', '#F59E0B', '#EC4899', '#10B981'][current.length % 6],
                        order: current.length,
                      }])}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#66acd7] px-3 py-2 text-xs font-bold text-[#2F6F9C] hover:bg-white disabled:opacity-40"
                    >
                      <Plus className="h-4 w-4" /> Adicionar etapa
                    </button>
                    <p className="text-[10px] text-[#6B7280]">Mínimo de 3 e máximo de 12 etapas. Os nomes serão usados nas colunas do seu Kanban.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ETAPA 4 */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">Etapa 4</span>
                <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight mt-0.5">
                  Como você organiza seus projetos?
                </h2>
                <p className="text-xs text-[#6B7280]">Escolha um dos quatro modelos ou crie suas próprias etapas.</p>
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

              {step < 4 ? (
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
                  disabled={isFinishing}
                  className="bg-[#66acd7] hover:bg-[#529dc9] disabled:cursor-not-allowed disabled:bg-gray-300 text-[#111111] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-all shadow-md inline-flex items-center gap-2"
                >
                  <span>{isFinishing ? 'Salvando configuração...' : 'Concluir e Abrir StudioDesk'}</span>
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
