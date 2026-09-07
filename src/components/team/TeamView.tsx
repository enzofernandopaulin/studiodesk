import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Users, Plus, Shield, Trash2, CheckCircle2, X, Sparkles, AlertCircle, Link2, Copy } from 'lucide-react';
import { TeamMember } from '../../types';
import { getPlanDetails } from '../../data/plans';
import { callServerApi } from '../../lib/serverApi';

export const TeamView: React.FC = () => {
  const { team, removeTeamMember, user, setCurrentView, addToast } = useApp();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [teamName, setTeamName] = useState(user.companyName || 'Minha Equipe');
  const [linkPermission, setLinkPermission] = useState<'admin' | 'gestor' | 'colaborador'>('colaborador');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState(0);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  const planDetails = getPlanDetails(user.plan);
  const currentMembersCount = team.length;
  const isSoloPlan = user.plan === 'solo' || user.plan === 'individual';
  const isCapacityReached = currentMembersCount >= planDetails.userLimit;

  const handleCreateTeamLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingLink(true);
    try {
      const result = await callServerApi<{ inviteUrl: string; maxUses: number }>('/api/team/invitations', {
        method: 'POST', body: JSON.stringify({ teamName: teamName.trim(), role: linkPermission }),
      });
      setInviteLink(result.inviteUrl);
      setInviteMaxUses(result.maxUses);
      addToast('success', 'Equipe pronta', 'O link de entrada foi criado e vale por 7 dias.');
    } catch (error) {
      addToast('error', 'Link não criado', error instanceof Error ? error.message : 'Tente novamente.');
    } finally { setIsGeneratingLink(false); }
  };

  const copyInviteLink = async () => {
    await navigator.clipboard.writeText(inviteLink);
    addToast('success', 'Link copiado', 'Agora envie o link aos seus colegas.');
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6" id="team-view">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-black text-[#111111] uppercase tracking-tight">
            Equipe & Colaboradores
          </h2>
          <p className="text-xs sm:text-sm text-[#6B7280]">
            Gerencie membros, permissões de acesso e atribuições da <strong>{user.companyName}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <button disabled={isCapacityReached || isSoloPlan} onClick={() => { setInviteLink(''); setInviteMaxUses(0); setIsLinkModalOpen(true); }} className="bg-[#111111] hover:bg-[#2F6F9C] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2"><Link2 className="w-4 h-4 text-[#66acd7]" />Gerar link de convite</button>
        </div>
      </div>

      {/* Plan Capacity Bar */}
      <div className="p-4 sm:p-5 bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm">{planDetails.icon}</span>
            <span className="text-xs font-bold text-[#111111]">
              Plano {planDetails.name} ({planDetails.priceFormatted}/mês)
            </span>
            <span className="text-[10px] font-bold uppercase bg-blue-50 text-[#2F6F9C] border border-[#66acd7]/30 px-2 py-0.5 rounded-full">
              Capacidade: {currentMembersCount} de {planDetails.userLimit} {planDetails.userLimit === 1 ? 'usuário' : 'usuários'}
            </span>
          </div>
          <div className="w-full max-w-md h-2 bg-[#F5F7F9] border border-[#DDE3E8] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${isCapacityReached ? 'bg-amber-500' : 'bg-[#66acd7]'}`}
              style={{ width: `${Math.min(100, (currentMembersCount / planDetails.userLimit) * 100)}%` }}
            />
          </div>
        </div>

        <button
          onClick={() => setCurrentView('settings')}
          className="text-xs font-bold text-[#2F6F9C] hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Gerenciar ou Fazer Upgrade de Plano</span>
        </button>
      </div>

      {/* Team Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.map(member => (
          <div
            key={member.id}
            className="p-5 bg-white rounded-3xl border border-[#DDE3E8] shadow-2xs space-y-4 flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <img
                src={member.avatar}
                alt={member.name}
                className="w-12 h-12 rounded-2xl object-cover border border-[#DDE3E8]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#111111] truncate">{member.name}</h3>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    member.accessLevel === 'admin' ? 'bg-purple-100 text-purple-800' :
                    member.accessLevel === 'gestor' ? 'bg-blue-100 text-[#2F6F9C]' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {member.accessLevel}
                  </span>
                </div>
                <p className="text-xs text-[#2F6F9C] font-semibold">{member.role}</p>
                <p className="text-[11px] text-[#6B7280] truncate mt-1">{member.email}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#DDE3E8] flex items-center justify-between">
              <span className="text-[10px] text-[#6B7280]">Acesso ao StudioDesk Ativo</span>
              {member.id !== 'tm_1' && (
                <button
                  onClick={() => removeTeamMember(member.id)}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                >
                  Remover
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#DDE3E8] pb-3"><h3 className="font-display text-lg font-black uppercase">Criar equipe e link</h3><button onClick={() => setIsLinkModalOpen(false)}><X className="w-5 h-5" /></button></div>
            {!inviteLink ? <form onSubmit={handleCreateTeamLink} className="space-y-4">
              <div><label className="block text-xs font-bold mb-1">Nome da equipe</label><input required value={teamName} onChange={e => setTeamName(e.target.value)} className="w-full px-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-sm" /></div>
              <div><label className="block text-xs font-bold mb-1">Permissão de quem entrar</label><select value={linkPermission} onChange={e => setLinkPermission(e.target.value as typeof linkPermission)} className="w-full px-3 py-2.5 bg-[#F5F7F9] border border-[#DDE3E8] rounded-xl text-sm"><option value="colaborador">Colaborador</option><option value="gestor">Gestor</option><option value="admin">Administrador</option></select></div>
              <button disabled={isGeneratingLink} className="w-full bg-[#111111] text-white font-bold text-sm py-3 rounded-xl disabled:bg-gray-400">{isGeneratingLink ? 'Criando...' : 'Criar equipe e gerar link'}</button>
            </form> : <div className="space-y-4"><p className="text-sm text-[#6B7280]">Envie este link aos seus colegas. Ele expira em 7 dias e aceita até {inviteMaxUses} {inviteMaxUses === 1 ? 'entrada' : 'entradas'}, conforme as vagas restantes do plano.</p><div className="break-all rounded-xl bg-[#F5F7F9] border border-[#DDE3E8] p-3 text-xs">{inviteLink}</div><button onClick={copyInviteLink} className="w-full flex items-center justify-center gap-2 bg-[#111111] text-white font-bold text-sm py-3 rounded-xl"><Copy className="w-4 h-4 text-[#66acd7]" />Copiar link</button></div>}
          </div>
        </div>
      )}

    </div>
  );
};
