export type PlanType = 'solo' | 'studio' | 'empresa' | 'agencia' | 'individual';

export interface PlanDetails {
  id: PlanType;
  name: string;
  badge: string;
  icon: string;
  targetAudience: string;
  userLimit: number;
  userLimitText: string;
  priceMonthly: number;
  priceFormatted: string;
  pricePeriod: string;
  description: string;
  popular?: boolean;
  color: string;
  accentBorder: string;
  features: string[];
  ctaText: string;
}

export const PLANS_CONFIG: Record<string, PlanDetails> = {
  solo: {
    id: 'solo',
    name: 'Solo',
    badge: 'Autônomo',
    icon: 'User',
    targetAudience: 'Freelancer / autônomo',
    userLimit: 1,
    userLimitText: '1 usuário',
    priceMonthly: 49.90,
    priceFormatted: 'R$ 49,90',
    pricePeriod: '/mês',
    description: 'Para freelancers, filmmakers e criadores independentes que buscam organizar clientes e prazos.',
    color: '#66acd7',
    accentBorder: 'border-[#66acd7]',
    ctaText: 'Começar no Plano Solo',
    features: [
      '1 usuário com acesso total',
      'CRM de Clientes & Contatos ilimitados',
      'Funil de Leads & Captação simplificada',
      'Kanban de Produção & Prazos',
      'Gestão de Tarefas & Calendário de Entregas',
      'Histórico de Atividades & Notas',
      '10 GB de armazenamento de arquivos',
      'Suporte padrão por e-mail e comunidade'
    ]
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    badge: 'Mais Escolhido',
    icon: 'Building2',
    targetAudience: 'Até 10 usuários',
    userLimit: 10,
    userLimitText: 'Até 10 usuários',
    priceMonthly: 199.90,
    priceFormatted: 'R$ 199,90',
    pricePeriod: '/mês',
    description: 'Ideal para produtoras e pequenas agências criativas estruturarem seu fluxo de produção e entregas.',
    popular: true,
    color: '#2F6F9C',
    accentBorder: 'border-[#2F6F9C]',
    ctaText: 'Escolher Plano Studio',
    features: [
      'Até 10 usuários com níveis de acesso (Admin, Gestor, Colaborador)',
      'Tudo do Plano Solo incluso',
      'Portal de Aprovação de Vídeos com comentários e timecodes',
      'Gestão de Equipe & Atribuição de responsáveis',
      'Comunicação Contextual e integração com WhatsApp',
      'Site Institucional com captura direta de leads no CRM',
      '100 GB de armazenamento em nuvem de alta velocidade',
      'Relatórios operacionais de tempo e gargalos'
    ]
  },
  empresa: {
    id: 'empresa',
    name: 'Empresa',
    badge: 'Crescimento',
    icon: 'Rocket',
    targetAudience: '11–25 usuários',
    userLimit: 25,
    userLimitText: '11–25 usuários',
    priceMonthly: 349.90,
    priceFormatted: 'R$ 349,90',
    pricePeriod: '/mês',
    description: 'Para agências audiovisuais consolidadas com múltiplos projetos e equipes simultâneas.',
    color: '#111111',
    accentBorder: 'border-[#111111]',
    ctaText: 'Assinar Plano Empresa',
    features: [
      'De 11 a 25 usuários com permissões avançadas por projeto',
      'Tudo do Plano Studio incluso',
      'Múltiplos fluxos de Kanban (Audiovisual, Design, Tráfego, Social Media)',
      'Automações de Notificação para Clientes via WhatsApp / E-mail',
      'Portal de Aprovação White-Label com identidade visual personalizada',
      'Integrações com Evolution API e Webhooks ilimitados',
      '500 GB de armazenamento de mídias e vídeos 4K',
      'Suporte prioritário via WhatsApp com gerente de contas'
    ]
  },
  agencia: {
    id: 'agencia',
    name: 'Agência',
    badge: 'Escala Total',
    icon: 'Trophy',
    targetAudience: '26–50 usuários',
    userLimit: 50,
    userLimitText: '26–50 usuários',
    priceMonthly: 599.90,
    priceFormatted: 'R$ 599,90',
    pricePeriod: '/mês',
    description: 'A solução corporativa completa para grandes agências, produtoras de cinema e redes de conteúdo.',
    color: '#8B5CF6',
    accentBorder: 'border-[#8B5CF6]',
    ctaText: 'Contratar Plano Agência',
    features: [
      'De 26 a 50 usuários com auditoria e controle departamental',
      'Tudo do Plano Empresa incluso',
      'Armazenamento massivo de 2 TB para arquivos brutos e master',
      'API Aberta para conexão com sistemas legados e ERPs',
      'SLA garantido de 99.9% com backups redundantes em tempo real',
      'Onboarding assistido com treinamento exclusivo para o time',
      'Gestão de margem financeira e custos por projeto',
      'Gerente de sucesso dedicado e suporte 24/7'
    ]
  }
};

export const PLANS_LIST = Object.values(PLANS_CONFIG);

export const getPlanDetails = (plan: PlanType | string): PlanDetails => {
  if (plan === 'individual') return PLANS_CONFIG.solo;
  return PLANS_CONFIG[plan] || PLANS_CONFIG.studio;
};
