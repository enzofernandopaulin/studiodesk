import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Users, Sparkles, FolderKanban, CheckSquare, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GlobalSearchModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { 
    isSearchOpen, 
    setIsSearchOpen, 
    leads = [], 
    clients = [], 
    projects = [], 
    tasks = [], 
    setCurrentView, 
    setSelectedClientId, 
    setSelectedProjectId 
  } = useApp();

  const [query, setQuery] = useState('');

  const showModal = isOpen !== undefined ? isOpen : isSearchOpen;

  const handleClose = () => {
    if (onClose) onClose();
    setIsSearchOpen(false);
    setQuery('');
  };

  const results = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();

    const safeClients = clients || [];
    const safeLeads = leads || [];
    const safeProjects = projects || [];
    const safeTasks = tasks || [];

    const matchedClients = safeClients.filter(
      c => (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q) || (c.segment || '').toLowerCase().includes(q)
    );

    const matchedLeads = safeLeads.filter(
      l => (l.name || '').toLowerCase().includes(q) || (l.company || '').toLowerCase().includes(q) || (l.serviceInterest || '').toLowerCase().includes(q)
    );

    const matchedProjects = safeProjects.filter(
      p => (p.title || '').toLowerCase().includes(q) || (p.clientName || '').toLowerCase().includes(q) || (p.tags || []).some(t => t.toLowerCase().includes(q))
    );

    const matchedTasks = safeTasks.filter(
      t => (t.title || '').toLowerCase().includes(q) || (t.projectTitle && t.projectTitle.toLowerCase().includes(q))
    );

    return {
      clients: matchedClients,
      leads: matchedLeads,
      projects: matchedProjects,
      tasks: matchedTasks,
      totalCount: matchedClients.length + matchedLeads.length + matchedProjects.length + matchedTasks.length
    };
  }, [query, clients, leads, projects, tasks]);

  if (!showModal) return null;

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentView('client_profile');
    handleClose();
  };

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('project_detail');
    handleClose();
  };

  const handleSelectLead = () => {
    setCurrentView('leads');
    handleClose();
  };

  const handleSelectTask = () => {
    setCurrentView('tasks');
    handleClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[#DDE3E8] overflow-hidden flex flex-col"
          id="global-search-modal"
        >
          {/* Search Input Bar */}
          <div className="flex items-center px-4 py-3.5 border-b border-[#DDE3E8] bg-[#F5F7F9]">
            <Search className="w-5 h-5 text-[#66acd7] shrink-0 mr-3" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar clientes, leads, projetos e tarefas..."
              className="flex-1 bg-transparent text-[#111111] placeholder-[#6B7280] text-sm focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-[#6B7280] hover:text-[#111111] p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={handleClose}
              className="ml-2 text-xs font-semibold px-2 py-1 bg-white border border-[#DDE3E8] rounded-md text-[#6B7280] hover:text-[#111111]"
            >
              ESC
            </button>
          </div>

          {/* Results Container */}
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {!query.trim() ? (
              <div className="py-8 text-center text-[#6B7280] text-sm">
                <p className="font-medium text-[#111111]">Busca Rápida Global</p>
                <p className="text-xs mt-1">Digite o nome de uma empresa, cliente, projeto ou termo para encontrar instantaneamente.</p>
                <div className="flex justify-center gap-2 mt-4">
                  <button
                    onClick={() => setQuery('Campanha')}
                    className="text-xs bg-[#F5F7F9] hover:bg-[#66acd7]/10 text-[#2F6F9C] border border-[#DDE3E8] px-2.5 py-1 rounded-full font-medium"
                  >
                    Ex: "Campanha"
                  </button>
                  <button
                    onClick={() => setQuery('Vídeo')}
                    className="text-xs bg-[#F5F7F9] hover:bg-[#66acd7]/10 text-[#2F6F9C] border border-[#DDE3E8] px-2.5 py-1 rounded-full font-medium"
                  >
                    Ex: "Vídeo"
                  </button>
                  <button
                    onClick={() => setQuery('Campanha')}
                    className="text-xs bg-[#F5F7F9] hover:bg-[#66acd7]/10 text-[#2F6F9C] border border-[#DDE3E8] px-2.5 py-1 rounded-full font-medium"
                  >
                    Ex: "Campanha"
                  </button>
                </div>
              </div>
            ) : results && results.totalCount === 0 ? (
              <div className="py-10 text-center text-[#6B7280] text-sm">
                Nenhum resultado encontrado para "{query}".
              </div>
            ) : results ? (
              <div className="space-y-4">
                {/* Clientes */}
                {results.clients.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                      <Users className="w-3.5 h-3.5 text-[#2F6F9C]" />
                      Clientes ({results.clients.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.clients.map(client => (
                        <div
                          key={client.id}
                          onClick={() => handleSelectClient(client.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F7F9] cursor-pointer transition-colors border border-transparent hover:border-[#DDE3E8]"
                        >
                          <div>
                            <span className="font-semibold text-sm text-[#111111]">{client.name}</span>
                            <span className="text-xs text-[#6B7280] ml-2">({client.company})</span>
                            <span className="block text-xs text-[#2F6F9C]">{client.segment}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projetos */}
                {results.projects.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                      <FolderKanban className="w-3.5 h-3.5 text-[#66acd7]" />
                      Projetos ({results.projects.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.projects.map(proj => (
                        <div
                          key={proj.id}
                          onClick={() => handleSelectProject(proj.id)}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F7F9] cursor-pointer transition-colors border border-transparent hover:border-[#DDE3E8]"
                        >
                          <div>
                            <span className="font-semibold text-sm text-[#111111]">{proj.title}</span>
                            <span className="text-xs text-[#6B7280] block">Cliente: {proj.clientName} • Status: {proj.status}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leads */}
                {results.leads.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                      <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      Leads ({results.leads.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.leads.map(lead => (
                        <div
                          key={lead.id}
                          onClick={handleSelectLead}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F7F9] cursor-pointer transition-colors border border-transparent hover:border-[#DDE3E8]"
                        >
                          <div>
                            <span className="font-semibold text-sm text-[#111111]">{lead.name}</span>
                            <span className="text-xs text-[#6B7280] ml-2">({lead.company})</span>
                            <span className="block text-xs text-[#8B5CF6]">{lead.serviceInterest}</span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#6B7280]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tarefas */}
                {results.tasks.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B7280] mb-2">
                      <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                      Tarefas ({results.tasks.length})
                    </div>
                    <div className="space-y-1.5">
                      {results.tasks.map(task => (
                        <div
                          key={task.id}
                          onClick={handleSelectTask}
                          className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[#F5F7F9] cursor-pointer transition-colors border border-transparent hover:border-[#DDE3E8]"
                        >
                          <div>
                            <span className="text-sm text-[#111111]">{task.title}</span>
                            {task.projectTitle && (
                              <span className="text-xs text-[#6B7280] block">Projeto: {task.projectTitle}</span>
                            )}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${task.completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                            {task.completed ? 'Concluída' : 'Pendente'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
