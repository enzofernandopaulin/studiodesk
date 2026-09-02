import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Columns3, 
  Calendar, 
  ShieldCheck, 
  BarChart3, 
  Settings, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  CheckCircle2, 
  Play, 
  Plus, 
  ExternalLink,
  MessageSquare,
  Clock,
  Briefcase,
  Layers,
  ChevronRight,
  MousePointer,
  RotateCcw,
  Film,
  Zap
} from 'lucide-react';

interface CrmUserManualProps {
  onClose?: () => void;
  isModal?: boolean;
}

export const CrmUserManual: React.FC<CrmUserManualProps> = ({ onClose, isModal = false }) => {
  const { setCurrentView, user, clients, projects, leads } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [isCompleted, setIsCompleted] = useState(false);

  // Interactive step demo states
  const [interactiveKanbanCol, setInteractiveKanbanCol] = useState<'briefing' | 'producao' | 'edicao' | 'aprovacao'>('briefing');
  const [interactiveLeadStatus, setInteractiveLeadStatus] = useState<'novo' | 'qualificado' | 'convertido'>('novo');
  const [interactiveApprovalStatus, setInteractiveApprovalStatus] = useState<'pending' | 'approved' | 'revision'>('pending');
  const [interactiveCalendarView, setInteractiveCalendarView] = useState<'month' | 'week' | 'day'>('week');

  const steps = [
    {
      id: 1,
      title: 'Dashboard de Operações',
      subtitle: 'Visão Geral e Controle Executivo',
      icon: LayoutDashboard,
      color: '#66acd7',
      summary: 'O centro de comando do seu StudioDesk reúne o panorama financeiro, pipeline de projetos e ações rápidas.',
      keyPoints: [
        { title: 'Métricas Rápidas', desc: 'Acompanhe receita ativa, total de projetos em andamento e taxa de conversão em tempo real.' },
        { title: 'Atalhos de Criação', desc: 'Utilize o botão "Criar" no topo para lançar rapidamente novos leads, clientes, projetos e tarefas.' },
        { title: 'Feed de Atividades', desc: 'Monitore tudo o que a equipe está realizando com carimbo de horário e autor da alteração.' }
      ]
    },
    {
      id: 2,
      title: 'Contatos & Clientes',
      subtitle: 'Gestão Completa de Carteira',
      icon: Users,
      color: '#2F6F9C',
      summary: 'Organize empresas, contatos-chave, histórico de atendimentos e preferências contratuais.',
      keyPoints: [
        { title: 'Perfil Unificado', desc: 'Cada cliente possui página detalhada com projetos vinculados, documentos e faturamento acumulado.' },
        { title: 'Integração com WhatsApp', desc: 'Abra conversas diretamente com o decisor com 1 clique usando o link inteligente.' },
        { title: 'Segmentação por Tags', desc: 'Classifique por segmento (Audiovisual, Varejo, Moda, etc.) para campanhas e ofertas direcionadas.' }
      ]
    },
    {
      id: 3,
      title: 'Funil de Leads',
      subtitle: 'Captação & Conversão em Clientes',
      icon: Sparkles,
      color: '#8B5CF6',
      summary: 'Capture oportunidades do formulário do seu site, Instagram ou indicações e qualifique o potencial.',
      keyPoints: [
        { title: 'Origens Automáticas', desc: 'Leads recebidos pela página institucional entram instantaneamente no funil com dados de briefing.' },
        { title: 'Qualificação Rápida', desc: 'Mude o status de Novo → Em Contato → Qualificado → Proposta com agilidade.' },
        { title: 'Conversão em 1 Clique', desc: 'Ao fechar o negócio, transforme o Lead em Cliente oficial e abra o primeiro projeto automaticamente.' }
      ]
    },
    {
      id: 4,
      title: 'Fluxo Kanban',
      subtitle: 'Gestão Visual de Produção',
      icon: Columns3,
      color: '#66acd7',
      summary: 'O coração da produtora: acompanhe cada entrega desde o briefing inicial até a aprovação e entrega final.',
      keyPoints: [
        { title: 'Etapas Customizáveis', desc: 'Fluxo padrão estruturado: Briefing → Roteiro → Gravação → Edição → Revisão → Aprovação → Concluído.' },
        { title: 'Arrastar & Soltar', desc: 'Mova os cards entre colunas para sincronizar o status com toda a equipe e atualizar a timeline.' },
        { title: 'Cards com Responsáveis', desc: 'Visualize foto do responsável, tag de prioridade, prazos e percentual de progresso em cada job.' }
      ]
    },
    {
      id: 5,
      title: 'Agenda & Calendário',
      subtitle: 'Prazos, Reuniões e Gravações',
      icon: Calendar,
      color: '#2F6F9C',
      summary: 'Sincronize reuniões com clientes, datas de diárias de gravação, prazos de entrega e follow-ups.',
      keyPoints: [
        { title: 'Visualizações Flexíveis', desc: 'Alterne entre Mês, Semana e Dia para visualizar a carga de trabalho da semana ou do mês.' },
        { title: 'Vínculo com Clientes & Equipe', desc: 'Associe cada evento ao cliente correspondente e designe membros da equipe responsáveis.' },
        { title: 'Controle de Conclusão', desc: 'Marque eventos como concluídos, adicione anotações de ata de reunião ou cancele compromissos.' }
      ]
    },
    {
      id: 6,
      title: 'Portal de Aprovações',
      subtitle: 'Revisão de Vídeos & Materiais',
      icon: ShieldCheck,
      color: '#EC4899',
      summary: 'Elimine refações infinitas e áudios soltos no WhatsApp com um hub estruturado de aprovação com timecodes.',
      keyPoints: [
        { title: 'Envio de Versões (V1, V2, Final)', desc: 'Cadastre links de cortes ou mídias para revisão com prazos estipulados de resposta.' },
        { title: 'Comentários com Timecode', desc: 'Clientes e equipe apontam ajustes exatos no segundo específico do vídeo (ex: 01:24).' },
        { title: 'Aprovação Formal', desc: 'Histórico auditável com registro de quem aprovou, data e observações finais.' }
      ]
    },
    {
      id: 7,
      title: 'Métricas & Dados',
      subtitle: 'Indicadores de Performance e Lucro',
      icon: BarChart3,
      color: '#10B981',
      summary: 'Acompanhe a saúde financeira, tempo médio de entrega dos projetos e produtividade da agência.',
      keyPoints: [
        { title: 'Receita & Margem de Lucro', desc: 'Gráficos interativos de evolução do faturamento e margens líquidas operacionais.' },
        { title: 'Gargalos de Produção', desc: 'Descubra em qual coluna do Kanban os jobs passam mais tempo para otimizar os processos.' },
        { title: 'Taxa de Conversão de Leads', desc: 'Avalie a eficiência do funil de vendas e os canais de captação mais lucrativos.' }
      ]
    },
    {
      id: 8,
      title: 'Configurações do Sistema',
      subtitle: 'Personalização & Parâmetros',
      icon: Settings,
      color: '#111111',
      summary: 'Ajuste dados cadastrais da empresa, membros da equipe, modelos de Kanban e preferências do sistema.',
      keyPoints: [
        { title: 'Dados da Empresa & Perfil', desc: 'Defina o nome da sua agência/produtora, dados de contato e foto de exibição.' },
        { title: 'Colunas Ativas do Kanban', desc: 'Selecione e ajuste as etapas do workflow de acordo com seu segmento operacional.' },
        { title: 'Demonstração & Reset', desc: 'Teste o modo de visualização vazia ou restaure dados de exemplo a qualquer momento.' }
      ]
    }
  ];

  const currentStepData = steps[currentStep - 1];

  const handleNext = () => {
    if (currentStep < steps.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = (targetView: string = 'dashboard') => {
    if (onClose) {
      onClose();
    }
    setCurrentView(targetView as any);
  };

  return (
    <div className={`min-h-screen bg-[#F5F7F9] flex flex-col justify-between p-4 sm:p-6 selection:bg-[#66acd7]/30 ${isModal ? 'fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4' : ''}`}>
      <div className={`w-full max-w-5xl mx-auto space-y-5 ${isModal ? 'bg-[#F5F7F9] rounded-3xl p-4 sm:p-6 border border-[#DDE3E8] shadow-2xl my-auto' : ''}`} id="crm-user-manual">
        {/* Top Bar / Brand & Actions */}
        <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-4">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <span className="hidden sm:inline-block h-5 w-px bg-[#DDE3E8]" />
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#2F6F9C] bg-[#66acd7]/15 px-2.5 py-1 rounded-full border border-[#66acd7]/30">
              <Zap className="w-3.5 h-3.5" />
              <span>Manual do Usuário CRM</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleFinish('dashboard')}
              className="text-xs font-semibold text-[#6B7280] hover:text-[#111111] transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-200"
            >
              {isCompleted ? 'Fechar' : 'Pular Tutorial'}
            </button>
            <button
              onClick={() => handleFinish('dashboard')}
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs inline-flex items-center gap-1.5"
            >
              <span>Abrir CRM</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#66acd7]" />
            </button>
          </div>
        </div>

        {/* Step Tabs Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 bg-white p-2 rounded-2xl border border-[#DDE3E8] shadow-2xs">
          {steps.map((stepItem) => {
            const Icon = stepItem.icon;
            const isCurrent = currentStep === stepItem.id && !isCompleted;
            const isDone = currentStep > stepItem.id || isCompleted;

            return (
              <button
                key={stepItem.id}
                onClick={() => {
                  setCurrentStep(stepItem.id);
                  setIsCompleted(false);
                }}
                className={`p-2 rounded-xl text-center transition-all flex flex-col items-center gap-1 relative ${
                  isCurrent
                    ? 'bg-[#111111] text-white shadow-xs'
                    : isDone
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-[#F5F7F9] text-[#6B7280] hover:bg-gray-100'
                }`}
                title={stepItem.title}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-lg">
                  {isDone && !isCurrent ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: isCurrent ? '#66acd7' : undefined }} />
                  )}
                </div>
                <span className="text-[11px] font-bold truncate max-w-full block leading-tight">
                  Passo {stepItem.id}
                </span>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#66acd7] absolute bottom-1" />
                )}
              </button>
            );
          })}
        </div>

        {/* MAIN TUTORIAL CONTENT */}
        {!isCompleted ? (
          <div className="bg-white rounded-3xl border border-[#DDE3E8] shadow-lg p-5 sm:p-7 space-y-6">
            {/* Header of the Active Step */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DDE3E8] pb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: currentStepData.color }}
                >
                  <currentStepData.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C]">
                      Passo {currentStepData.id} de {steps.length}
                    </span>
                    <span className="text-xs text-[#6B7280]">•</span>
                    <span className="text-xs font-semibold text-[#6B7280]">{currentStepData.subtitle}</span>
                  </div>
                  <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
                    {currentStepData.title}
                  </h2>
                </div>
              </div>

              {/* Progress pill */}
              <div className="flex items-center gap-2 bg-[#F5F7F9] px-3 py-1.5 rounded-xl border border-[#DDE3E8] self-start sm:self-auto">
                <span className="text-xs font-bold text-[#111111]">Progresso:</span>
                <div className="w-24 h-2 bg-[#DDE3E8] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#66acd7] rounded-full transition-all duration-300"
                    style={{ width: `${(currentStep / steps.length) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-mono font-bold text-[#2F6F9C]">
                  {Math.round((currentStep / steps.length) * 100)}%
                </span>
              </div>
            </div>

            {/* Two-Column Explanation & Interactive Simulator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column (5 Cols): Explanations & Key Features */}
              <div className="lg:col-span-5 space-y-4">
                <p className="text-sm text-[#111111] font-medium leading-relaxed bg-blue-50/50 p-3.5 rounded-2xl border border-blue-100">
                  {currentStepData.summary}
                </p>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                    Recursos Principais deste Módulo:
                  </h4>

                  {currentStepData.keyPoints.map((point, idx) => (
                    <div key={idx} className="p-3 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] space-y-1">
                      <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{point.title}</span>
                      </div>
                      <p className="text-xs text-[#6B7280] pl-5 leading-relaxed">
                        {point.desc}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Dica de Produtividade:</strong> Experimente interagir com a demonstração ao lado para ver o fluxo em funcionamento.
                  </div>
                </div>
              </div>

              {/* Right Column (7 Cols): Interactive Simulation Pane */}
              <div className="lg:col-span-7 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] p-4 sm:p-5 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#111111]">
                    <MousePointer className="w-3.5 h-3.5 text-[#2F6F9C]" />
                    <span>Simulação Interativa ao Vivo</span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#66acd7] bg-[#66acd7]/15 px-2 py-0.5 rounded-full">
                    Ambiente de Demonstração
                  </span>
                </div>

                {/* Step 1 Simulation: Interactive Dashboard Mini-Widgets */}
                {currentStep === 1 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs">
                        <span className="text-[11px] text-[#6B7280] block font-medium">Receita em Contratos</span>
                        <span className="text-base font-bold text-[#111111] block mt-0.5">R$ 142.500</span>
                        <span className="text-[10px] text-emerald-600 font-bold">+18% este mês</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs">
                        <span className="text-[11px] text-[#6B7280] block font-medium">Projetos Ativos</span>
                        <span className="text-base font-bold text-[#111111] block mt-0.5">14 jobs</span>
                        <span className="text-[10px] text-[#2F6F9C] font-bold">4 em aprovação</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs">
                        <span className="text-[11px] text-[#6B7280] block font-medium">Leads no Funil</span>
                        <span className="text-base font-bold text-[#111111] block mt-0.5">28 contatos</span>
                        <span className="text-[10px] text-[#8B5CF6] font-bold">7 qualificados</span>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white rounded-xl border border-[#DDE3E8] space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
                        <span>Atividades Recentes da Produtora</span>
                        <span className="text-[11px] text-[#2F6F9C]">Hoje</span>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="p-2 bg-[#F5F7F9] rounded-lg flex items-center justify-between">
                          <span className="text-[#111111]">🎥 Dumonti subiu corte V2 do Filme Manifesto</span>
                          <span className="text-[11px] text-[#6B7280]">14:20</span>
                        </div>
                        <div className="p-2 bg-[#F5F7F9] rounded-lg flex items-center justify-between">
                          <span className="text-[#111111]">✅ Cliente Vanguarda aprovou teaser de Social Media</span>
                          <span className="text-[11px] text-emerald-600 font-bold">Aprovado</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2 Simulation: Interactive Customer Card */}
                {currentStep === 2 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#2F6F9C] text-white flex items-center justify-center font-bold text-sm">
                            VG
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-[#111111]">Vanguarda Incorporações</h4>
                            <span className="text-[11px] text-[#6B7280]">Contato: Dra. Mariana Costa (Diretora)</span>
                          </div>
                        </div>
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                          Cliente Ativo
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2 bg-[#F5F7F9] rounded-lg">
                          <span className="text-[10px] text-[#6B7280] block">WhatsApp Direto</span>
                          <span className="text-[#2F6F9C] font-semibold">+55 11 98765-4321</span>
                        </div>
                        <div className="p-2 bg-[#F5F7F9] rounded-lg">
                          <span className="text-[10px] text-[#6B7280] block">Projetos Concluídos</span>
                          <span className="text-[#111111] font-bold">6 entregas</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#DDE3E8]">
                        <button 
                          onClick={() => alert('Simulação: abrindo perfil completo do cliente')}
                          className="flex-1 text-xs font-bold bg-[#111111] text-white py-2 rounded-lg hover:bg-[#2F6F9C] transition-colors text-center"
                        >
                          Ver Perfil Completo
                        </button>
                        <button 
                          onClick={() => alert('Simulação: abrindo WhatsApp do cliente')}
                          className="text-xs font-bold bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3 Simulation: Interactive Lead Funnel Stage Switcher */}
                {currentStep === 3 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#8B5CF6] bg-[#8B5CF6]/15 px-2 py-0.5 rounded-full">
                            Origem: Site Institucional
                          </span>
                          <h4 className="text-xs font-bold text-[#111111] mt-1.5">Campanha Lançamento Verão 2026</h4>
                          <span className="text-[11px] text-[#6B7280]">Interessado: Pedro Alcantara • R$ 38.000</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#6B7280]">Mudar Etapa do Lead (Clique para testar):</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => setInteractiveLeadStatus('novo')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                              interactiveLeadStatus === 'novo'
                                ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                                : 'bg-[#F5F7F9] text-[#111111] border-[#DDE3E8]'
                            }`}
                          >
                            1. Novo Lead
                          </button>
                          <button
                            onClick={() => setInteractiveLeadStatus('qualificado')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                              interactiveLeadStatus === 'qualificado'
                                ? 'bg-[#2F6F9C] text-white border-[#2F6F9C]'
                                : 'bg-[#F5F7F9] text-[#111111] border-[#DDE3E8]'
                            }`}
                          >
                            2. Qualificado
                          </button>
                          <button
                            onClick={() => setInteractiveLeadStatus('convertido')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                              interactiveLeadStatus === 'convertido'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-[#F5F7F9] text-[#111111] border-[#DDE3E8]'
                            }`}
                          >
                            3. Convertido!
                          </button>
                        </div>
                      </div>

                      {interactiveLeadStatus === 'convertido' && (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                          <span>🎉 Lead pronto para virar Cliente e Projeto!</span>
                          <span className="font-bold underline">1-Click Convert</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4 Simulation: Interactive Kanban Card Drag/Move */}
                {currentStep === 4 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">Card de Projeto em Produção:</span>
                        <span className="text-[11px] font-bold text-[#66acd7] bg-[#66acd7]/15 px-2 py-0.5 rounded">
                          Vídeo Comercial 60s
                        </span>
                      </div>

                      <div className="p-3 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#111111]">Filme Institucional 4K</span>
                          <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                            Alta Prioridade
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6B7280]">Cliente: Dumonti Produções • Entrega em 5 dias</p>
                        
                        {/* Interactive Move Controls */}
                        <div className="space-y-1">
                          <span className="text-[10px] text-[#6B7280] font-bold uppercase">Mover card para etapa:</span>
                          <div className="grid grid-cols-4 gap-1 text-[11px]">
                            {(['briefing', 'producao', 'edicao', 'aprovacao'] as const).map(c => (
                              <button
                                key={c}
                                onClick={() => setInteractiveKanbanCol(c)}
                                className={`py-1.5 px-2 rounded font-bold uppercase transition-all ${
                                  interactiveKanbanCol === c
                                    ? 'bg-[#111111] text-white shadow-xs'
                                    : 'bg-white border border-[#DDE3E8] text-[#6B7280] hover:text-[#111111]'
                                }`}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#2F6F9C] font-semibold flex items-center justify-between">
                        <span>Etapa Atual do Kanban:</span>
                        <span className="uppercase font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                          {interactiveKanbanCol}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5 Simulation: Interactive Calendar Scheduler */}
                {currentStep === 5 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">Agenda da Produtora</span>
                        <div className="flex items-center gap-1 bg-[#F5F7F9] p-0.5 rounded-lg border border-[#DDE3E8]">
                          {(['month', 'week', 'day'] as const).map(v => (
                            <button
                              key={v}
                              onClick={() => setInteractiveCalendarView(v)}
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                interactiveCalendarView === v ? 'bg-[#111111] text-white' : 'text-[#6B7280]'
                              }`}
                            >
                              {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-blue-50 rounded-xl border border-[#66acd7]/40 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#111111] block">📅 09:30 - Alinhamento de Roteiro</span>
                            <span className="text-[11px] text-[#2F6F9C]">Cliente: Vanguarda • Resp: Ruan Beguetto</span>
                          </div>
                          <span className="text-[10px] bg-[#66acd7] text-[#111111] font-bold px-2 py-0.5 rounded">
                            Reunião
                          </span>
                        </div>

                        <div className="p-2.5 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-[#111111] block">🎬 14:00 - Diária de Gravação Externa</span>
                            <span className="text-[11px] text-purple-700">Locação: Estúdio Dumonti • Equipe de Câmera</span>
                          </div>
                          <span className="text-[10px] bg-[#8B5CF6] text-white font-bold px-2 py-0.5 rounded">
                            Produção
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 6 Simulation: Interactive Media Approval Portal */}
                {currentStep === 6 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Film className="w-4 h-4 text-[#EC4899]" />
                          <span className="text-xs font-bold text-[#111111]">Player de Revisão de Mídia</span>
                        </div>
                        <span className="text-[10px] font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[#111111]">
                          Versão V2.1
                        </span>
                      </div>

                      <div className="p-3 bg-[#111111] text-white rounded-xl space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-300">Preview do Vídeo (Timecode 01:14)</span>
                          <span className="text-[11px] font-mono text-[#66acd7]">01:14 / 03:00</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-[#66acd7] w-1/2 rounded-full" />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-[#6B7280]">Status da Aprovação pelo Cliente:</span>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            onClick={() => setInteractiveApprovalStatus('pending')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                              interactiveApprovalStatus === 'pending'
                                ? 'bg-amber-500 text-white border-amber-500'
                                : 'bg-[#F5F7F9] text-[#111111] border-[#DDE3E8]'
                            }`}
                          >
                            Pendente
                          </button>
                          <button
                            onClick={() => setInteractiveApprovalStatus('approved')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                              interactiveApprovalStatus === 'approved'
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : 'bg-[#F5F7F9] text-[#111111] border-[#DDE3E8]'
                            }`}
                          >
                            Aprovado!
                          </button>
                          <button
                            onClick={() => setInteractiveApprovalStatus('revision')}
                            className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                              interactiveApprovalStatus === 'revision'
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-[#F5F7F9] text-[#111111] border-[#DDE3E8]'
                            }`}
                          >
                            Pedir Ajuste
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 7 Simulation: Interactive Metrics KPI */}
                {currentStep === 7 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">Painel de Métricas Operacionais</span>
                        <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          Lucratividade: 36.4%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
                          <span className="text-[11px] text-[#6B7280]">Prazo Médio de Produção</span>
                          <span className="text-base font-bold text-[#111111] block mt-0.5">8.4 dias</span>
                          <span className="text-[10px] text-emerald-600">2 dias abaixo da meta</span>
                        </div>
                        <div className="p-2.5 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
                          <span className="text-[11px] text-[#6B7280]">Taxa de Aprovação V1</span>
                          <span className="text-base font-bold text-[#111111] block mt-0.5">72%</span>
                          <span className="text-[10px] text-[#2F6F9C]">Alta satisfação do cliente</span>
                        </div>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                        <strong>Relatório Semanal Automático:</strong> Os dados são recalculados conforme as etapas do Kanban e fechamento de novos contratos.
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 8 Simulation: Interactive Settings Options */}
                {currentStep === 8 && (
                  <div className="space-y-3">
                    <div className="p-4 bg-white rounded-xl border border-[#DDE3E8] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111]">Configurações da Conta & Agência</span>
                        <span className="text-[11px] font-bold text-[#2F6F9C]">StudioDesk Pro</span>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2 bg-[#F5F7F9] rounded-lg flex items-center justify-between">
                          <span className="text-[#111111]">🏢 Nome da Empresa: <strong>{user.companyName}</strong></span>
                          <span className="text-[#2F6F9C] font-semibold">Editar</span>
                        </div>
                        <div className="p-2 bg-[#F5F7F9] rounded-lg flex items-center justify-between">
                          <span className="text-[#111111]">📊 Template do Kanban: <strong>{user.template}</strong></span>
                          <span className="text-emerald-700 font-bold">Ativo</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#DDE3E8] flex items-center justify-between text-xs text-[#6B7280]">
                        <span>Tudo pronto para operar o CRM!</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step Navigation Bar */}
                <div className="flex items-center justify-between pt-3 border-t border-[#DDE3E8]">
                  <button
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                    className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                      currentStep === 1
                        ? 'text-gray-300 cursor-not-allowed'
                        : 'text-[#6B7280] hover:text-[#111111] hover:bg-white'
                    }`}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Passo Anterior</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleNext}
                      className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
                      id="manual-next-btn"
                    >
                      <span>{currentStep === steps.length ? 'Concluir Tutorial' : 'Próximo Passo'}</span>
                      <ArrowRight className="w-4 h-4 text-[#66acd7]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* COMPLETION CELEBRATION CARD */
          <div className="bg-white rounded-3xl border border-[#DDE3E8] shadow-xl p-6 sm:p-10 text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-2 max-w-md mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                Treinamento Concluído com Sucesso
              </span>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-[#111111] uppercase tracking-tight">
                Você já domina o StudioDesk CRM!
              </h2>
              <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                Agora sua equipe possui o controle unificado de contatos, funil de vendas, etapas do Kanban, aprovação de cortes e métricas financeiras.
              </p>
            </div>

            {/* Quick action cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
              <button
                onClick={() => handleFinish('kanban')}
                className="p-4 bg-[#F5F7F9] hover:bg-blue-50/50 rounded-2xl border border-[#DDE3E8] hover:border-[#66acd7] transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <Columns3 className="w-5 h-5 text-[#2F6F9C]" />
                  <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#2F6F9C]" />
                </div>
                <h4 className="text-xs font-bold text-[#111111]">Abrir o Kanban</h4>
                <p className="text-[11px] text-[#6B7280]">Visualizar seus projetos e colunas de produção</p>
              </button>

              <button
                onClick={() => handleFinish('leads')}
                className="p-4 bg-[#F5F7F9] hover:bg-purple-50/50 rounded-2xl border border-[#DDE3E8] hover:border-[#8B5CF6] transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                  <ArrowRight className="w-4 h-4 text-[#6B7280] group-hover:text-[#8B5CF6]" />
                </div>
                <h4 className="text-xs font-bold text-[#111111]">Explorar Leads</h4>
                <p className="text-[11px] text-[#6B7280]">Gerenciar oportunidades e propostas comerciais</p>
              </button>

              <button
                onClick={() => handleFinish('dashboard')}
                className="p-4 bg-[#111111] text-white rounded-2xl border border-[#2F6F9C] shadow-md space-y-1 text-left"
              >
                <div className="flex items-center justify-between">
                  <LayoutDashboard className="w-5 h-5 text-[#66acd7]" />
                  <ArrowRight className="w-4 h-4 text-[#66acd7]" />
                </div>
                <h4 className="text-xs font-bold text-white">Ir para o Dashboard</h4>
                <p className="text-[11px] text-gray-300">Visualizar panorama geral de operações</p>
              </button>
            </div>

            <div className="pt-4 border-t border-[#DDE3E8] flex items-center justify-center gap-4">
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setIsCompleted(false);
                }}
                className="text-xs font-bold text-[#6B7280] hover:text-[#111111] flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar Manual</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
