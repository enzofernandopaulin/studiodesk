import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageAsset } from '../common/StorageAsset';
import { ApprovalRequest, ApprovalStatus } from '../../types';
import { 
  X, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Clock, 
  Calendar, 
  User, 
  Building2, 
  FolderKanban, 
  ExternalLink, 
  Copy, 
  Check, 
  Edit3, 
  Trash2, 
  FileVideo, 
  MessageSquare, 
  AlertCircle,
  FileText,
  Send
} from 'lucide-react';

interface ApprovalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ApprovalRequest | null;
  onEdit: (req: ApprovalRequest) => void;
}

export const ApprovalDetailModal: React.FC<ApprovalDetailModalProps> = ({
  isOpen,
  onClose,
  request,
  onEdit
}) => {
  const { 
    updateApprovalStatus, 
    deleteApprovalRequest, 
    setSelectedClientId, 
    setSelectedProjectId, 
    setCurrentView 
  } = useApp();

  const [copiedLink, setCopiedLink] = useState(false);
  const [activeAction, setActiveAction] = useState<'none' | 'approve' | 'revision' | 'reject'>('none');
  const [feedbackInput, setFeedbackInput] = useState('');

  if (!isOpen || !request) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://app.studiodesk.com.br/portal-aprovacao/${request.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDelete = () => {
    if (window.confirm('Tem certeza de que deseja remover esta solicitação de aprovação?')) {
      deleteApprovalRequest(request.id);
      onClose();
    }
  };

  const handleApplyStatus = (newStatus: ApprovalStatus) => {
    updateApprovalStatus(request.id, newStatus, feedbackInput.trim() || undefined);
    setActiveAction('none');
    setFeedbackInput('');
    onClose();
  };

  const getStatusBadge = (status: ApprovalStatus) => {
    switch (status) {
      case 'approved':
        return { label: 'Aprovado pelo Cliente', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 };
      case 'needs_revision':
        return { label: 'Ajustes Solicitados', bg: 'bg-amber-100 text-amber-800 border-amber-200', icon: RotateCcw };
      case 'rejected':
        return { label: 'Recusado / Reprovado', bg: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle };
      case 'in_review':
        return { label: 'Em Análise pelo Cliente', bg: 'bg-blue-100 text-[#2F6F9C] border-blue-200', icon: Clock };
      default:
        return { label: 'Pendente de Envio', bg: 'bg-gray-100 text-gray-800 border-gray-200', icon: Clock };
    }
  };

  const statusBadge = getStatusBadge(request.status);
  const StatusIcon = statusBadge.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#DDE3E8] flex items-center justify-between bg-[#F5F7F9]">
          <div className="flex items-center gap-2.5">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              <span>{statusBadge.label}</span>
            </span>

            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
              request.priority === 'urgente' ? 'bg-rose-600 text-white' :
              request.priority === 'alta' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
            }`}>
              {request.priority}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEdit(request);
              }}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-gray-200 transition-colors"
              title="Editar"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6F9C] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {request.category.toUpperCase()}
            </span>
            <h3 className="font-display text-xl sm:text-2xl font-black text-[#111111] uppercase tracking-tight mt-2">
              {request.title}
            </h3>
            <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
              {request.description}
            </p>
          </div>

          {/* Key Context Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Client */}
            <div className="p-3.5 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Cliente
              </span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111111] truncate">{request.clientName}</span>
                <button
                  onClick={() => {
                    setSelectedClientId(request.clientId);
                    setCurrentView('client_detail');
                    onClose();
                  }}
                  className="text-[#2F6F9C] hover:text-[#111111] p-0.5"
                  title="Ver perfil"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Project */}
            <div className="p-3.5 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Projeto
              </span>
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111111] truncate">
                  {request.projectTitle || 'Sem projeto'}
                </span>
                {request.projectId && (
                  <button
                    onClick={() => {
                      setSelectedProjectId(request.projectId);
                      setCurrentView('project_detail');
                      onClose();
                    }}
                    className="text-[#2F6F9C] hover:text-[#111111] p-0.5"
                    title="Ver projeto"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Deadline */}
            <div className="p-3.5 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Prazo de Resposta
              </span>
              <div className="flex items-center gap-1.5 font-bold text-[#111111]">
                <Calendar className="w-3.5 h-3.5 text-[#2F6F9C]" />
                <span>{new Date(request.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Media / File Link Card */}
          {request.fileUrl && (
            <StorageAsset reference={request.fileUrl}>
              {(resolvedUrl, loading) => (
                <div className="p-4 bg-white rounded-2xl border border-[#DDE3E8] space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    Material Submetido
                  </span>
                  <div className="flex items-center justify-between gap-3 p-2.5 bg-[#F5F7F9] rounded-xl border border-[#DDE3E8]">
                    <div className="flex items-center gap-2 truncate text-[#111111]">
                      <FileVideo className="w-4 h-4 text-[#2F6F9C] shrink-0" />
                      <span className="font-mono text-xs truncate">{loading ? 'Gerando acesso seguro…' : (request.fileUrl?.startsWith('storage://') ? 'Arquivo privado do Supabase Storage' : request.fileUrl)}</span>
                    </div>
                    {resolvedUrl && (
                      <a href={resolvedUrl} target="_blank" rel="noreferrer" className="bg-[#111111] hover:bg-[#2F6F9C] text-white font-bold text-xs px-3 py-1.5 rounded-lg shrink-0 flex items-center gap-1 transition-colors">
                        <span>Abrir</span><ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </StorageAsset>
          )}

          {/* Client Portal Link Sharer */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#2F6F9C] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                Link Direto para o Cliente (Portal Sem Senha)
              </span>
              <button
                onClick={handleCopyLink}
                className="bg-white hover:bg-gray-100 text-[#111111] border border-blue-200 font-bold px-2.5 py-1 rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#2F6F9C]" />}
                <span>{copiedLink ? 'Copiado!' : 'Copiar Link'}</span>
              </button>
            </div>
            <p className="text-[#6B7280] text-[11px]">
              Envie este link por e-mail ou WhatsApp corporativo para o cliente revisar e assinar digitalmente a aprovação do material sem precisar de login.
            </p>
          </div>

          {/* Feedback & Review Record */}
          {(request.feedbackNotes || request.rejectionReason || request.revisionNotes) && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-[#DDE3E8] space-y-2 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Histórico de Feedback Registrado
              </span>
              {request.reviewedBy && (
                <p className="text-[11px] text-[#6B7280]">
                  Registrado por <strong>{request.reviewedBy}</strong> em {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString('pt-BR') : 'data recente'}
                </p>
              )}
              <p className="p-3 bg-white rounded-xl border border-[#DDE3E8] text-[#111111] whitespace-pre-wrap">
                {request.feedbackNotes || request.revisionNotes || request.rejectionReason}
              </p>
            </div>
          )}

          {/* Dynamic Action Input Box (Approve / Revision / Reject) */}
          {activeAction !== 'none' && (
            <div className="p-4 rounded-2xl border bg-white space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111111] uppercase tracking-wider">
                  {activeAction === 'approve' && 'Confirmar Aprovação do Material'}
                  {activeAction === 'revision' && 'Descrever Ajustes Solicitados'}
                  {activeAction === 'reject' && 'Motivo da Recusa / Reprovação'}
                </h4>
                <button
                  onClick={() => setActiveAction('none')}
                  className="text-xs text-[#6B7280] hover:text-[#111111]"
                >
                  Cancelar
                </button>
              </div>

              <textarea
                rows={3}
                value={feedbackInput}
                onChange={e => setFeedbackInput(e.target.value)}
                placeholder={
                  activeAction === 'approve' ? 'Ex: Versão aprovada sem ressalvas pelo Diretor de Marketing.' :
                  activeAction === 'revision' ? 'Ex: Alterar corte aos 00:22 e ajustar vinheta final com nova logo.' :
                  'Ex: Material não atende ao briefing inicial. Necessário refazer roteiro.'
                }
                className="w-full p-2.5 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeAction === 'approve') handleApplyStatus('approved');
                    else if (activeAction === 'revision') handleApplyStatus('needs_revision');
                    else if (activeAction === 'reject') handleApplyStatus('rejected');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs ${
                    activeAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    activeAction === 'revision' ? 'bg-amber-600 hover:bg-amber-700' :
                    'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Confirmar Status
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        {activeAction === 'none' && (
          <div className="p-4 border-t border-[#DDE3E8] bg-[#F5F7F9] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {request.status !== 'approved' && (
                <button
                  onClick={() => setActiveAction('approve')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Aprovar</span>
                </button>
              )}

              {request.status !== 'needs_revision' && (
                <button
                  onClick={() => setActiveAction('revision')}
                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Solicitar Ajustes</span>
                </button>
              )}

              {request.status !== 'rejected' && (
                <button
                  onClick={() => setActiveAction('reject')}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Recusar</span>
                </button>
              )}

              {request.status === 'pending' && (
                <button
                  onClick={() => handleApplyStatus('in_review')}
                  className="bg-blue-50 hover:bg-blue-100 text-[#2F6F9C] border border-blue-200 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Em Análise</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xs font-semibold text-[#6B7280] hover:text-[#111111] px-3 py-2 rounded-xl"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
