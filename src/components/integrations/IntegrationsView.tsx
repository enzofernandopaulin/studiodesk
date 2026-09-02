import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Globe, 
  MessageSquare, 
  HardDrive, 
  Share2, 
  CheckCircle2, 
  Power, 
  ExternalLink, 
  Sparkles, 
  Code,
  ShieldCheck
} from 'lucide-react';

export const IntegrationsView: React.FC = () => {
  const { integrations, toggleIntegration, addToast, user } = useApp();
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/leads`);
    setCopiedWebhook(true);
    addToast('success', 'URL do Webhook Copiada', 'Integre formulários externos via POST + segredo do webhook. O workspaceId define o destino do lead.');
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Globe': return <Globe className="w-6 h-6 text-[#2F6F9C]" />;
      case 'MessageSquare': return <MessageSquare className="w-6 h-6 text-emerald-600" />;
      case 'HardDrive': return <HardDrive className="w-6 h-6 text-blue-500" />;
      case 'Share2': return <Share2 className="w-6 h-6 text-purple-600" />;
      default: return <Sparkles className="w-6 h-6 text-[#66acd7]" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="integrations-view">
      {/* Header */}
      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
          Integrações & Conexões
        </h2>
        <p className="text-xs sm:text-sm text-[#6B7280]">
          Conecte seu site institucional, WhatsApp, Google Drive e formulários externos diretamente ao StudioDesk.
        </p>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(integ => (
          <div
            key={integ.id}
            className="p-6 bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs flex flex-col justify-between space-y-6"
            id={`integration-card-${integ.id}`}
          >
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#F5F7F9] flex items-center justify-center border border-[#DDE3E8]">
                  {getIcon(integ.icon)}
                </div>

                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  integ.status === 'conectado' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {integ.status === 'conectado' && <CheckCircle2 className="w-3 h-3" />}
                  {integ.status === 'conectado' ? 'Conectado' : 'Disponível'}
                </span>
              </div>

              <div>
                <h3 className="font-display text-lg font-black text-[#111111] uppercase tracking-tight">
                  {integ.name}
                </h3>
                <p className="text-xs text-[#6B7280] mt-1 leading-relaxed">
                  {integ.description}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-[#DDE3E8] flex items-center justify-between">
              <button
                onClick={() => toggleIntegration(integ.id)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 ${
                  integ.status === 'conectado'
                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-[#111111] hover:bg-[#2F6F9C] text-white'
                }`}
              >
                <Power className="w-3.5 h-3.5" />
                <span>{integ.status === 'conectado' ? 'Desconectar' : 'Conectar Agora'}</span>
              </button>

              {integ.status === 'conectado' && (
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Sincronização Ativa
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Webhook & Custom API Card */}
      <div className="p-6 bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Code className="w-5 h-5 text-[#8B5CF6]" />
          <h3 className="font-display text-base font-black text-[#111111] uppercase tracking-tight">
            Webhook Direto para Captação de Leads
          </h3>
        </div>
        <p className="text-xs text-[#6B7280]">
          Envie os dados de qualquer formulário para a API Serverless abaixo. Com o segredo configurado, os leads entram diretamente no funil do workspace informado.
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            readOnly
            value={`${window.location.origin}/api/webhooks/leads`}
            className="flex-1 px-4 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs font-mono text-[#111111]"
          />
          <button
            onClick={handleCopyWebhook}
            className="bg-[#2F6F9C] hover:bg-[#111111] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shrink-0"
          >
            {copiedWebhook ? 'Copiado!' : 'Copiar URL do Webhook'}
          </button>
        </div>
      </div>
    </div>
  );
};
