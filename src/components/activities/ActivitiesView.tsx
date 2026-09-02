import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Activity, 
  Search, 
  Filter, 
  Sparkles, 
  CheckCircle2, 
  FolderKanban, 
  Users, 
  MessageSquare, 
  FileVideo,
  Clock
} from 'lucide-react';

export const ActivitiesView: React.FC = () => {
  const { timelineEvents = [], user } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('todos');

  const eventsList = timelineEvents || [];

  const filteredEvents = eventsList.filter(e => {
    const matchesSearch = 
      (e.actor || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.action || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.details && e.details.toLowerCase().includes(searchQuery.toLowerCase()));
    const eventCategory = e.category || (e as any).type || '';
    const matchesType = filterType === 'todos' || eventCategory === filterType;
    return matchesSearch && matchesType;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'lead':
        return <Sparkles className="w-4 h-4 text-[#8B5CF6]" />;
      case 'cliente':
        return <Users className="w-4 h-4 text-[#2F6F9C]" />;
      case 'projeto':
        return <FolderKanban className="w-4 h-4 text-[#66acd7]" />;
      case 'tarefa':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'aprovacao':
        return <FileVideo className="w-4 h-4 text-pink-600" />;
      case 'comunicacao':
        return <MessageSquare className="w-4 h-4 text-sky-600" />;
      default:
        return <Activity className="w-4 h-4 text-[#6B7280]" />;
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="activities-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
            Atividades & Histórico Operacional
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Rastreabilidade completa de todas as ações de leads, projetos, clientes e aprovações.
          </p>
        </div>

        <div className="text-xs font-semibold text-[#6B7280]">
          Total de <strong>{eventsList.length} eventos</strong> registrados
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-[#DDE3E8] flex flex-col md:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {[
            { id: 'todos', label: 'Todos os Eventos' },
            { id: 'projeto', label: 'Projetos & Kanban' },
            { id: 'lead', label: 'Leads do Site' },
            { id: 'cliente', label: 'Clientes' },
            { id: 'aprovacao', label: 'Aprovações' },
            { id: 'tarefa', label: 'Tarefas' },
            { id: 'comunicacao', label: 'Comunicação' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterType === f.id ? 'bg-[#111111] text-white' : 'text-[#6B7280] hover:bg-[#F5F7F9]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por ator, ação ou detalhe..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-xs text-[#111111] focus:bg-white focus:outline-none focus:border-[#66acd7]"
          />
        </div>
      </div>

      {/* Timeline Stream */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#DDE3E8] shadow-2xs space-y-6">
        <div className="space-y-6 border-l-2 border-[#DDE3E8] pl-6 ml-3">
          {filteredEvents.map(evt => {
            const eventCat = evt.category || (evt as any).type || 'evento';
            return (
              <div key={evt.id} className="relative space-y-1.5">
                {/* Dot Icon */}
                <div className="w-8 h-8 rounded-xl bg-white border border-[#DDE3E8] shadow-2xs absolute -left-[43px] top-0 flex items-center justify-center">
                  {getIconForType(eventCat)}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[#111111]">{evt.actor}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.2 rounded-full bg-[#F5F7F9] text-[#6B7280] border border-[#DDE3E8]">
                      {eventCat}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-[#6B7280]">
                    <Clock className="w-3 h-3" />
                    <span>{evt.timeString}</span>
                  </div>
                </div>

                <p className="text-xs font-semibold text-[#2F6F9C]">
                  {evt.action}
                </p>

                {evt.details && (
                  <p className="text-xs text-[#6B7280] bg-[#F5F7F9] p-3 rounded-xl border border-[#DDE3E8]/80 leading-relaxed">
                    {evt.details}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
