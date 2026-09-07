import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Link2, Copy, RefreshCw } from 'lucide-react';
import type { TeamMember } from '../../types';
import { getPlanDetails } from '../../data/plans';
import { callServerApi } from '../../lib/serverApi';

export const TeamView: React.FC = () => {
  const { team, removeTeamMember, refreshTeam, user, setCurrentView, addToast } = useApp();
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [teamName, setTeamName] = useState(user.companyName || 'Minha Equipe');
  const [linkPermission, setLinkPermission] = useState<'admin' | 'gestor' | 'colaborador'>('colaborador');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteMaxUses, setInviteMaxUses] = useState(0);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isRefreshingTeam, setIsRefreshingTeam] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const confirmMemberRemoval = async () => {
    if (!memberToRemove) return;
    setIsRemovingMember(true);
    const removed = await removeTeamMember(memberToRemove.id);
    setIsRemovingMember(false);
    if (removed) setMemberToRemove(null);
  };

  const reloadTeam = async (silent = false) => {
    if (!silent) setIsRefreshingTeam(true);
    try {
      await refreshTeam();
    } catch (error) {
      if (!silent) addToast('error', 'Equipe não atualizada', error instanceof Error ? error.message : 'Tente novamente.');
    } finally {
      if (!silent) setIsRefreshingTeam(false);
    }
  };

  useEffect(() => {
    void reloadTeam(true);
    const timer = window.setInterval(() => void reloadTeam(true), 15000);
    const onFocus = () => void reloadTeam(true);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

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
          <button onClick={() => void reloadTeam()} disabled={isRefreshingTeam} className="border border-[#DDE3E8] bg-white text-[#111111] font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${isRefreshingTeam ? 'animate-spin' : ''}`} />Atualizar</button>
          <button disabled={user.role !== 'admin' || isCapacityReached || isSoloPlan} onClick={() => { setInviteLink(''); setInviteMaxUses(0); setIsLinkModalOpen(true); }} className="bg-[#111111] hover:bg-[#2F6F9C] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl flex items-center gap-2"><Link2 className="w-4 h-4 text-[#66acd7]" />Gerar link de convite</button>
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
              {member.avatar ? <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-2xl object-cover border border-[#DDE3E8]" /> : <div className="w-12 h-12 rounded-2xl border border-[#DDE3E8] bg-blue-50 text-[#2F6F9C] flex items-center justify-center font-black">{member.name.slice(0, 1).toUpperCase()}</div>}
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
              {user.role === 'admin' && member.userId !== user.id && !member.isOwner && (
                <button
                  onClick={() => setMemberToRemove(member)}
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

      {memberToRemove && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="remove-member-title">
          <div className="w-full max-w-md rounded-3xl border border-[#DDE3E8] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 id="remove-member-title" className="font-display text-lg font-black uppercase text-[#111111]">Remover membro?</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
                  <strong className="text-[#111111]">{memberToRemove.name}</strong> perderá o acesso ao workspace <strong className="text-[#111111]">{user.companyName}</strong>.
                </p>
              </div>
              <button type="button" onClick={() => setMemberToRemove(null)} disabled={isRemovingMember} aria-label="Fechar confirmação" className="rounded-lg p-1 text-[#6B7280] hover:bg-[#F5F7F9] disabled:opacity-50"><X className="h-5 w-5" /></button>
            </div>

            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-xs font-bold text-rose-800">O vínculo e o registro deste membro serão removidos do banco de dados da equipe.</p>
              <p className="mt-1 text-xs text-rose-700">A conta pessoal não será apagada e poderá continuar em outros workspaces.</p>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-[#DDE3E8] pt-4">
              <button type="button" onClick={() => setMemberToRemove(null)} disabled={isRemovingMember} className="rounded-xl px-4 py-2.5 text-sm font-bold text-[#6B7280] hover:bg-[#F5F7F9] disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={() => void confirmMemberRemoval()} disabled={isRemovingMember} className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300">
                {isRemovingMember ? 'Removendo...' : 'Sim, remover acesso'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
