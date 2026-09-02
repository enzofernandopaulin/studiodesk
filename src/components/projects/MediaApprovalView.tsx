import React, { useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StorageAsset } from '../common/StorageAsset';
import { Project, ApprovalComment } from '../../types';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Share2, 
  Clock, 
  Send, 
  Sparkles, 
  FileVideo,
  Copy,
  ExternalLink,
  ThumbsUp,
  RotateCcw
} from 'lucide-react';

interface MediaApprovalProps {
  project: Project;
}

export const MediaApprovalView: React.FC<MediaApprovalProps> = ({ project }) => {
  const { updateProjectApproval, addToast, user, uploadProjectMedia, isSupabaseConfigured, isAuthenticated } = useApp();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingKind, setUploadingKind] = useState<'video' | 'thumbnail' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:42');
  const [newComment, setNewComment] = useState('');
  const [commentTime, setCommentTime] = useState('00:42');

  const media = project.mediaApproval || {
    id: `med_${project.id}`,
    title: `${project.title} — Nova versão`,
    version: 'V1',
    videoUrl: '',
    thumbnailUrl: '',
    status: 'pendente' as const,
    comments: [] as ApprovalComment[]
  };

  const handleApprove = () => {
    updateProjectApproval(project.id, 'aprovado', media.comments);
    addToast('success', 'Vídeo Aprovado!', `O cliente aprovou a versão ${media.version} deste projeto.`);
  };

  const handleRequestAdjustments = () => {
    updateProjectApproval(project.id, 'ajustes_solicitados', media.comments);
    addToast('info', 'Ajustes Solicitados', 'Notificação enviada para a equipe de edição.');
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newCommentObj: ApprovalComment = {
      id: `comm_${Date.now()}`,
      author: user.name,
      role: 'equipe',
      timecode: commentTime,
      text: newComment.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    const updatedComments = [...media.comments, newCommentObj];
    updateProjectApproval(project.id, media.status, updatedComments);
    setNewComment('');
    addToast('success', 'Comentário Adicionado', `Comentário inserido no minuto ${commentTime}.`);
  };

  const handleMediaUpload = async (file: File | undefined, kind: 'video' | 'thumbnail') => {
    if (!file) return;
    if (!isSupabaseConfigured || !isAuthenticated) {
      addToast('warning', 'Supabase não configurado', 'Configure o Supabase para usar o armazenamento de arquivos.');
      return;
    }
    try {
      setUploadingKind(kind);
      await uploadProjectMedia(project.id, file, kind);
      addToast('success', kind === 'video' ? 'Vídeo armazenado' : 'Thumbnail armazenada', 'O arquivo foi enviado ao Supabase Storage.');
    } catch (error) {
      console.error(error);
      addToast('error', 'Falha no upload', error instanceof Error ? error.message : 'Não foi possível enviar o arquivo.');
    } finally {
      setUploadingKind(null);
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
    }
  };

  const copyApprovalLink = () => {
    navigator.clipboard.writeText(`https://studiodesk.app/aprovacao/${project.id}?v=${media.version}`);
    addToast('success', 'Link Copiado', 'Link do portal de aprovação copiado para enviar ao cliente.');
  };

  return (
    <div className="space-y-6" id="media-approval-view">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-[#DDE3E8] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase bg-[#8B5CF6] text-white px-2 py-0.5 rounded">
              Versão {media.version}
            </span>
            <h3 className="font-display text-lg font-black text-[#111111] uppercase tracking-tight">
              {media.title}
            </h3>
          </div>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Portal de revisão sem ruídos de WhatsApp: comentários vinculados ao timecode do vídeo.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={copyApprovalLink}
            className="bg-[#F5F7F9] hover:bg-gray-200 text-[#111111] text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5 border border-[#DDE3E8]"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copiar Link do Cliente</span>
          </button>

          <button
            onClick={handleRequestAdjustments}
            className="bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Solicitar Ajuste</span>
          </button>

          <button
            onClick={handleApprove}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Aprovar Versão Final</span>
          </button>

          <input ref={videoInputRef} type="file" className="hidden" accept="video/*" onChange={e => handleMediaUpload(e.target.files?.[0], 'video')} />
          <input ref={thumbnailInputRef} type="file" className="hidden" accept="image/*" onChange={e => handleMediaUpload(e.target.files?.[0], 'thumbnail')} />
          <button onClick={() => videoInputRef.current?.click()} disabled={uploadingKind !== null} className="bg-[#F5F7F9] hover:bg-gray-200 text-[#111111] text-xs font-bold px-3 py-2 rounded-xl border border-[#DDE3E8] flex items-center gap-1.5">
            {uploadingKind === 'video' ? 'Enviando vídeo…' : 'Trocar vídeo'}
          </button>
          <button onClick={() => thumbnailInputRef.current?.click()} disabled={uploadingKind !== null} className="bg-[#F5F7F9] hover:bg-gray-200 text-[#111111] text-xs font-bold px-3 py-2 rounded-xl border border-[#DDE3E8] flex items-center gap-1.5">
            {uploadingKind === 'thumbnail' ? 'Enviando…' : 'Trocar thumbnail'}
          </button>
        </div>
      </div>

      {/* Video Player & Timecoded Comments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Video Player (8 cols) */}
        <div className="lg:col-span-8 bg-black rounded-3xl overflow-hidden border border-[#111111] shadow-xl flex flex-col justify-between aspect-video relative group">
          {/* Video Preview Image */}
          <StorageAsset reference={media.thumbnailUrl}>
            {(resolvedUrl) => (
              <img src={resolvedUrl || media.thumbnailUrl} alt="Video Preview" className="w-full h-full object-cover opacity-85" />
            )}
          </StorageAsset>

          {/* Central Play/Pause button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-16 h-16 rounded-full bg-[#66acd7]/90 hover:bg-[#66acd7] text-[#111111] flex items-center justify-center transition-transform hover:scale-105 shadow-2xl backdrop-blur-xs"
            >
              {isPlaying ? <Pause className="w-7 h-7 fill-current" /> : <Play className="w-7 h-7 fill-current translate-x-0.5" />}
            </button>
          </div>

          {/* Bottom Player Controls */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 space-y-2">
            {/* Progress Bar with markers */}
            <div className="relative w-full h-2 bg-white/20 rounded-full cursor-pointer overflow-hidden">
              <div className="h-full bg-[#66acd7] w-[42%]" />
              {/* Comment markers */}
              <div className="absolute left-[15%] top-0 bottom-0 w-1.5 bg-amber-400 rounded-full" title="Comentário em 00:15" />
              <div className="absolute left-[42%] top-0 bottom-0 w-1.5 bg-[#8B5CF6] rounded-full" title="Comentário em 00:42" />
            </div>

            <div className="flex items-center justify-between text-white text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold">{currentTime}</span>
                <span className="text-gray-400">/ 01:45</span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">4K 60FPS</span>
              </div>
              <div className="text-[11px] text-[#66acd7] font-semibold">
                Status: {media.status === 'aprovado' ? 'APROVADO' : 'AGUARDANDO APROVAÇÃO'}
              </div>
            </div>
          </div>
        </div>

        {/* Timecode Comments Sidebar (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-[#DDE3E8] p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#2F6F9C]" />
                <h4 className="font-display text-xs font-black text-[#111111] uppercase tracking-tight">
                  Comentários por Minutagem ({media.comments.length})
                </h4>
              </div>
              <span className="text-[10px] font-bold text-[#6B7280]">Timecode</span>
            </div>

            {/* Comment list */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {media.comments.map(c => (
                <div
                  key={c.id}
                  onClick={() => setCurrentTime(c.timecode)}
                  className="p-3 bg-[#F5F7F9] hover:bg-blue-50/40 rounded-xl border border-[#DDE3E8] text-xs cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#111111]">{c.author}</span>
                    <span className="text-[10px] font-mono font-bold bg-[#66acd7]/20 text-[#2F6F9C] px-1.5 py-0.5 rounded">
                      {c.timecode}
                    </span>
                  </div>
                  <p className="text-[#6B7280] text-[11px] leading-relaxed">{c.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Add new timecoded comment */}
          <form onSubmit={handleAddComment} className="pt-3 border-t border-[#DDE3E8] space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-[#6B7280]">Timecode:</span>
              <input
                type="text"
                value={commentTime}
                onChange={e => setCommentTime(e.target.value)}
                placeholder="00:42"
                className="w-16 px-2 py-1 bg-[#F5F7F9] border border-[#DDE3E8] rounded-lg text-xs font-mono font-bold text-center text-[#111111]"
              />
            </div>

            <div className="relative">
              <textarea
                rows={2}
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Adicionar nota ou ajuste no ponto exato do vídeo..."
                className="w-full p-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5 text-[#66acd7]" />
              <span>Inserir Comentário</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
