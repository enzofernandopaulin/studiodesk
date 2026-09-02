import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CalendarEvent, CalendarEventType, CalendarEventStatus } from '../../types';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Video, 
  Phone, 
  Presentation, 
  CheckSquare, 
  AlertCircle, 
  MoreHorizontal,
  Users, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Search, 
  CalendarDays, 
  CalendarRange, 
  Sun,
  MapPin,
  Check,
  Building2,
  Edit3
} from 'lucide-react';
import { CalendarEventModal } from './CalendarEventModal';
import { CalendarEventDetailsModal } from './CalendarEventDetailsModal';
import { EmptyState } from '../common/EmptyState';

type ViewMode = 'month' | 'week' | 'day';

export const CalendarView: React.FC = () => {
  const { 
    calendarEvents = [], 
    clients, 
    team, 
    user, 
    updateCalendarEvent 
  } = useApp();

  // Active Date State
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
    } else if (viewMode === 'week') {
      const prevWeek = new Date(currentDate);
      prevWeek.setDate(prevWeek.getDate() - 7);
      setCurrentDate(prevWeek);
    } else {
      const prevDay = new Date(currentDate);
      prevDay.setDate(prevDay.getDate() - 1);
      setCurrentDate(prevDay);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
    } else if (viewMode === 'week') {
      const nextWeek = new Date(currentDate);
      nextWeek.setDate(nextWeek.getDate() + 7);
      setCurrentDate(nextWeek);
    } else {
      const nextDay = new Date(currentDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCurrentDate(nextDay);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenCreateModal = (dateStr?: string) => {
    setEventToEdit(null);
    setModalDefaultDate(dateStr || currentDate.toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return calendarEvents.filter(event => {
      const matchesType = typeFilter === 'all' || event.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
      const matchesSearch = searchQuery.trim() === '' || 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (event.clientName && event.clientName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.assignedTo && event.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (event.description && event.description.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesType && matchesStatus && matchesSearch;
    });
  }, [calendarEvents, typeFilter, statusFilter, searchQuery]);

  // Calendar calculations for Month View
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
  
  // Previous month trailing days
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const trailingDaysCount = firstDayOfWeek;

  // Next month leading days to complete grid of 35 or 42
  const totalSlots = Math.ceil((daysInMonth + trailingDaysCount) / 7) * 7;
  const leadingDaysCount = totalSlots - (daysInMonth + trailingDaysCount);

  // Helper for formatting date as YYYY-MM-DD
  const formatYMD = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for event color and style
  const getEventTypeConfig = (type: CalendarEventType) => {
    switch (type) {
      case 'meeting':
        return { label: 'Reunião', icon: Video, bg: 'bg-blue-50 text-[#2F6F9C] border-blue-200 hover:bg-blue-100' };
      case 'call':
        return { label: 'Call', icon: Phone, bg: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' };
      case 'follow_up':
        return { label: 'Follow-up', icon: Users, bg: 'bg-purple-50 text-[#8B5CF6] border-purple-200 hover:bg-purple-100' };
      case 'presentation':
        return { label: 'Apresentação', icon: Presentation, bg: 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100' };
      case 'task':
        return { label: 'Gravação', icon: CheckSquare, bg: 'bg-cyan-50 text-cyan-800 border-cyan-200 hover:bg-cyan-100' };
      case 'deadline':
        return { label: 'Prazo', icon: AlertCircle, bg: 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100' };
      default:
        return { label: 'Outro', icon: MoreHorizontal, bg: 'bg-gray-50 text-gray-800 border-gray-200 hover:bg-gray-100' };
    }
  };

  // Week View Calculations
  const getWeekDates = (date: Date) => {
    const current = new Date(date);
    const day = current.getDay();
    const diff = current.getDate() - day; // start on Sunday
    const sunday = new Date(current.setDate(diff));
    
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(sunday);
      nextDay.setDate(sunday.getDate() + i);
      week.push(nextDay);
    }
    return week;
  };

  const weekDates = getWeekDates(currentDate);

  // Time Slots for Day & Week views (08:00 to 20:00)
  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  const currentDateYMD = currentDate.toISOString().split('T')[0];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="calendar-agenda-view">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
              Agenda & Compromissos CRM
            </h2>
            <span className="bg-[#66acd7]/20 text-[#2F6F9C] text-xs font-bold px-2.5 py-0.5 rounded-full">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Gerencie reuniões com clientes, diárias de captação, apresentações e prazos de entrega.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Switcher */}
          <div className="flex items-center bg-white border border-[#DDE3E8] p-1 rounded-xl shadow-2xs text-xs font-bold">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'day' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Dia</span>
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'week' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Semana</span>
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                viewMode === 'month' ? 'bg-[#111111] text-white shadow-xs' : 'text-[#6B7280] hover:text-[#111111]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Mês</span>
            </button>
          </div>

          {/* New Event Button */}
          <button
            onClick={() => handleOpenCreateModal()}
            className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-2"
            id="btn-new-calendar-event"
          >
            <Plus className="w-4 h-4 text-[#66acd7]" />
            <span>Novo Evento</span>
          </button>
        </div>
      </div>

      {/* Date Navigation & Filter Bar */}
      <div className="bg-white rounded-2xl border border-[#DDE3E8] p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 rounded-xl border border-[#DDE3E8] text-xs font-bold text-[#111111] hover:bg-[#F5F7F9] transition-colors"
          >
            Hoje
          </button>

          <div className="flex items-center bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl p-0.5">
            <button
              onClick={handlePrev}
              className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-white rounded-lg transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-[#6B7280] hover:text-[#111111] hover:bg-white rounded-lg transition-colors"
              title="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-base font-bold text-[#111111] px-2 capitalize">
            {viewMode === 'month' && `${monthNames[currentMonth]} de ${currentYear}`}
            {viewMode === 'week' && `Semana de ${weekDates[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} a ${weekDates[6].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            {viewMode === 'day' && currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </h3>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Date Picker */}
          <div className="relative">
            <input
              type="date"
              value={currentDateYMD}
              onChange={e => {
                if (e.target.value) {
                  const [y, m, d] = e.target.value.split('-').map(Number);
                  setCurrentDate(new Date(y, m - 1, d));
                }
              }}
              className="px-2.5 py-1.5 rounded-xl border border-[#DDE3E8] text-xs text-[#111111] bg-white focus:outline-none focus:border-[#2F6F9C]"
            />
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6B7280] absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar evento ou cliente..."
              className="w-40 sm:w-48 pl-8 pr-3 py-1.5 rounded-xl border border-[#DDE3E8] text-xs focus:outline-none focus:border-[#2F6F9C]"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[#DDE3E8] text-xs text-[#111111] bg-white focus:outline-none focus:border-[#2F6F9C]"
          >
            <option value="all">Todos os tipos</option>
            <option value="meeting">Reuniões</option>
            <option value="call">Ligações / Calls</option>
            <option value="follow_up">Follow-ups</option>
            <option value="presentation">Apresentações</option>
            <option value="task">Gravações / Tarefas</option>
            <option value="deadline">Prazos Fatais</option>
            <option value="other">Outros</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-[#DDE3E8] text-xs text-[#111111] bg-white focus:outline-none focus:border-[#2F6F9C]"
          >
            <option value="all">Todos os status</option>
            <option value="scheduled">Agendados</option>
            <option value="completed">Concluídos</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>
      </div>

      {/* VIEW: MONTH (MÊS) */}
      {viewMode === 'month' && (
        <div className="bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-[#DDE3E8] bg-[#F5F7F9] text-center text-[11px] font-bold uppercase text-[#6B7280] py-3">
            <div>Dom</div>
            <div>Seg</div>
            <div>Ter</div>
            <div>Qua</div>
            <div>Qui</div>
            <div>Sex</div>
            <div>Sáb</div>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 min-h-[600px]">
            {/* Trailing days from previous month */}
            {Array.from({ length: trailingDaysCount }).map((_, idx) => {
              const dayNum = prevMonthDays - trailingDaysCount + idx + 1;
              return (
                <div key={`prev-${idx}`} className="bg-gray-50/50 p-2 text-gray-300 text-xs font-mono min-h-[110px]">
                  {dayNum}
                </div>
              );
            })}

            {/* Days in active month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const dateStr = formatYMD(currentYear, currentMonth, day);
              const dayEvents = filteredEvents.filter(e => e.date === dateStr);
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === currentDateYMD;

              return (
                <div
                  key={`curr-${day}`}
                  onClick={() => {
                    setCurrentDate(new Date(currentYear, currentMonth, day));
                  }}
                  className={`p-2 min-h-[110px] flex flex-col justify-between transition-colors group cursor-pointer ${
                    isToday 
                      ? 'bg-blue-50/40 ring-1 ring-inset ring-[#66acd7]' 
                      : isSelected
                      ? 'bg-[#F5F7F9]'
                      : 'hover:bg-[#F9FAFB]'
                  }`}
                >
                  {/* Day number header & quick add */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${
                      isToday 
                        ? 'text-white bg-[#2F6F9C] w-6 h-6 rounded-full flex items-center justify-center' 
                        : isSelected
                        ? 'text-[#2F6F9C] font-black'
                        : 'text-[#111111]'
                    }`}>
                      {day}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreateModal(dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-[#6B7280] hover:text-[#111111] hover:bg-white rounded-lg transition-all"
                      title={`Adicionar evento em ${day}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Day Events List */}
                  <div className="space-y-1 my-1 flex-1 overflow-hidden">
                    {dayEvents.slice(0, 3).map(evt => {
                      const config = getEventTypeConfig(evt.type);
                      const Icon = config.icon;
                      const isDone = evt.status === 'completed';
                      const isCanc = evt.status === 'cancelled';

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(evt);
                          }}
                          className={`p-1.5 rounded-lg text-[10px] font-semibold border transition-all truncate flex items-center justify-between gap-1 shadow-2xs ${
                            isDone 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 opacity-75' 
                              : isCanc
                              ? 'bg-rose-50 text-rose-800 border-rose-200 line-through opacity-60'
                              : config.bg
                          }`}
                          title={`${evt.startTime} - ${evt.title} (${evt.clientName || 'Interno'})`}
                        >
                          <div className="flex items-center gap-1 min-w-0 truncate">
                            <Icon className="w-3 h-3 shrink-0" />
                            <span className="truncate">{evt.startTime} {evt.title}</span>
                          </div>
                          {isDone && <Check className="w-3 h-3 text-emerald-700 shrink-0" />}
                        </div>
                      );
                    })}

                    {dayEvents.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentDate(new Date(currentYear, currentMonth, day));
                          setViewMode('day');
                        }}
                        className="text-[10px] font-bold text-[#2F6F9C] hover:underline block pt-0.5"
                      >
                        +{dayEvents.length - 3} mais
                      </button>
                    )}
                  </div>

                  <div />
                </div>
              );
            })}

            {/* Leading days from next month */}
            {Array.from({ length: leadingDaysCount }).map((_, idx) => (
              <div key={`next-${idx}`} className="bg-gray-50/50 p-2 text-gray-300 text-xs font-mono min-h-[110px]">
                {idx + 1}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: WEEK (SEMANA) */}
      {viewMode === 'week' && (
        <div className="bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs overflow-hidden">
          {/* Week column headers */}
          <div className="grid grid-cols-7 border-b border-[#DDE3E8] bg-[#F5F7F9] divide-x divide-[#DDE3E8]">
            {weekDates.map((wDate, idx) => {
              const dStr = wDate.toISOString().split('T')[0];
              const isToday = dStr === todayStr;
              const isSelected = dStr === currentDateYMD;
              const dayEvts = filteredEvents.filter(e => e.date === dStr);

              return (
                <div 
                  key={idx}
                  onClick={() => setCurrentDate(wDate)}
                  className={`p-3 text-center cursor-pointer transition-colors ${
                    isToday ? 'bg-blue-50/60' : isSelected ? 'bg-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <p className="text-[10px] font-bold uppercase text-[#6B7280]">
                    {wDate.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <p className={`text-base font-black font-display mt-0.5 ${
                    isToday ? 'text-[#2F6F9C]' : 'text-[#111111]'
                  }`}>
                    {wDate.getDate()}
                  </p>
                  <span className="text-[10px] text-[#6B7280]">
                    {dayEvts.length} {dayEvts.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Week content columns */}
          <div className="grid grid-cols-1 sm:grid-cols-7 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 min-h-[450px]">
            {weekDates.map((wDate, idx) => {
              const dStr = wDate.toISOString().split('T')[0];
              const dayEvts = filteredEvents.filter(e => e.date === dStr);

              return (
                <div key={idx} className="p-3 space-y-2 bg-white">
                  <div className="flex items-center justify-between sm:hidden pb-2 border-b">
                    <span className="text-xs font-bold text-[#111111]">
                      {wDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}
                    </span>
                    <button
                      onClick={() => handleOpenCreateModal(dStr)}
                      className="text-xs text-[#2F6F9C] font-bold"
                    >
                      + Novo
                    </button>
                  </div>

                  {dayEvts.length === 0 ? (
                    <div className="py-8 text-center text-gray-300 text-xs">
                      Sem eventos
                    </div>
                  ) : (
                    dayEvts.map(evt => {
                      const config = getEventTypeConfig(evt.type);
                      const Icon = config.icon;
                      const isDone = evt.status === 'completed';

                      return (
                        <div
                          key={evt.id}
                          onClick={() => handleEventClick(evt)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.02] shadow-2xs space-y-1.5 ${
                            isDone ? 'bg-emerald-50 border-emerald-200 opacity-80' : config.bg
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[10px] font-bold">
                              {evt.startTime} - {evt.endTime}
                            </span>
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                          </div>

                          <h4 className="font-bold text-[#111111] line-clamp-2">
                            {evt.title}
                          </h4>

                          {evt.clientName && (
                            <p className="text-[11px] text-[#2F6F9C] font-medium truncate flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {evt.clientName}
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-black/5">
                            <span className="text-[#6B7280] truncate">{evt.assignedTo}</span>
                            {isDone && <Check className="w-3 h-3 text-emerald-700" />}
                          </div>
                        </div>
                      );
                    })
                  )}

                  <button
                    onClick={() => handleOpenCreateModal(dStr)}
                    className="w-full py-1.5 text-center text-[11px] text-[#6B7280] hover:text-[#111111] hover:bg-[#F5F7F9] rounded-lg transition-colors font-medium border border-dashed border-[#DDE3E8]"
                  >
                    + Adicionar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: DAY (DIA) */}
      {viewMode === 'day' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Day Schedule Timeline (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#DDE3E8] p-6 shadow-2xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-[#111111] uppercase tracking-tight">
                  Cronograma do Dia
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <button
                onClick={() => handleOpenCreateModal(currentDateYMD)}
                className="bg-[#111111] hover:bg-[#2F6F9C] text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#66acd7]" />
                <span>Adicionar neste dia</span>
              </button>
            </div>

            {/* Daily Events List */}
            {filteredEvents.filter(e => e.date === currentDateYMD).length === 0 ? (
              <EmptyState
                icon={CalendarIcon}
                title="Nenhum evento agendado para esta data"
                description="Use o botão acima para cadastrar uma nova reunião, gravação ou alinhamento."
                actionLabel="Criar evento hoje"
                onAction={() => handleOpenCreateModal(currentDateYMD)}
              />
            ) : (
              <div className="space-y-3">
                {filteredEvents
                  .filter(e => e.date === currentDateYMD)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map(evt => {
                    const config = getEventTypeConfig(evt.type);
                    const Icon = config.icon;
                    const isDone = evt.status === 'completed';
                    const isCanc = evt.status === 'cancelled';

                    return (
                      <div
                        key={evt.id}
                        onClick={() => handleEventClick(evt)}
                        className={`p-4 rounded-2xl border transition-all hover:shadow-xs cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isDone 
                            ? 'bg-emerald-50/50 border-emerald-200' 
                            : isCanc
                            ? 'bg-rose-50/40 border-rose-200 opacity-60'
                            : 'bg-white border-[#DDE3E8] hover:border-[#66acd7]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${config.bg}`}>
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#2F6F9C]">
                                {evt.startTime} às {evt.endTime}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${config.bg}`}>
                                {config.label}
                              </span>
                            </div>

                            <h4 className={`text-sm font-bold text-[#111111] ${isDone ? 'line-through text-[#6B7280]' : ''}`}>
                              {evt.title}
                            </h4>

                            {evt.description && (
                              <p className="text-xs text-[#6B7280] line-clamp-1">
                                {evt.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B7280] pt-1">
                              {evt.clientName && (
                                <span className="font-medium text-[#2F6F9C] flex items-center gap-1">
                                  <Building2 className="w-3.5 h-3.5" />
                                  {evt.clientName}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5" />
                                {evt.assignedTo}
                              </span>
                              {evt.locationOrLink && (
                                <span className="flex items-center gap-1 truncate max-w-[200px]">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                                  {evt.locationOrLink}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateCalendarEvent(evt.id, {
                                status: evt.status === 'completed' ? 'scheduled' : 'completed'
                              });
                            }}
                            className={`p-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                              isDone
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 hover:bg-emerald-100 text-[#111111]'
                            }`}
                            title={isDone ? 'Marcar como não concluído' : 'Concluir evento'}
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(evt);
                            }}
                            className="p-2 rounded-xl text-xs text-[#6B7280] hover:text-[#111111] hover:bg-gray-100 transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Day Summary & Mini Agenda (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Quick Metrics */}
            <div className="bg-[#111111] text-white rounded-3xl p-6 space-y-4 shadow-md">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h4 className="font-display text-sm font-black uppercase text-white tracking-wider">
                  Resumo do Dia
                </h4>
                <CalendarIcon className="w-4 h-4 text-[#66acd7]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-white/10 rounded-2xl">
                  <span className="text-2xl font-black font-display text-[#66acd7]">
                    {filteredEvents.filter(e => e.date === currentDateYMD).length}
                  </span>
                  <p className="text-[11px] text-gray-300 mt-0.5">Total de eventos</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl">
                  <span className="text-2xl font-black font-display text-emerald-400">
                    {filteredEvents.filter(e => e.date === currentDateYMD && e.status === 'completed').length}
                  </span>
                  <p className="text-[11px] text-gray-300 mt-0.5">Concluídos</p>
                </div>
              </div>

              <div className="text-xs text-gray-300 pt-2 border-t border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Reuniões com clientes:</span>
                  <strong className="text-white font-mono">
                    {filteredEvents.filter(e => e.date === currentDateYMD && (e.type === 'meeting' || e.type === 'presentation')).length}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span>Gravações & Entregas:</span>
                  <strong className="text-white font-mono">
                    {filteredEvents.filter(e => e.date === currentDateYMD && (e.type === 'task' || e.type === 'deadline')).length}
                  </strong>
                </div>
              </div>
            </div>

            {/* Upcoming Next Events in Week */}
            <div className="bg-white rounded-3xl border border-[#DDE3E8] p-5 shadow-2xs space-y-3">
              <h4 className="font-display text-xs font-bold uppercase text-[#111111] tracking-wider">
                Próximos nos Próximos 7 Dias
              </h4>

              <div className="divide-y divide-gray-100 text-xs">
                {calendarEvents
                  .filter(e => e.date > currentDateYMD && e.status === 'scheduled')
                  .slice(0, 4)
                  .map(nextEvt => (
                    <div
                      key={nextEvt.id}
                      onClick={() => handleEventClick(nextEvt)}
                      className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-[#F5F7F9] px-2 rounded-xl transition-colors"
                    >
                      <div>
                        <p className="font-bold text-[#111111]">{nextEvt.title}</p>
                        <p className="text-[11px] text-[#6B7280]">
                          {new Date(nextEvt.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {nextEvt.startTime}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-[#2F6F9C] bg-blue-50 px-2 py-0.5 rounded">
                        {nextEvt.clientName || 'Interno'}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <CalendarEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={eventToEdit}
        defaultDate={modalDefaultDate}
      />

      <CalendarEventDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        event={selectedEvent}
        onEdit={(evt) => handleOpenEditModal(evt)}
      />
    </div>
  );
};
