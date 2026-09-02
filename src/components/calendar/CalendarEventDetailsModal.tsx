import React from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  FileText, 
  MapPin, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  Video, 
  Phone, 
  Presentation, 
  CheckSquare, 
  AlertCircle, 
  MoreHorizontal,
  RotateCcw,
  Building2
} from 'lucide-react';

interface CalendarEventDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  onEdit: (event: CalendarEvent) => void;
}

export const CalendarEventDetailsModal: React.FC<CalendarEventDetailsModalProps> = ({
  isOpen,
  onClose,
  event,
  onEdit
}) => {
  const { deleteCalendarEvent, updateCalendarEvent, setSelectedClientId, setCurrentView } = useApp();

  if (!isOpen || !event) return null;

  const handleDelete = () => {
    if (window.confirm('Tem certeza de que deseja excluir este evento da agenda?')) {
      deleteCalendarEvent(event.id);
      onClose();
    }
  };

  const handleToggleStatus = (newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    updateCalendarEvent(event.id, { status: newStatus });
    onClose();
  };

  const handleOpenClient = () => {
    if (event.clientId) {
      setSelectedClientId(event.clientId);
      setCurrentView('client_detail');
      onClose();
    }
  };

  const getEventBadge = () => {
    switch (event.type) {
      case 'meeting':
        return { label: 'Reunião', icon: Video, bg: 'bg-blue-100 text-[#2F6F9C] border-blue-200' };
      case 'call':
        return { label: 'Ligação / Call', icon: Phone, bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'follow_up':
        return { label: 'Follow-up', icon: Users, bg: 'bg-purple-100 text-[#8B5CF6] border-purple-200' };
      case 'presentation':
        return { label: 'Apresentação', icon: Presentation, bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'task':
        return { label: 'Gravação / Tarefa', icon: CheckSquare, bg: 'bg-cyan-100 text-cyan-800 border-cyan-200' };
      case 'deadline':
        return { label: 'Prazo Fatal', icon: AlertCircle, bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      default:
        return { label: 'Outro', icon: MoreHorizontal, bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  const badge = getEventBadge();
  const Icon = badge.icon;

  const formattedDate = new Date(event.date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Bar */}
        <div className="p-6 border-b border-[#DDE3E8] flex items-center justify-between bg-[#F5F7F9]">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{badge.label}</span>
            </span>

            {event.status === 'completed' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Concluído
              </span>
            )}

            {event.status === 'cancelled' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-600 text-white">
                <XCircle className="w-3.5 h-3.5" />
                Cancelado
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onClose();
                onEdit(event);
              }}
              className="p-2 rounded-xl text-[#6B7280] hover:text-[#111111] hover:bg-gray-200 transition-colors"
              title="Editar Evento"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              title="Excluir Evento"
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div>
            <h3 className="font-display text-xl font-black text-[#111111] uppercase tracking-tight">
              {event.title}
            </h3>
            {event.description && (
              <p className="text-xs text-[#6B7280] mt-1">
                {event.description}
              </p>
            )}
          </div>

          {/* Timing Info Card */}
          <div className="p-4 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-2">
            <div className="flex items-center gap-2.5 text-xs text-[#111111] font-semibold capitalize">
              <Calendar className="w-4 h-4 text-[#2F6F9C]" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#6B7280]">
              <Clock className="w-4 h-4 text-[#66acd7]" />
              <span>{event.startTime} às {event.endTime}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Responsible */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DDE3E8] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Responsável
              </span>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#111111] text-white flex items-center justify-center text-[10px] font-bold">
                  {event.assignedTo.charAt(0)}
                </div>
                <span className="font-bold text-[#111111]">{event.assignedTo}</span>
              </div>
            </div>

            {/* Client */}
            <div className="p-3.5 bg-white rounded-xl border border-[#DDE3E8] space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Cliente Associado
              </span>
              {event.clientName ? (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#2F6F9C] truncate">{event.clientName}</span>
                  {event.clientId && (
                    <button
                      onClick={handleOpenClient}
                      className="text-[#66acd7] hover:text-[#2F6F9C] p-1"
                      title="Ver Perfil do Cliente"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-gray-400 italic">Nenhum / Interno</span>
              )}
            </div>
          </div>

          {/* Location or Meeting Link */}
          {event.locationOrLink && (
            <div className="p-3.5 bg-white rounded-xl border border-[#DDE3E8] space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Localização / Link da Sala
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[#111111] truncate">
                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-medium truncate">{event.locationOrLink}</span>
                </div>
                {event.locationOrLink.startsWith('http') && (
                  <a
                    href={event.locationOrLink}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-[#2F6F9C] hover:bg-[#111111] text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shrink-0 flex items-center gap-1"
                  >
                    <span>Entrar</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="p-3.5 bg-white rounded-xl border border-[#DDE3E8] space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                Pauta & Observações
              </span>
              <p className="text-[#111111] whitespace-pre-wrap leading-relaxed">
                {event.notes}
              </p>
            </div>
          )}
        </div>

        {/* Quick Action Footer */}
        <div className="p-4 border-t border-[#DDE3E8] bg-[#F5F7F9] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {event.status !== 'completed' ? (
              <button
                onClick={() => handleToggleStatus('completed')}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Marcar como Concluído</span>
              </button>
            ) : (
              <button
                onClick={() => handleToggleStatus('scheduled')}
                className="bg-gray-200 hover:bg-gray-300 text-[#111111] text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reabrir Evento</span>
              </button>
            )}

            {event.status !== 'cancelled' && event.status !== 'completed' && (
              <button
                onClick={() => handleToggleStatus('cancelled')}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Cancelar</span>
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
      </div>
    </div>
  );
};
