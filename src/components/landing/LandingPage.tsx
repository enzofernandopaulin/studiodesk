import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Logo } from '../common/Logo';
import { 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Layers, 
  Workflow, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Globe, 
  Columns3, 
  Users, 
  ChevronRight, 
  Play, 
  Laptop, 
  Check, 
  Building2, 
  User, 
  FileVideo, 
  TrendingUp,
  BarChart3,
  Trophy,
  Rocket
} from 'lucide-react';
import { motion } from 'motion/react';

export const LandingPage: React.FC = () => {
  const { setCurrentView } = useApp();
  const [activeTabPreview, setActiveTabPreview] = useState<'kanban' | 'leads' | 'aprovacao' | 'site'>('kanban');

  const handleStartPlan = (_selectedPlan?: unknown) => {
    setCurrentView('auth');
  };

  return (
    <div className="min-h-screen bg-[#F5F7F9] text-[#111111] flex flex-col selection:bg-[#66acd7]/30 selection:text-[#111111]">
      {/* Top Floating Announcement Bar */}
      <div className="bg-[#111111] text-white px-4 py-2 text-center text-xs font-medium flex items-center justify-center gap-2">
        <span className="bg-[#66acd7] text-[#111111] font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
          Caso Real
        </span>
        <span>
          Desenvolvido a partir das dores operacionais da <strong>Dumonti</strong> e do setor audiovisual.
        </span>
        <button
          onClick={() => setCurrentView('auth')}
          className="text-[#66acd7] hover:underline font-bold ml-2 inline-flex items-center gap-1"
        >
          Acessar StudioDesk →
        </button>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#DDE3E8] px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="md" showTagline onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-[#6B7280]">
            <a href="#diferencial" className="hover:text-[#111111] transition-colors">Diferencial</a>
            <a href="#dumonti" className="hover:text-[#111111] transition-colors">Case Dumonti</a>
            <a href="#recursos" className="hover:text-[#111111] transition-colors">Recursos</a>
            <a href="#planos" className="hover:text-[#111111] transition-colors">Planos</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('login')}
              className="text-xs sm:text-sm font-semibold text-[#111111] hover:text-[#2F6F9C] px-3 py-2 transition-colors"
            >
              Entrar
            </button>
            <button
              onClick={() => handleStartPlan('empresa')}
              className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs sm:text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              id="landing-cta-top"
            >
              <span>Começar agora</span>
              <ArrowRight className="w-4 h-4 text-[#66acd7]" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 px-4 sm:px-8 overflow-hidden bg-gradient-to-b from-white via-[#F5F7F9] to-[#F5F7F9]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#66acd7]/15 border border-[#66acd7]/30 text-[#2F6F9C] text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#2F6F9C]" />
            CRM + Kanban para clientes, projetos e processos
          </div>

          <h1 className="font-display font-black text-4xl sm:text-6xl md:text-7xl text-[#111111] tracking-tight leading-[1.05] uppercase">
            Clientes, projetos e processos.{' '}
            <span className="text-[#2F6F9C] underline decoration-[#66acd7] decoration-4 underline-offset-8">
              Finalmente no mesmo lugar.
            </span>
          </h1>

          <p className="text-base sm:text-xl text-[#6B7280] max-w-3xl mx-auto leading-relaxed">
            O StudioDesk conecta CRM, Kanban e sua presença digital em um único fluxo de trabalho.
            Seu cliente entra pelo site institucional. Seu projeto continua dentro do StudioDesk.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => handleStartPlan('empresa')}
              className="w-full sm:w-auto bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-base px-8 py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 group"
              id="hero-cta-start"
            >
              <span>Começar agora</span>
              <ArrowRight className="w-5 h-5 text-[#66acd7] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => setCurrentView('auth')}
              className="w-full sm:w-auto bg-white hover:bg-gray-50 text-[#111111] border border-[#DDE3E8] font-bold text-base px-8 py-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2"
              id="hero-cta-signup-secondary"
            >
              <Play className="w-4 h-4 text-[#2F6F9C] fill-[#2F6F9C]" />
              <span>Criar conta gratuita</span>
            </button>
          </div>

          {/* Quick trust metrics from real research */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-[#DDE3E8]/80 text-left">
            <div className="p-3 bg-white rounded-xl border border-[#DDE3E8]">
              <span className="font-display text-2xl font-black text-[#111111]">100%</span>
              <p className="text-xs text-[#6B7280] mt-0.5">Adoção de Kanban nas agências pesquisadas</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#DDE3E8]">
              <span className="font-display text-2xl font-black text-[#2F6F9C]">+23%</span>
              <p className="text-xs text-[#6B7280] mt-0.5">Conversão de leads com CRM integrado</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#DDE3E8]">
              <span className="font-display text-2xl font-black text-[#8B5CF6]">Zero</span>
              <p className="text-xs text-[#6B7280] mt-0.5">Áudios soltos ou revisões perdidas</p>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#DDE3E8]">
              <span className="font-display text-2xl font-black text-emerald-700">1 Fluxo</span>
              <p className="text-xs text-[#6B7280] mt-0.5">Site + Leads + Produção + Aprovação</p>
            </div>
          </div>
        </div>

        {/* PRODUCT PREVIEW */}
        <div className="max-w-6xl mx-auto mt-12 sm:mt-16 bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-[#DDE3E8] p-3 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#DDE3E8]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-400" />
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono text-[#6B7280] ml-2">app.studiodesk.com.br/dumonti-workspace</span>
            </div>

            {/* Preview Navigation Tabs */}
            <div className="flex items-center gap-1 bg-[#F5F7F9] p-1 rounded-xl border border-[#DDE3E8] text-xs font-semibold">
              <button
                onClick={() => setActiveTabPreview('kanban')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTabPreview === 'kanban' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Columns3 className="w-3.5 h-3.5 text-[#66acd7]" />
                Kanban Audiovisual
              </button>
              <button
                onClick={() => setActiveTabPreview('leads')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTabPreview === 'leads' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                Funil de Leads
              </button>
              <button
                onClick={() => setActiveTabPreview('aprovacao')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTabPreview === 'aprovacao' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                Aprovação de Vídeos
              </button>
              <button
                onClick={() => setActiveTabPreview('site')}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTabPreview === 'site' ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:text-[#111111]'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-[#2F6F9C]" />
                Site Integrado
              </button>
            </div>
          </div>

          {/* Interactive Screen Display */}
          <div className="pt-4 min-h-[380px] bg-[#F5F7F9] rounded-xl p-4 overflow-hidden border border-[#DDE3E8]">
            {activeTabPreview === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Column 1 */}
                <div className="bg-white p-3.5 rounded-xl border border-[#DDE3E8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#111111] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#66acd7]" />
                      Edição & Motion
                    </span>
                    <span className="text-xs font-bold bg-gray-100 px-2 py-0.5 rounded-full">1</span>
                  </div>
                  <div className="p-3 bg-[#F5F7F9] rounded-lg border border-[#DDE3E8] space-y-2">
                    <span className="text-[10px] font-bold uppercase bg-[#8B5CF6]/15 text-[#8B5CF6] px-2 py-0.5 rounded">Motion 3D</span>
                    <h4 className="text-xs font-bold text-[#111111]">Vídeo Manifesto 3D Tech — Nexus SaaS</h4>
                    <p className="text-[11px] text-[#6B7280]">Cliente: Nexus Software & Cloud</p>
                    <div className="flex items-center justify-between text-[11px] pt-1 text-[#6B7280]">
                      <span>Prazo: 30/08</span>
                      <span className="font-semibold text-rose-600">Urgente</span>
                    </div>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="bg-white p-3.5 rounded-xl border-2 border-[#66acd7] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#2F6F9C] uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#2F6F9C]" />
                      Aprovação do Cliente
                    </span>
                    <span className="text-xs font-bold bg-[#66acd7]/20 text-[#2F6F9C] px-2 py-0.5 rounded-full">1</span>
                  </div>
                  <div className="p-3 bg-blue-50/50 rounded-lg border border-[#66acd7]/40 space-y-2">
                    <span className="text-[10px] font-bold uppercase bg-[#66acd7]/20 text-[#2F6F9C] px-2 py-0.5 rounded">Campanha 4K</span>
                    <h4 className="text-xs font-bold text-[#111111]">Campanha de Lançamento — Dumonti</h4>
                    <p className="text-[11px] text-[#6B7280]">Cliente: Dumonti Criação & Brand</p>
                    <div className="p-2 bg-white rounded border border-[#66acd7]/30 text-[11px]">
                      <span className="font-bold text-amber-700 block">Aguardando Aprovação:</span>
                      Vídeo Institucional — V02 com Color Grading
                    </div>
                  </div>
                </div>

                {/* Column 3 */}
                <div className="bg-white p-3.5 rounded-xl border border-[#DDE3E8] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      Entrega & Concluído
                    </span>
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">2</span>
                  </div>
                  <div className="p-3 bg-[#F5F7F9] rounded-lg border border-[#DDE3E8] space-y-2 opacity-80">
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">Entregue</span>
                    <h4 className="text-xs font-bold text-[#111111]">Cortes Verticais Reels (Pack 06 vídeos)</h4>
                    <p className="text-[11px] text-[#6B7280]">Cliente: Dumonti Criação</p>
                    <span className="text-[10px] text-emerald-700 font-semibold block">✓ Aprovado sem alterações</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabPreview === 'leads' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-[#DDE3E8]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#111111]">Leads Captados Diretamente do Formulário do Site</span>
                  <span className="text-xs text-[#2F6F9C] font-semibold">5 Leads Ativos</span>
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#111111]">Carlos Eduardo Menezes</span>
                      <span className="text-[#6B7280] ml-2">(Restaurante Terraço Mar)</span>
                      <p className="text-[11px] text-[#8B5CF6]">Vídeo Institucional e Reels Gastronômicos</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-semibold bg-[#66acd7]/15 text-[#2F6F9C] px-2 py-0.5 rounded">Site Institucional</span>
                      <button
                        onClick={() => setCurrentView('leads')}
                        className="bg-[#111111] hover:bg-[#2F6F9C] text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                      >
                        Converter
                      </button>
                    </div>
                  </div>
                  <div className="py-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#111111]">Fernando Guimarães</span>
                      <span className="text-[#6B7280] ml-2">(Construtora Miramar)</span>
                      <p className="text-[11px] text-[#8B5CF6]">Captação com Drone e Vídeo 4K de Lançamento</p>
                    </div>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Proposta Enviada</span>
                  </div>
                </div>
              </div>
            )}

            {activeTabPreview === 'aprovacao' && (
              <div className="bg-white p-4 rounded-xl border border-[#DDE3E8] space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#111111]">Portal de Aprovação StudioDesk</h4>
                    <p className="text-xs text-[#6B7280]">Chega de áudios soltos ou mensagens perdidas no WhatsApp</p>
                  </div>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded">Aguardando Aprovação</span>
                </div>
                <div className="p-3 bg-[#F5F7F9] rounded-lg border border-[#DDE3E8] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#2F6F9C] text-white flex items-center justify-center shrink-0">
                      <FileVideo className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#111111]">Vídeo Institucional Principal — V02.mp4</p>
                      <p className="text-[11px] text-[#6B7280]">Projeto: Campanha Dumonti • Enviado hoje às 10:30</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setCurrentView('approval')}
                      className="flex-1 sm:flex-none text-xs bg-white border border-[#DDE3E8] text-[#111111] hover:bg-gray-50 px-3 py-1.5 rounded-lg font-semibold"
                    >
                      Ajustes (0:45s)
                    </button>
                    <button
                      onClick={() => setCurrentView('approval')}
                      className="flex-1 sm:flex-none text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold"
                    >
                      Aprovar
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTabPreview === 'site' && (
              <div className="bg-white p-4 rounded-xl border border-[#DDE3E8] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-[#2F6F9C]" />
                    <span className="text-xs font-bold text-[#111111]">Fluxo de Captação Integrado</span>
                  </div>
                  <span className="text-xs text-emerald-700 font-bold">● Sincronização Ativa</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-center text-xs pt-2">
                  <div className="p-2.5 bg-[#F5F7F9] rounded-lg border border-[#DDE3E8]">
                    <span className="font-bold block text-[#111111]">1. Visitante</span>
                    <span className="text-[10px] text-[#6B7280]">Acessa seu site</span>
                  </div>
                  <div className="p-2.5 bg-[#F5F7F9] rounded-lg border border-[#DDE3E8]">
                    <span className="font-bold block text-[#111111]">2. Formulário</span>
                    <span className="text-[10px] text-[#6B7280]">Pede orçamento</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 rounded-lg border border-[#66acd7]">
                    <span className="font-bold block text-[#2F6F9C]">3. Lead no CRM</span>
                    <span className="text-[10px] text-[#2F6F9C]">Entra na hora</span>
                  </div>
                  <div className="p-2.5 bg-purple-50 rounded-lg border border-[#8B5CF6]/50">
                    <span className="font-bold block text-[#8B5CF6]">4. Projeto</span>
                    <span className="text-[10px] text-[#8B5CF6]">Vai p/ Kanban</span>
                  </div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-300">
                    <span className="font-bold block text-emerald-800">5. Entrega</span>
                    <span className="text-[10px] text-emerald-800">Aprovação salva</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={() => setCurrentView('auth')}
              className="inline-flex items-center gap-2 text-xs font-bold text-[#2F6F9C] hover:text-[#111111] transition-colors"
            >
              <span>Abrir visão completa do CRM StudioDesk</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION: DIFERENCIAL "NÃO É APENAS UM CRM" */}
      <section id="diferencial" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-y border-[#DDE3E8]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C] bg-[#66acd7]/15 px-3 py-1 rounded-full border border-[#66acd7]/30">
              O Diferencial Central
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-[#111111] uppercase tracking-tight">
              Não é apenas um CRM.
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280]">
              Elimine a fragmentação entre ferramentas. Do primeiro contato à entrega final, tudo conectado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* O Modelo Fragmentado Tradicional */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#F5F7F9] border border-rose-200/80 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-700 font-bold text-sm uppercase tracking-wider">
                  <XCircle className="w-5 h-5 text-rose-600" />
                  CRM Tradicional + Ferramentas Isoladas
                </div>
                <span className="text-[11px] bg-rose-100 text-rose-800 font-semibold px-2 py-0.5 rounded">
                  Retrabalho & Perda de Histórico
                </span>
              </div>

              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] flex items-center justify-between">
                  <span>Cliente</span>
                  <span className="text-[#6B7280]">→ CRM Isolado</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] flex items-center justify-between">
                  <span>Projeto</span>
                  <span className="text-[#6B7280]">→ Trello / Notion / Outra ferramenta</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] flex items-center justify-between">
                  <span>Site & Portfólio</span>
                  <span className="text-[#6B7280]">→ Atualizado separadamente</span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#DDE3E8] flex items-center justify-between">
                  <span>Comunicação & Ajustes</span>
                  <span className="text-rose-600 font-bold">→ Áudios e mensagens soltas no WhatsApp</span>
                </div>
              </div>

              <p className="text-xs text-rose-700 leading-relaxed font-medium">
                Gargalo identificado em 100% das empresas de marketing audiovisual: informações perdidas, prazos esquecidos e falta de histórico unificado.
              </p>
            </div>

            {/* O Modelo StudioDesk */}
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-[#111111] to-[#1c2833] text-white border border-[#2F6F9C] space-y-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#66acd7] font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 text-[#66acd7]" />
                  STUDIO DESK (Ecossistema Integrado)
                </div>
                <span className="text-[11px] bg-[#66acd7] text-[#111111] font-bold px-2 py-0.5 rounded">
                  100% Conectado
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between font-semibold">
                  <span>Site Institucional</span>
                  <span className="text-[#66acd7]">→ Captação de Lead Nativa</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between font-semibold">
                  <span>Lead Qualificado</span>
                  <span className="text-[#66acd7]">→ Carteira de Clientes</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between font-semibold">
                  <span>Projeto Automático</span>
                  <span className="text-[#66acd7]">→ Kanban de Produção Audiovisual</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl border border-white/10 flex items-center justify-between font-semibold">
                  <span>Aprovação & Histórico</span>
                  <span className="text-[#8B5CF6]">→ Feedback Rastreável sem Áudios Soltos</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#66acd7]/20 border border-[#66acd7]/40 text-xs text-[#66acd7]">
                <strong className="block text-white font-bold">Mensagem Principal:</strong>
                "Do primeiro contato à entrega, tudo conectado no mesmo sistema."
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: CASE DUMONTI */}
      <section id="dumonti" className="py-16 sm:py-24 px-4 sm:px-8 bg-[#F5F7F9]">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="bg-white rounded-3xl border border-[#DDE3E8] p-6 sm:p-12 shadow-sm space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DDE3E8] pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#6B7280]">
                  Caso Real de Origem
                </span>
                <h3 className="font-display text-3xl sm:text-4xl font-black text-[#111111] uppercase tracking-tight mt-1">
                  A DUMONTI & O Setor Audiovisual
                </h3>
              </div>
              <div className="inline-flex items-center gap-2 bg-[#2F6F9C]/10 text-[#2F6F9C] px-3.5 py-1.5 rounded-full text-xs font-bold">
                <Building2 className="w-4 h-4" />
                Agência de Marketing Audiovisual
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Quem é a Dumonti */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-[#111111] uppercase tracking-wider">Atuação</h4>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                  A Dumonti é uma agência focada em estratégia, criatividade e posicionamento de marca. Atua diretamente com:
                </p>
                <ul className="text-xs text-[#111111] space-y-2">
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-[#2F6F9C]" />
                    Captação e edição cinematográfica de vídeos
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-[#2F6F9C]" />
                    Produção de conteúdo digital para redes sociais
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4 text-[#2F6F9C]" />
                    Gestão de mídias sociais (social media)
                  </li>
                </ul>
              </div>

              {/* O Cenário Antes */}
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
                  Antes do StudioDesk
                </div>
                <p className="text-xs text-[#6B7280]">
                  Informações distribuídas e retrabalho contínuo:
                </p>
                <div className="space-y-1.5 text-xs text-rose-900 font-medium">
                  <div className="p-2 bg-white rounded border border-rose-100">WhatsApp (mensagens soltas)</div>
                  <div className="p-2 bg-white rounded border border-rose-100">Planilhas despadronizadas</div>
                  <div className="p-2 bg-white rounded border border-rose-100">E-mails com anexos perdidos</div>
                  <div className="p-2 bg-white rounded border border-rose-100">Site desconectado do fluxo</div>
                </div>
              </div>

              {/* O Cenário Depois */}
              <div className="p-4 bg-blue-50/70 rounded-2xl border border-[#66acd7] space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C]">
                  Depois com StudioDesk
                </div>
                <p className="text-xs text-[#6B7280]">
                  Central única de operação e rastreabilidade:
                </p>
                <div className="space-y-1.5 text-xs text-[#111111] font-semibold">
                  <div className="p-2 bg-white rounded border border-[#66acd7]/40 flex items-center justify-between">
                    <span>CRM Centralizado</span>
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C]" />
                  </div>
                  <div className="p-2 bg-white rounded border border-[#66acd7]/40 flex items-center justify-between">
                    <span>Kanban Personalizável</span>
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C]" />
                  </div>
                  <div className="p-2 bg-white rounded border border-[#66acd7]/40 flex items-center justify-between">
                    <span>Portal de Aprovação</span>
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C]" />
                  </div>
                  <div className="p-2 bg-white rounded border border-[#66acd7]/40 flex items-center justify-between">
                    <span>Site Institucional Integrado</span>
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: PLANOS */}
      <section id="planos" className="py-16 sm:py-24 px-4 sm:px-8 bg-white border-t border-[#DDE3E8]">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2F6F9C] bg-[#66acd7]/15 px-3 py-1 rounded-full border border-[#66acd7]/30">
              Modalidades & Investimento
            </span>
            <h2 className="font-display text-3xl sm:text-5xl font-black text-[#111111] uppercase tracking-tight">
              Planos e Condições
            </h2>
            <p className="text-sm sm:text-base text-[#6B7280]">
              Estruturas dimensionadas desde o profissional autônomo até grandes agências e produtoras audiovisuais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* PLANO SOLO */}
            <div className="p-6 rounded-3xl bg-[#F5F7F9] border border-[#DDE3E8] flex flex-col justify-between space-y-6 hover:border-[#66acd7] transition-all hover:shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-white border border-[#DDE3E8] px-3 py-1 rounded-full text-xs font-bold text-[#111111]">
                    <User className="w-3.5 h-3.5 text-[#6B7280]" />
                    <span>Solo</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider bg-white px-2 py-0.5 rounded-md border border-[#DDE3E8]">
                    1 usuário
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-black text-[#111111] uppercase flex items-center gap-2">
                    <User className="w-6 h-6 text-[#2F6F9C]" />
                    Solo
                  </h3>
                  <p className="text-xs text-[#2F6F9C] font-semibold mt-0.5">
                    Freelancer / autônomo
                  </p>
                  <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                    Para criadores solo e filmmakers que precisam centralizar clientes, prazos e entregas.
                  </p>
                </div>

                <div className="py-3 border-y border-[#DDE3E8]">
                  <span className="text-[11px] text-[#6B7280] block font-medium">Preço recomendado:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-[#111111] font-display">R$ 49,90</span>
                    <span className="text-xs font-medium text-[#6B7280]">/mês</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#111111]">
                  <span className="font-bold text-[#6B7280] uppercase tracking-wider block text-[10px]">
                    Incluso no Solo:
                  </span>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1 Usuário com acesso total</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>CRM de Clientes & Contatos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Funil e Captação de Leads</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Kanban & Tarefas Operacionais</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Histórico & Calendário</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPlan('solo')}
                className="w-full bg-white hover:bg-gray-100 text-[#111111] border border-[#DDE3E8] font-bold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                id="btn-plan-solo"
              >
                <span>Assinar Plano Solo</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#2F6F9C]" />
              </button>
            </div>

            {/* PLANO STUDIO */}
            <div className="p-6 rounded-3xl bg-[#111111] text-white border-2 border-[#66acd7] flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="bg-[#66acd7] text-[#111111] text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                  Mais Escolhido
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-3 py-1 rounded-full text-xs font-bold text-[#66acd7]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Studio</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-black text-white uppercase flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-[#66acd7]" />
                    Studio
                  </h3>
                  <p className="text-xs text-[#66acd7] font-semibold mt-0.5">
                    Até 10 usuários
                  </p>
                  <p className="text-xs text-gray-300 mt-2 leading-relaxed">
                    Para produtoras e pequenas agências criativas estruturarem seu fluxo de produção e equipe.
                  </p>
                </div>

                <div className="py-3 border-y border-white/15">
                  <span className="text-[11px] text-gray-400 block font-medium">Preço recomendado:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-[#66acd7] font-display">R$ 199,90</span>
                    <span className="text-xs font-medium text-gray-400">/mês</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-200">
                  <span className="font-bold text-[#66acd7] uppercase tracking-wider block text-[10px]">
                    Tudo do Solo, mais:
                  </span>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#66acd7] shrink-0" />
                    <span><strong>Até 10 usuários</strong> e gestão de equipe</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#66acd7] shrink-0" />
                    <span>Portal de Aprovação de Mídias</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#66acd7] shrink-0" />
                    <span>Página Institucional Integrada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#66acd7] shrink-0" />
                    <span>Comunicação WhatsApp / Evolution API</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#66acd7] shrink-0" />
                    <span>100 GB armazenamento em nuvem</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPlan('studio')}
                className="w-full bg-[#66acd7] hover:bg-[#529dc9] text-[#111111] font-bold text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                id="btn-plan-studio"
              >
                <span>Escolher Plano Studio</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#111111]" />
              </button>
            </div>

            {/* PLANO EMPRESA */}
            <div className="p-6 rounded-3xl bg-[#F5F7F9] border border-[#DDE3E8] flex flex-col justify-between space-y-6 hover:border-[#2F6F9C] transition-all hover:shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-white border border-[#DDE3E8] px-3 py-1 rounded-full text-xs font-bold text-[#111111]">
                    <Layers className="w-3.5 h-3.5 text-[#2F6F9C]" />
                    <span>Empresa</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#2F6F9C] uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded-md border border-[#66acd7]/40">
                    11–25 usuários
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-black text-[#111111] uppercase flex items-center gap-2">
                    <Rocket className="w-6 h-6 text-[#2F6F9C]" />
                    Empresa
                  </h3>
                  <p className="text-xs text-[#2F6F9C] font-semibold mt-0.5">
                    11–25 usuários
                  </p>
                  <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                    Para agências audiovisuais consolidadas com múltiplos projetos, squads e clientes simultâneos.
                  </p>
                </div>

                <div className="py-3 border-y border-[#DDE3E8]">
                  <span className="text-[11px] text-[#6B7280] block font-medium">Preço recomendado:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-[#111111] font-display">R$ 349,90</span>
                    <span className="text-xs font-medium text-[#6B7280]">/mês</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#111111]">
                  <span className="font-bold text-[#2F6F9C] uppercase tracking-wider block text-[10px]">
                    Tudo do Studio, mais:
                  </span>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C] shrink-0" />
                    <span><strong>11 a 25 usuários</strong> simultâneos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C] shrink-0" />
                    <span>Múltiplos fluxos de Kanban</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C] shrink-0" />
                    <span>Portal de Aprovação White-Label</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C] shrink-0" />
                    <span>Webhooks & Automações ilimitadas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#2F6F9C] shrink-0" />
                    <span>500 GB armazenamento 4K</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPlan('empresa')}
                className="w-full bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                id="btn-plan-empresa"
              >
                <span>Assinar Plano Empresa</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#66acd7]" />
              </button>
            </div>

            {/* PLANO AGÊNCIA */}
            <div className="p-6 rounded-3xl bg-[#F5F7F9] border border-[#DDE3E8] flex flex-col justify-between space-y-6 hover:border-[#8B5CF6] transition-all hover:shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold text-[#8B5CF6]">
                    <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    <span>Agência</span>
                  </div>
                  <span className="text-[10px] font-bold text-[#8B5CF6] uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                    26–50 usuários
                  </span>
                </div>

                <div>
                  <h3 className="font-display text-2xl font-black text-[#111111] uppercase flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-[#8B5CF6]" />
                    Agência
                  </h3>
                  <p className="text-xs text-[#8B5CF6] font-semibold mt-0.5">
                    26–50 usuários
                  </p>
                  <p className="text-xs text-[#6B7280] mt-2 leading-relaxed">
                    A estrutura corporativa completa para grandes agências, produtoras cinematográficas e redes.
                  </p>
                </div>

                <div className="py-3 border-y border-[#DDE3E8]">
                  <span className="text-[11px] text-[#6B7280] block font-medium">Preço recomendado:</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-black text-[#111111] font-display">R$ 599,90</span>
                    <span className="text-xs font-medium text-[#6B7280]">/mês</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-[#111111]">
                  <span className="font-bold text-[#8B5CF6] uppercase tracking-wider block text-[10px]">
                    Tudo do Empresa, mais:
                  </span>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span><strong>26 a 50 usuários</strong> com hierarquia</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>Armazenamento de 2 TB (Arquivos RAW/4K)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>API Aberta para sistemas legados</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>SLA 99.9% e backup em tempo real</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    <span>Onboarding assistido & Gerente dedicado</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleStartPlan('agencia')}
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                id="btn-plan-agencia"
              >
                <span>Contratar Plano Agência</span>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#111111] text-white py-12 px-4 sm:px-8 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="md" theme="dark" showTagline onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />

          <p className="text-xs text-gray-400 text-center md:text-left">
            StudioDesk — CRM Kanban para agências criativas, marketing audiovisual e produtoras.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('login')}
              className="text-xs text-gray-300 hover:text-white font-semibold"
            >
              Acesso ao Sistema
            </button>
            <span className="text-gray-600">•</span>
            <button
              onClick={() => setCurrentView('auth')}
              className="text-xs text-[#66acd7] hover:underline font-bold"
            >
              Criar conta
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
