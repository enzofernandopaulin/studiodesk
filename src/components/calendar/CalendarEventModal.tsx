import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent, CalendarEventType, CalendarEventStatus } from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  Users, 
  User, 
  FileText, 
  MapPin, 
  Tag, 
  CheckCircle2, 
  Video, 
  Phone, 
  Presentation, 
  CheckSquare, 
  AlertCircle, 
  MoreHorizontal 
} from 'lucide-react';

interface CalendarEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit?: CalendarEvent | null;
  defaultDate?: string;
}

export const CalendarEventModal: React.FC<CalendarEventModalProps> = ({
  isOpen,
  onClose,
  eventToEdit,
  defaultDate
}) => {
  const { clients, team, user, addCalendarEvent, updateCalendarEvent } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [clientId, setClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>(user.name);
  const [type, setType] = useState<CalendarEventType>('meeting');
  const [status, setStatus] = useState<CalendarEventStatus>('scheduled');
  const [locationOrLink, setLocationOrLink] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (eventToEdit) {
      setTitle(eventToEdit.title);
      setDescription(eventToEdit.description || '');
      setDate(eventToEdit.date);
      setStartTime(eventToEdit.startTime);
      setEndTime(eventToEdit.endTime);
      setClientId(eventToEdit.clientId || '');
      setClientName(eventToEdit.clientName || '');
      setAssignedTo(eventToEdit.assignedTo);
      setType(eventToEdit.type);
      setStatus(eventToEdit.status);
      setLocationOrLink(eventToEdit.locationOrLink || '');
      setNotes(eventToEdit.notes || '');
    } else {
      setTitle('');
      setDescription('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setEndTime('11:00');
      setClientId(clients[0]?.id || '');
      setClientName(clients[0]?.name || '');
      setAssignedTo(user.name);
      setType('meeting');
      setStatus('scheduled');
      setLocationOrLink('');
      setNotes('');
    }
  }, [eventToEdit, defaultDate, isOpen, clients, user.name]);

  if (!isOpen) return null;

  const handleClientChange = (selectedId: string) => {
    setClientId(selectedId);
    if (selectedId) {
      const selected = clients.find(c => c.id === selectedId);
      if (selected) {
        setClientName(selected.name);
      }
    } else {
      setClientName('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const assignedMember = team.find(m => m.name === assignedTo);

    if (eventToEdit) {
      updateCalendarEvent(eventToEdit.id, {
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        clientId: clientId || undefined,
        clientName: clientName.trim() || undefined,
        assignedTo,
        assignedAvatar: assignedMember?.avatar,
        type,
        status,
        locationOrLink: locationOrLink.trim() || undefined,
        notes: notes.trim() || undefined
      });
    } else {
      addCalendarEvent({
        title: title.trim(),
        description: description.trim(),
        date,
        startTime,
        endTime,
        clientId: clientId || undefined,
        clientName: clientName.trim() || undefined,
        assignedTo,
        assignedAvatar: assignedMember?.avatar,
        type,
        status,
        locationOrLink: locationOrLink.trim() || undefined,
        notes: notes.trim() || undefined
      });
    }

    onClose();
  };

  const eventTypeOptions: Array<{ id: CalendarEventType; label: string; icon: React.ElementType; color: string }> = [
    { id: 'meeting', label: 'Reunião', icon: Video, color: 'text-[#2F6F9C] bg-blue-50 border-blue-200' },
    { id: 'call', label: 'Ligação / Call', icon: Phone, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
    { id: 'follow_up', label: 'Follow-up', icon: Users, color: 'text-[#8B5CF6] bg-purple-50 border-purple-200' },
    { id: 'presentation', label: 'Apresentação', icon: Presentation, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { id: 'task', label: 'Gravação / Tarefa', icon: CheckSquare, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
    { id: 'deadline', label: 'Prazo Fatal', icon: AlertCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { id: 'other', label: 'Outro', icon: MoreHorizontal, color: 'text-gray-700 bg-gray-50 border-gray-200' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#DDE3E8] flex items-center justify-between bg-[#F5F7F9]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#111111] text-white flex items-center justify-center">
              <Calendar className="w-5 h-5 text-[#66acd7]" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold text-[#111111] uppercase tracking-tight">
                {eventToEdit ? 'Editar Evento da Agenda' : 'Novo Evento na Agenda'}
              </h3>
              <p className="text-xs text-[#6B7280]">
                Compromissos, alinhamentos, gravações e prazos de entrega.
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
              Título do Evento *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Reunião de alinhamento de roteiro"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C] focus:ring-1 focus:ring-[#2F6F9C]"
            />
          </div>

          {/* Event Type Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Tipo de Evento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eventTypeOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                      isSelected
                        ? 'border-[#111111] bg-[#111111] text-white shadow-xs'
                        : `${opt.color} hover:opacity-80`
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#66acd7]' : ''}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date and Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Hora de Início *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Hora de Término *
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />
            </div>
          </div>

          {/* Client & Responsible Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Cliente / Contato Associado
              </label>
              <select
                value={clientId}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              >
                <option value="">Nenhum / Evento Interno</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.company})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Responsável
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

          {/* Location or Meeting Link */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Link de Reunião / Local de Gravação
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#6B7280] absolute left-3 top-2.5" />
              <input
                type="text"
                value={locationOrLink}
                onChange={e => setLocationOrLink(e.target.value)}
                placeholder="Ex: https://meet.google.com/xyz ou Estúdio principal"
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
              />
            </div>
          </div>

          {/* Status (if editing) */}
          {eventToEdit && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                Status do Compromisso
              </label>
              <div className="flex gap-2">
                {(['scheduled', 'completed', 'cancelled'] as CalendarEventStatus[]).map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                      status === st
                        ? st === 'completed'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : st === 'cancelled'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-[#111111] text-white border-[#111111]'
                        : 'bg-[#F5F7F9] text-[#6B7280] border-[#DDE3E8] hover:bg-gray-200'
                    }`}
                  >
                    {st === 'scheduled' ? 'Agendado' : st === 'completed' ? 'Concluído' : 'Cancelado'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes / Description */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
              Observações & Pauta
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Alinhamento de trilha sonora, tempo de corte dos vídeos de reels e pauta comercial."
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
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#111111] hover:bg-[#2F6F9C] text-white transition-colors shadow-xs"
            >
              {eventToEdit ? 'Salvar Alterações' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
