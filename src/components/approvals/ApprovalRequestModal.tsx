import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ApprovalRequest, ApprovalCategory, ApprovalStatus, Priority } from '../../types';
import { uploadWorkspaceFile, isStorageReference } from '../../lib/storageRepository';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  Clock, 
  FolderKanban, 
  Users, 
  Building2, 
  FileVideo, 
  Image, 
  FileSpreadsheet, 
  Link as LinkIcon, 
  AlertCircle,
  UploadCloud,
  Loader2
} from 'lucide-react';

interface ApprovalRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestToEdit?: ApprovalRequest | null;
}

export const ApprovalRequestModal: React.FC<ApprovalRequestModalProps> = ({
  isOpen,
  onClose,
  requestToEdit
}) => {
  const { clients, projects, team, user, addApprovalRequest, updateApprovalRequest, addToast, isSupabaseConfigured, isAuthenticated } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState(user.name);
  const [category, setCategory] = useState<ApprovalCategory>('video');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('alta');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState<'video' | 'image' | 'document' | 'other'>('video');
  const [status, setStatus] = useState<ApprovalStatus>('pending');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (requestToEdit) {
      setTitle(requestToEdit.title);
      setDescription(requestToEdit.description);
      setClientId(requestToEdit.clientId);
      setProjectId(requestToEdit.projectId || '');
      setAssignedTo(requestToEdit.assignedTo);
      setCategory(requestToEdit.category);
      setDueDate(requestToEdit.dueDate);
      setPriority(requestToEdit.priority);
      setFileUrl(requestToEdit.fileUrl || '');
      setFileType(requestToEdit.fileType || 'video');
      setStatus(requestToEdit.status);
      setSelectedFile(null);
    } else {
      setTitle('');
      setDescription('');
      const defaultClient = clients[0]?.id || '';
      setClientId(defaultClient);
      const defaultClientProjects = projects.filter(p => p.clientId === defaultClient);
      setProjectId(defaultClientProjects[0]?.id || '');
      setAssignedTo(user.name);
      setCategory('video');
      // default dueDate in 3 days
      const d = new Date();
      d.setDate(d.getDate() + 3);
      setDueDate(d.toISOString().split('T')[0]);
      setPriority('alta');
      setFileUrl('');
      setFileType('video');
      setStatus('pending');
      setSelectedFile(null);
    }
  }, [requestToEdit, isOpen, clients, projects, user.name]);

  if (!isOpen) return null;

  const availableProjects = clientId ? projects.filter(p => p.clientId === clientId) : projects;

  const handleClientChange = (selectedClientId: string) => {
    setClientId(selectedClientId);
    const relatedProjects = projects.filter(p => p.clientId === selectedClientId);
    if (relatedProjects.length > 0) {
      setProjectId(relatedProjects[0].id);
    } else {
      setProjectId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !clientId) return;

    const selectedClient = clients.find(c => c.id === clientId);
    const selectedProject = projects.find(p => p.id === projectId);
    const assignedMember = team.find(m => m.name === assignedTo);

    let finalFileUrl = fileUrl.trim() || undefined;
    if (selectedFile) {
      if (!isSupabaseConfigured || !isAuthenticated) {
        addToast('warning', 'Supabase não configurado', 'Configure o Supabase para enviar arquivos diretamente para o Storage.');
        return;
      }
      try {
        setIsUploading(true);
        finalFileUrl = await uploadWorkspaceFile(user.id, selectedFile, 'approvals');
        addToast('success', 'Arquivo enviado', 'O material foi armazenado com segurança no Supabase Storage.');
      } catch (error) {
        console.error(error);
        addToast('error', 'Falha no upload', error instanceof Error ? error.message : 'Não foi possível enviar o arquivo.');
        return;
      } finally {
        setIsUploading(false);
      }
    }

    if (requestToEdit) {
      updateApprovalRequest(requestToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        clientId,
        clientName: selectedClient ? selectedClient.name : requestToEdit.clientName,
        projectId: projectId || undefined,
        projectTitle: selectedProject ? selectedProject.title : undefined,
        assignedTo,
        assignedAvatar: assignedMember?.avatar,
        category,
        dueDate,
        priority,
        fileUrl: finalFileUrl,
        fileType,
        status
      });
    } else {
      addApprovalRequest({
        title: title.trim(),
        description: description.trim(),
        clientId,
        clientName: selectedClient ? selectedClient.name : 'Cliente',
        projectId: projectId || undefined,
        projectTitle: selectedProject ? selectedProject.title : undefined,
        assignedTo,
        assignedAvatar: assignedMember?.avatar,
        category,
        dueDate,
        priority,
        fileUrl: finalFileUrl,
        fileType,
        status: 'pending'
      });
    }

    onClose();
  };

  const categories: Array<{ id: ApprovalCategory; label: string }> = [
    { id: 'video', label: 'Corte de Vídeo / Reels' },
    { id: 'roteiro', label: 'Roteiro / Copywriting' },
    { id: 'design', label: 'Design / Thumbnail / Arte' },
    { id: 'orcamento', label: 'Orçamento & Custos Extras' },
    { id: 'contrato', label: 'Contrato / Termo Aditivo' },
    { id: 'outro', label: 'Outro Entregável' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#DDE3E8] flex items-center justify-between bg-[#F5F7F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#66acd7]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                {requestToEdit ? 'Editar Solicitação de Aprovação' : 'Nova Solicitação de Aprovação'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                Envie cortes de vídeo, roteiros e orçamentos para validação formal do cliente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Title */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Título do Material para Aprovação *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Corte Final 4K — Vídeo Institucional V02"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
            />
          </div>

          {/* Client and Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Cliente Solicitante *
              </label>
              <select
                required
                value={clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              >
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Projeto Vinculado
              </label>
              <select
                value={projectId}
                onChange={e => setProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              >
                <option value="">Sem projeto específico</option>
                {availableProjects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Categoria do Material
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ApprovalCategory)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Due Date & Responsible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Prazo Limite para Resposta *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Responsável Interno
              </label>
              <select
                value={assignedTo}
                onChange={e => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              >
                <option value={user.name}>{user.name} (Você)</option>
                {team.map(m => (
                  <option key={m.id} value={m.name}>
                    {m.name} — {m.role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Media Link / URL */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Link de Acesso ao Arquivo / Vídeo / Documento
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                type="text"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="Ex: https://vimeo.com/xyz, Frame.io ou Google Drive"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />
            </div>
          </div>

          {/* Supabase Storage upload */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Arquivo no Supabase Storage
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border border-dashed border-[#DDE3E8] bg-[#F5F7F9] cursor-pointer hover:border-[#2F6F9C] transition-colors ${!isSupabaseConfigured || !isAuthenticated ? 'opacity-60' : ''}`}>
              <div className="w-9 h-9 rounded-lg bg-white border border-[#DDE3E8] flex items-center justify-center shrink-0">
                {isUploading ? <Loader2 className="w-4 h-4 text-[#2F6F9C] animate-spin" /> : <UploadCloud className="w-4 h-4 text-[#2F6F9C]" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[#111111] truncate">{selectedFile?.name || 'Selecionar arquivo do computador'}</p>
                <p className="text-[10px] text-[#6B7280]">Até 500 MB · vídeo, imagem, PDF, áudio e documentos</p>
              </div>
              <input
                type="file"
                className="hidden"
                disabled={!isSupabaseConfigured || !isAuthenticated || isUploading}
                accept="video/*,image/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
            </label>
            {fileUrl && !isStorageReference(fileUrl) && (
              <p className="mt-1.5 text-[10px] text-[#6B7280] truncate">Link externo atual: {fileUrl}</p>
            )}
          </div>

          {/* Description / Instructions for the Client */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Orientações & O que o Cliente Deve Avaliar *
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Por favor valide o ritmo da edição, correção de cor nas cenas do drone e pronúncia da locução em 00:34."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-[#DDE3E8] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#6B7280] hover:bg-[#F5F7F9] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#111111] hover:bg-[#2F6F9C] text-white transition-colors shadow-xs"
            >
              {requestToEdit ? 'Salvar Alterações' : 'Criar Solicitação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
