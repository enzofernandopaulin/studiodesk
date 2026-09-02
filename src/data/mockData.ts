import { 
  UserProfile, 
  Lead, 
  Client, 
  Project, 
  Task, 
  KanbanColumn, 
  TimelineEvent, 
  Message, 
  Communication,
  CalendarEvent,
  ApprovalRequest,
  TeamMember, 
  IntegrationItem 
} from '../types';

export const initialUser: UserProfile = {
  id: 'user_1',
  name: 'Ruan Beguetto',
  email: 'ruan@studiodesk.com.br',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'admin',
  plan: 'empresa',
  businessType: 'Agência Audiovisual',
  teamSize: '6–10',
  objectives: [
    'Organizar clientes',
    'Gerenciar projetos',
    'Usar Kanban',
    'Captar leads',
    'Integrar meu site',
    'Centralizar comunicação'
  ],
  template: 'Audiovisual',
  companyName: 'Dumonti Criativa'
};

export const initialKanbanColumns: KanbanColumn[] = [
  { id: 'col_briefing', title: 'BRIEFING & ROTEIRO', color: '#66acd7', order: 0 },
  { id: 'col_producao', title: 'GRAVAÇÃO / PRODUÇÃO', color: '#2F6F9C', order: 1 },
  { id: 'col_edicao', title: 'EDIÇÃO & MOTION', color: '#8B5CF6', order: 2 },
  { id: 'col_revisao', title: 'REVISÃO INTERNA', color: '#F59E0B', order: 3 },
  { id: 'col_aprovacao', title: 'APROVAÇÃO DO CLIENTE', color: '#EC4899', order: 4 },
  { id: 'col_concluido', title: 'ENTREGA & CONCLUÍDO', color: '#10B981', order: 5 },
];

export const initialLeads: Lead[] = [
  {
    id: 'lead_1',
    name: 'Carlos Eduardo Menezes',
    company: 'Restaurante Terraço Mar',
    email: 'contato@terracomar.com.br',
    phone: '(13) 99872-4411',
    whatsapp: '(13) 99872-4411',
    source: 'Site Institucional',
    serviceInterest: 'Vídeo Institucional e Reels Gastronômicos',
    assignedTo: 'Ruan Beguetto',
    notes: 'Lead veio pelo formulário do site institucional. Quer reformular presença em vídeo para alta temporada.',
    status: 'novo',
    createdAt: '2026-08-18T14:30:00Z',
    value: 8500
  },
  {
    id: 'lead_2',
    name: 'Juliana Paes Silveira',
    company: 'Clínica Lumina Estética',
    email: 'marketing@luminaestetica.med.br',
    phone: '(13) 98123-9900',
    whatsapp: '(13) 98123-9900',
    source: 'Instagram',
    serviceInterest: 'Gestão de Mídias Sociais + 12 Vídeos/mês',
    assignedTo: 'Laura Cristina',
    notes: 'Interesse em pacote semestral de social media e gravações quinzenais no consultório.',
    status: 'qualificado',
    createdAt: '2026-08-17T11:15:00Z',
    value: 6200
  },
  {
    id: 'lead_3',
    name: 'Fernando Guimarães',
    company: 'Construtora Miramar',
    email: 'fernando@miramaremp.com.br',
    phone: '(11) 97711-2233',
    whatsapp: '(11) 97711-2233',
    source: 'Site Institucional',
    serviceInterest: 'Captação com Drone e Vídeo 4K de Lançamento',
    assignedTo: 'Ruan Beguetto',
    notes: 'Apresentação de proposta comercial enviada ontem via WhatsApp integrado.',
    status: 'proposta',
    createdAt: '2026-08-16T16:00:00Z',
    value: 18500
  },
  {
    id: 'lead_4',
    name: 'Patrícia Rocha',
    company: 'Academia Flow Fitness',
    email: 'gerencia@flowfitness.com',
    phone: '(13) 99655-4422',
    whatsapp: '(13) 99655-4422',
    source: 'Indicação',
    serviceInterest: 'Cobertura de Evento de Inauguração',
    assignedTo: 'Enzo Paulin',
    notes: 'Primeiro contato realizado. Agendando reunião de briefing para sexta-feira.',
    status: 'em_contato',
    createdAt: '2026-08-15T09:40:00Z',
    value: 4500
  },
  {
    id: 'lead_5',
    name: 'Marcos Vinícius Andrade',
    company: 'Dumonti Motors',
    email: 'marcos@dumontimotors.com.br',
    phone: '(13) 99188-3322',
    whatsapp: '(13) 99188-3322',
    source: 'Site Institucional',
    serviceInterest: 'Campanha de Vídeos Promocionais',
    assignedTo: 'Ruan Beguetto',
    notes: 'Convertido com sucesso! Contrato assinado para produção trimestral.',
    status: 'convertido',
    createdAt: '2026-08-10T10:00:00Z',
    value: 12000
  }
];

export const initialClients: Client[] = [
  {
    id: 'client_dumonti',
    name: 'Gabriel Dumonti',
    company: 'Dumonti Criação & Brand',
    email: 'gabriel@dumonti.com.br',
    phone: '(13) 99744-1020',
    whatsapp: '(13) 99744-1020',
    website: 'https://dumonti.com.br',
    position: 'Diretor Executivo',
    segment: 'Marketing & Audiovisual',
    assignedTo: 'Ruan Beguetto',
    status: 'ativo',
    notes: 'Cliente âncora e parceiro de co-produção. Projetos recorrentes de reels, campanhas publicitárias e institucionais.',
    tags: ['Parceiro VIP', 'Recorrente', 'Audiovisual'],
    createdAt: '2026-05-10T10:00:00Z',
    leadOriginId: 'lead_5'
  },
  {
    id: 'client_santista',
    name: 'Mariana Castilho',
    company: 'Porto Café Gourmet',
    email: 'mariana@portocafe.com.br',
    phone: '(13) 99122-3344',
    whatsapp: '(13) 99122-3344',
    website: 'https://portocafe.com.br',
    position: 'Head de Marketing',
    segment: 'Alimentação & Gastronomia',
    assignedTo: 'Laura Cristina',
    status: 'ativo',
    notes: 'Produção mensal de 8 reels cinematográficos e fotografia de pratos.',
    tags: ['Social Media', 'Audiovisual'],
    createdAt: '2026-06-01T09:00:00Z'
  },
  {
    id: 'client_santos_tech',
    name: 'Rodrigo Alcantara',
    company: 'Nexus Software & Cloud',
    email: 'rodrigo@nexustech.io',
    phone: '(11) 98877-6655',
    whatsapp: '(11) 98877-6655',
    website: 'https://nexustech.io',
    position: 'CEO',
    segment: 'Tecnologia SaaS',
    assignedTo: 'Ruan Beguetto',
    status: 'ativo',
    notes: 'Vídeo institucional estilo Silicon Valley em 3D Motion e depoimento de clientes.',
    tags: ['Motion 3D', 'Institucional', 'Ticket Alto'],
    createdAt: '2026-07-15T14:20:00Z'
  },
  {
    id: 'client_vivere',
    name: 'Helena Zanetti',
    company: 'Vivere Arquitetura & Interiores',
    email: 'helena@viverearq.com.br',
    phone: '(13) 99611-7788',
    whatsapp: '(13) 99611-7788',
    website: 'https://viverearq.com.br',
    position: 'Arquiteta Titular',
    segment: 'Arquitetura & Decoração',
    assignedTo: 'Enzo Paulin',
    status: 'ativo',
    notes: 'Captação arquitetônica com estabilizador gimbal e lentes tilt-shift de 4 obras finalizadas.',
    tags: ['Tour Virtual', 'Captação 4K'],
    createdAt: '2026-07-28T16:00:00Z'
  }
];

export const initialProjects: Project[] = [
  {
    id: 'proj_dumonti_launch',
    title: 'Campanha de Lançamento — Dumonti',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    description: 'Campanha completa em vídeo 4K + 6 cortes verticais para redes sociais, enfatizando a nova identidade visual e posicionamento de marca.',
    assignedTo: 'Ruan Beguetto',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    startDate: '2026-08-01',
    deadline: '2026-08-25',
    priority: 'alta',
    status: 'APROVAÇÃO DO CLIENTE',
    columnId: 'col_aprovacao',
    tags: ['Audiovisual', 'Campanha', '4K'],
    budget: 14500,
    progress: 85,
    deliverables: [
      {
        id: 'del_1',
        title: 'Vídeo Institucional Principal — V02 (Com Color Grading)',
        version: 'V02',
        fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        fileType: 'video',
        submittedAt: '2026-08-18T10:30:00Z',
        status: 'aguardando_aprovacao',
        feedbackNotes: 'Aguardando validação do Gabriel Dumonti sobre a trilha sonora aos 0:45s.',
      },
      {
        id: 'del_2',
        title: 'Cortes Verticais Reels (Pack 06 vídeos) — V01',
        version: 'V01',
        fileUrl: '',
        fileType: 'video',
        submittedAt: '2026-08-16T15:00:00Z',
        status: 'aprovado',
        reviewedAt: '2026-08-17T11:00:00Z',
        reviewedBy: 'Gabriel Dumonti',
        feedbackNotes: 'Aprovado sem ressalvas! Ritmo e legendas dinâmicas ficaram impecáveis.'
      }
    ],
    createdAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'proj_nexus_saas',
    title: 'Vídeo Manifesto 3D Tech — Nexus SaaS',
    clientId: 'client_santos_tech',
    clientName: 'Nexus Software & Cloud',
    description: 'Animação 3D com motion design mostrando a arquitetura de nuvem em ação, com locução profissional em estúdio.',
    assignedTo: 'Laura Cristina',
    assignedAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    startDate: '2026-08-05',
    deadline: '2026-08-30',
    priority: 'urgente',
    status: 'EDIÇÃO & MOTION',
    columnId: 'col_edicao',
    tags: ['Motion 3D', 'After Effects', 'Locução'],
    budget: 18000,
    progress: 55,
    deliverables: [
      {
        id: 'del_nexus_1',
        title: 'Storyboard Animatic — V01',
        version: 'V01',
        fileType: 'video',
        submittedAt: '2026-08-12T14:00:00Z',
        status: 'aprovado',
        reviewedAt: '2026-08-14T09:30:00Z',
        reviewedBy: 'Rodrigo Alcantara'
      }
    ],
    createdAt: '2026-08-05T09:00:00Z'
  },
  {
    id: 'proj_porto_cafe',
    title: 'Série Gastronômica — Porto Café',
    clientId: 'client_santista',
    clientName: 'Porto Café Gourmet',
    description: 'Captação cinematográfica de baristas, extração de café espresso e depoimentos dos mestres de torra.',
    assignedTo: 'Enzo Paulin',
    assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    startDate: '2026-08-10',
    deadline: '2026-08-28',
    priority: 'media',
    status: 'GRAVAÇÃO / PRODUÇÃO',
    columnId: 'col_producao',
    tags: ['Gastronomia', 'Captação', 'Slow Motion'],
    budget: 7200,
    progress: 35,
    createdAt: '2026-08-10T10:00:00Z'
  },
  {
    id: 'proj_vivere_tour',
    title: 'Tour Arquitetônico Mansão Acqua — Vivere',
    clientId: 'client_vivere',
    clientName: 'Vivere Arquitetura & Interiores',
    description: 'Vídeo horizontal em 4K HDR para canal do YouTube e site institucional, destacando iluminação natural e acabamentos.',
    assignedTo: 'Bruno Alex',
    assignedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    startDate: '2026-08-12',
    deadline: '2026-09-05',
    priority: 'baixa',
    status: 'BRIEFING & ROTEIRO',
    columnId: 'col_briefing',
    tags: ['Arquitetura', 'Roteiro', 'Drone'],
    budget: 9500,
    progress: 15,
    createdAt: '2026-08-12T11:00:00Z'
  },
  {
    id: 'proj_revisao_dumonti',
    title: 'Reels Institucionais Mensais — Dumonti',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    description: 'Pacote mensal de 10 reels com cortes de bastidores e rotina criativa da agência.',
    assignedTo: 'Maria Luiza',
    assignedAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    startDate: '2026-08-08',
    deadline: '2026-08-22',
    priority: 'alta',
    status: 'REVISÃO INTERNA',
    columnId: 'col_revisao',
    tags: ['Social Media', 'Edição Rápida'],
    budget: 5400,
    progress: 70,
    createdAt: '2026-08-08T15:00:00Z'
  }
];

export const initialTasks: Task[] = [
  {
    id: 'task_1',
    title: 'Exportar master V02 com correção de cores em DaVinci Resolve',
    projectId: 'proj_dumonti_launch',
    projectTitle: 'Campanha de Lançamento — Dumonti',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Ruan Beguetto',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    deadline: '2026-08-19',
    priority: 'alta',
    description: 'Garantir LUT da Dumonti aplicada com precisão no canal de cor primária.',
    completed: true,
    completedAt: '2026-08-18T16:20:00Z',
    createdAt: '2026-08-17T09:00:00Z'
  },
  {
    id: 'task_2',
    title: 'Enviar link de aprovação centralizada para Gabriel Dumonti',
    projectId: 'proj_dumonti_launch',
    projectTitle: 'Campanha de Lançamento — Dumonti',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Ruan Beguetto',
    deadline: '2026-08-19',
    priority: 'urgente',
    description: 'Utilizar o portal de aprovação do StudioDesk para registrar feedbacks sem mensagens soltas.',
    completed: false,
    createdAt: '2026-08-18T10:00:00Z'
  },
  {
    id: 'task_3',
    title: 'Renderizar cenas 3D do módulo de servidores em Cinema 4D / Redshift',
    projectId: 'proj_nexus_saas',
    projectTitle: 'Vídeo Manifesto 3D Tech — Nexus SaaS',
    clientId: 'client_santos_tech',
    clientName: 'Nexus Software & Cloud',
    assignedTo: 'Laura Cristina',
    deadline: '2026-08-21',
    priority: 'alta',
    description: 'Passar passes de iluminação volumétrica e reflexo para pós em After Effects.',
    completed: false,
    createdAt: '2026-08-16T14:00:00Z'
  },
  {
    id: 'task_4',
    title: 'Organizar diária de gravação e locação no café no centro histórico',
    projectId: 'proj_porto_cafe',
    projectTitle: 'Série Gastronômica — Porto Café',
    clientId: 'client_santista',
    clientName: 'Porto Café Gourmet',
    assignedTo: 'Enzo Paulin',
    deadline: '2026-08-22',
    priority: 'media',
    description: 'Conferir bateria de câmeras Sony FX3, iluminação LED Aputure e microfone lapela.',
    completed: false,
    createdAt: '2026-08-17T11:30:00Z'
  },
  {
    id: 'task_5',
    title: 'Entrar em contato com o lead Construtora Miramar sobre orçamento',
    assignedTo: 'Ruan Beguetto',
    deadline: '2026-08-19',
    priority: 'urgente',
    description: 'Follow-up comercial pelo WhatsApp integrado.',
    completed: false,
    createdAt: '2026-08-18T08:30:00Z'
  },
  {
    id: 'task_6',
    title: 'Revisar legendas e tipografia dos 10 reels de bastidores',
    projectId: 'proj_revisao_dumonti',
    projectTitle: 'Reels Institucionais Mensais — Dumonti',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Maria Luiza',
    deadline: '2026-08-20',
    priority: 'media',
    description: 'Verificar alinhamento visual com a fonte Anton e cores da marca.',
    completed: true,
    completedAt: '2026-08-18T14:00:00Z',
    createdAt: '2026-08-15T10:00:00Z'
  }
];

export const initialTimelineEvents: TimelineEvent[] = [
  {
    id: 'evt_1',
    timestamp: '2026-08-18T16:30:00Z',
    timeString: '16:30',
    actor: 'Ruan Beguetto',
    action: 'moveu o projeto para Aprovação',
    details: 'Campanha de Lançamento — Dumonti movido da coluna Revisão para Aprovação do Cliente.',
    category: 'projeto',
    referenceId: 'proj_dumonti_launch'
  },
  {
    id: 'evt_2',
    timestamp: '2026-08-18T14:15:00Z',
    timeString: '14:15',
    actor: 'Sistema / Página Institucional',
    action: 'Lead recebido automaticamente via formulário do site',
    details: 'Carlos Eduardo Menezes (Restaurante Terraço Mar) cadastrado com interesse em Vídeo Institucional.',
    category: 'lead',
    referenceId: 'lead_1'
  },
  {
    id: 'evt_3',
    timestamp: '2026-08-18T11:20:00Z',
    timeString: '11:20',
    actor: 'Gabriel Dumonti (Cliente)',
    action: 'aprovou entrega de projeto',
    details: 'Cortes Verticais Reels (Pack 06 vídeos) — V01 marcado como Aprovado sem alterações.',
    category: 'aprovacao',
    referenceId: 'proj_dumonti_launch'
  },
  {
    id: 'evt_4',
    timestamp: '2026-08-18T10:42:00Z',
    timeString: '10:42',
    actor: 'Laura Cristina',
    action: 'adicionou observação no projeto',
    details: 'Adicionou notas de render e arquivos brutos no projeto Nexus SaaS.',
    category: 'projeto',
    referenceId: 'proj_nexus_saas'
  },
  {
    id: 'evt_5',
    timestamp: '2026-08-18T09:10:00Z',
    timeString: '09:10',
    actor: 'Ruan Beguetto',
    action: 'converteu lead em cliente ativo',
    details: 'Marcos Vinícius Andrade convertido para a carteira de clientes ativos.',
    category: 'cliente'
  }
];

export const initialMessages: Message[] = [
  {
    id: 'msg_1',
    sender: 'user',
    senderName: 'Ruan Beguetto',
    content: 'Olá Gabriel! Acabamos de subir a versão V02 do vídeo institucional da Dumonti na aba de aprovação. Ajustamos o ritmo dos primeiros 10 segundos conforme você pediu.',
    timestamp: '10:15',
    clientId: 'client_dumonti',
    projectId: 'proj_dumonti_launch'
  },
  {
    id: 'msg_2',
    sender: 'client',
    senderName: 'Gabriel Dumonti',
    content: 'Sensacional, Ruan! Vi aqui no painel do StudioDesk. A transição de cena ficou perfeita. Deixei um apontamento registrado aos 0:45s apenas para suavizar a entrada da locução.',
    timestamp: '10:42',
    clientId: 'client_dumonti',
    projectId: 'proj_dumonti_launch'
  },
  {
    id: 'msg_3',
    sender: 'user',
    senderName: 'Ruan Beguetto',
    content: 'Perfeito! O editor já pegou o ponto e o histórico ficou salvo diretamente na tarefa. Vamos exportar a versão final hoje às 18h.',
    timestamp: '11:00',
    clientId: 'client_dumonti',
    projectId: 'proj_dumonti_launch'
  }
];

export const initialTeam: TeamMember[] = [
  {
    id: 'tm_1',
    name: 'Ruan Beguetto',
    email: 'ruan@studiodesk.com.br',
    role: 'Diretor Geral & Estrategista',
    accessLevel: 'admin',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    projectsCount: 4,
    status: 'ativo'
  },
  {
    id: 'tm_2',
    name: 'Laura Cristina',
    email: 'laura@studiodesk.com.br',
    role: 'Especialista em Motion & 3D',
    accessLevel: 'gestor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    projectsCount: 3,
    status: 'ativo'
  },
  {
    id: 'tm_3',
    name: 'Enzo Paulin',
    email: 'enzo@studiodesk.com.br',
    role: 'Diretor de Fotografia & Câmera',
    accessLevel: 'colaborador',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    projectsCount: 2,
    status: 'ativo'
  },
  {
    id: 'tm_4',
    name: 'Bruno Alex',
    email: 'bruno@studiodesk.com.br',
    role: 'Editor de Vídeo & Colorista',
    accessLevel: 'colaborador',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    projectsCount: 2,
    status: 'ativo'
  },
  {
    id: 'tm_5',
    name: 'Maria Luiza',
    email: 'marialuiza@studiodesk.com.br',
    role: 'Social Media & Atendimento',
    accessLevel: 'gestor',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    projectsCount: 3,
    status: 'ativo'
  }
];

export const initialIntegrations: IntegrationItem[] = [
  {
    id: 'int_site',
    name: 'Página Institucional Integrada',
    category: 'Presença Digital & Leads',
    description: 'Receba os contatos do formulário da sua vitrine institucional diretamente no funil de Leads do CRM sem trabalho manual.',
    status: 'conectado',
    connectedAt: 'Ativo via webhook nativo StudioDesk',
    iconName: 'Globe',
    details: 'URL da vitrine: https://dumonti.com.br/contato'
  },
  {
    id: 'int_whatsapp',
    name: 'WhatsApp Business & Evolution API',
    category: 'Comunicação Contextual',
    description: 'Centralize conversas comerciais e aprovações vinculadas diretamente ao Cliente e ao Projeto, evitando mensagens soltas.',
    status: 'conectado',
    connectedAt: 'Conectado: +55 13 99744-1020',
    iconName: 'MessageSquare',
    details: 'Instância Evolution API online (v2.1)'
  },
  {
    id: 'int_email',
    name: 'Google Workspace & E-mail SMTP',
    category: 'Notificações & Prazos',
    description: 'Disparos automáticos de avisos de entrega, aprovação e lembretes de prazos para clientes e responsáveis.',
    status: 'configuravel',
    iconName: 'Mail',
    details: 'Disponível para configuração'
  },
  {
    id: 'int_cloud',
    name: 'Frame.io / Google Drive / Dropbox',
    category: 'Armazenamento & Mídias',
    description: 'Sincronização de arquivos pesados de vídeo (ProRes, 4K Raw) com pré-visualização streaming de baixa latência.',
    status: 'preparado',
    iconName: 'HardDrive',
    details: 'Preparado para integração'
  },
  {
    id: 'int_api',
    name: 'Webhooks & API Externa StudioDesk',
    category: 'Automação Avançada',
    description: 'Conecte o StudioDesk a sistemas ERP, automações n8n/Zapier e portais legados da sua empresa.',
    status: 'configuravel',
    iconName: 'Cpu',
    details: 'Token API v1 gerado com sucesso'
  }
];

export const initialCommunications: Communication[] = [
  {
    id: 'comm_1',
    clientId: 'client_dumonti',
    projectId: 'proj_dumonti_launch',
    channel: 'whatsapp',
    sender: 'Ruan Beguetto',
    content: 'Olá Gabriel! Acabamos de subir a versão V02 do vídeo institucional da Dumonti na aba de aprovação.',
    status: 'lido',
    timestamp: '10:15'
  },
  {
    id: 'comm_2',
    clientId: 'client_dumonti',
    projectId: 'proj_dumonti_launch',
    channel: 'whatsapp',
    sender: 'Gabriel Dumonti',
    content: 'Sensacional, Ruan! Vi aqui no painel do StudioDesk. A transição de cena ficou perfeita. Deixei um apontamento registrado aos 0:45s.',
    status: 'lido',
    timestamp: '10:42'
  },
  {
    id: 'comm_3',
    clientId: 'client_dumonti',
    projectId: 'proj_dumonti_launch',
    channel: 'interno',
    sender: 'Ruan Beguetto',
    content: 'Alinhamento interno: Editor já ajustou o frame aos 0:45s e master 4K será exportada hoje.',
    status: 'lido',
    timestamp: '11:00'
  },
  {
    id: 'comm_4',
    clientId: 'client_santos_tech',
    projectId: 'proj_nexus_saas',
    channel: 'email',
    sender: 'Laura Cristina',
    content: 'Enviamos o roteiro decupado e prévias 3D para validação do time técnico.',
    status: 'entregue',
    timestamp: '14:20'
  }
];

const getRelativeDate = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initialCalendarEvents: CalendarEvent[] = [
  {
    id: 'evt_cal_1',
    title: 'Reunião de Alinhamento Criativo — Dumonti 4K',
    description: 'Validação de trilha sonora, ritmo de corte e feedback dos cortes para redes sociais.',
    date: getRelativeDate(0),
    startTime: '10:00',
    endTime: '11:30',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Ruan Beguetto',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    type: 'meeting',
    status: 'scheduled',
    locationOrLink: 'https://meet.google.com/xyz-studiodesk',
    notes: 'Apresentar versão V02 em DaVinci Resolve.',
    createdAt: '2026-08-18T09:00:00Z'
  },
  {
    id: 'evt_cal_2',
    title: 'Call de Follow-up Comercial — Construtora Miramar',
    description: 'Apresentar orçamento detalhado de captação com drone e vídeo de lançamento imobiliário.',
    date: getRelativeDate(0),
    startTime: '15:00',
    endTime: '15:45',
    clientId: 'client_dumonti',
    clientName: 'Fernando Guimarães (Miramar)',
    assignedTo: 'Ruan Beguetto',
    type: 'call',
    status: 'scheduled',
    locationOrLink: 'Via Telefone / WhatsApp Direto',
    notes: 'Proposta de R$ 18.500 em negociação.',
    createdAt: '2026-08-18T11:00:00Z'
  },
  {
    id: 'evt_cal_3',
    title: 'Apresentação do Roteiro 3D — Nexus SaaS',
    description: 'Apresentar animatic e decupagem de cenas dos servidores para os diretores da Nexus.',
    date: getRelativeDate(1),
    startTime: '14:00',
    endTime: '15:30',
    clientId: 'client_santos_tech',
    clientName: 'Nexus Software & Cloud',
    assignedTo: 'Laura Cristina',
    assignedAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    type: 'presentation',
    status: 'scheduled',
    locationOrLink: 'https://meet.google.com/nex-demo',
    notes: 'Preparar arquivo 3D de pré-visualização.',
    createdAt: '2026-08-17T14:00:00Z'
  },
  {
    id: 'evt_cal_4',
    title: 'Gravação Externa & Captação Gastronômica — Porto Café',
    description: 'Diária completa de captação cinematográfica de baristas e torra especial de café.',
    date: getRelativeDate(2),
    startTime: '09:00',
    endTime: '13:30',
    clientId: 'client_santista',
    clientName: 'Porto Café Gourmet',
    assignedTo: 'Enzo Paulin',
    assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    type: 'task',
    status: 'scheduled',
    locationOrLink: 'Rua XV de Novembro, 42 — Centro Histórico',
    notes: 'Equipamento: Câmeras FX3, Gimbal RS3 Pro e Lentes 24-70mm e 85mm.',
    createdAt: '2026-08-16T10:00:00Z'
  },
  {
    id: 'evt_cal_5',
    title: 'Deadline: Entrega Master 4K — Campanha Dumonti',
    description: 'Prazo fatal para upload dos arquivos finais e entrega do link de download master.',
    date: getRelativeDate(3),
    startTime: '18:00',
    endTime: '19:00',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Bruno Alex',
    assignedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    type: 'deadline',
    status: 'scheduled',
    notes: 'Enviar nos formatos ProRes 422 HQ e H.264 Web.',
    createdAt: '2026-08-15T16:00:00Z'
  },
  {
    id: 'evt_cal_6',
    title: 'Alinhamento de Briefing & Decupagem — Vivere',
    description: 'Reunião de kickoff para definir o tour arquitetônico da Mansão Acqua.',
    date: getRelativeDate(-1),
    startTime: '16:00',
    endTime: '17:00',
    clientId: 'client_vivere',
    clientName: 'Vivere Arquitetura & Interiores',
    assignedTo: 'Bruno Alex',
    type: 'meeting',
    status: 'completed',
    notes: 'Briefing concluído com sucesso. Roteiro em andamento.',
    createdAt: '2026-08-14T09:00:00Z'
  },
  {
    id: 'evt_cal_7',
    title: 'Call de Diagnóstico Inicial — Restaurante Terraço Mar',
    description: 'Diagnóstico de presença digital e pacote de vídeos gastronômicos.',
    date: getRelativeDate(-3),
    startTime: '11:00',
    endTime: '11:45',
    clientName: 'Carlos Eduardo (Terraço Mar)',
    assignedTo: 'Ruan Beguetto',
    type: 'follow_up',
    status: 'completed',
    notes: 'Cliente demonstrou alto interesse. Proposta enviada.',
    createdAt: '2026-08-12T10:00:00Z'
  }
];

export const initialApprovalRequests: ApprovalRequest[] = [
  {
    id: 'appr_1',
    title: 'Vídeo Institucional Dumonti 4K — Corte Final V02',
    description: 'Versão revisada com color grading final em DaVinci Resolve e correção na transição aos 0:45s.',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    projectId: 'proj_dumonti_launch',
    projectTitle: 'Campanha de Lançamento — Dumonti',
    assignedTo: 'Ruan Beguetto',
    assignedAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    category: 'video',
    createdAt: getRelativeDate(-2),
    dueDate: getRelativeDate(2),
    status: 'in_review',
    priority: 'urgente',
    fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    fileType: 'video',
    feedbackNotes: 'Cliente assistindo e validando a locução nos minutos finais.'
  },
  {
    id: 'appr_2',
    title: 'Roteiro Decupado & Storyboard 3D — Nexus SaaS',
    description: 'Roteiro técnico completo contendo keyframes de animação 3D dos servidores em nuvem.',
    clientId: 'client_santos_tech',
    clientName: 'Nexus Software & Cloud',
    projectId: 'proj_nexus_saas',
    projectTitle: 'Vídeo Manifesto 3D Tech — Nexus SaaS',
    assignedTo: 'Laura Cristina',
    assignedAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    category: 'roteiro',
    createdAt: getRelativeDate(-4),
    dueDate: getRelativeDate(1),
    status: 'pending',
    priority: 'alta',
    fileType: 'document'
  },
  {
    id: 'appr_3',
    title: 'Identidade Visual & Capas dos Reels — Porto Café',
    description: 'Design das capas em formato vertical 9:16 e grade mensal de publicações gastronômicas.',
    clientId: 'client_santista',
    clientName: 'Porto Café Gourmet',
    projectId: 'proj_porto_cafe',
    projectTitle: 'Série Gastronômica — Porto Café',
    assignedTo: 'Enzo Paulin',
    assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    category: 'design',
    createdAt: getRelativeDate(-6),
    dueDate: getRelativeDate(-1),
    status: 'approved',
    priority: 'media',
    fileType: 'image',
    reviewedBy: 'Mariana Castilho',
    reviewedAt: getRelativeDate(-1),
    feedbackNotes: 'Aprovado sem qualquer ajuste! As cores terrosas reforçam o posicionamento gourmet.'
  },
  {
    id: 'appr_4',
    title: 'Orçamento & Diária de Locação Drone — Mansão Acqua',
    description: 'Planilha detalhada de custos de diária de captação aérea com drone 4K e piloto homologado.',
    clientId: 'client_vivere',
    clientName: 'Vivere Arquitetura & Interiores',
    projectId: 'proj_vivere_tour',
    projectTitle: 'Tour Arquitetônico Mansão Acqua — Vivere',
    assignedTo: 'Bruno Alex',
    assignedAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    category: 'orcamento',
    createdAt: getRelativeDate(-3),
    dueDate: getRelativeDate(3),
    status: 'needs_revision',
    priority: 'media',
    fileType: 'document',
    revisionNotes: 'Favor detalhar se o valor já contempla a taxa de autorização do condomínio fechado.'
  },
  {
    id: 'appr_5',
    title: 'Contrato de Produção Audiovisual Semestral',
    description: 'Minuta contratual com cessão de direitos de imagem e cronograma de entregas mensais.',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Ruan Beguetto',
    category: 'contrato',
    createdAt: getRelativeDate(-8),
    dueDate: getRelativeDate(-5),
    status: 'approved',
    priority: 'alta',
    fileType: 'document',
    reviewedBy: 'Gabriel Dumonti',
    reviewedAt: getRelativeDate(-5),
    feedbackNotes: 'Contrato assinado digitalmente pelas partes.'
  },
  {
    id: 'appr_6',
    title: 'Trilha Sonora Exclusiva & Sonoplastia — Campanha',
    description: 'Opção de trilha synthwave orquestrada para fechamento comercial da campanha.',
    clientId: 'client_dumonti',
    clientName: 'Dumonti Criação & Brand',
    assignedTo: 'Bruno Alex',
    category: 'outro',
    createdAt: getRelativeDate(-5),
    dueDate: getRelativeDate(-2),
    status: 'rejected',
    priority: 'baixa',
    fileType: 'other',
    rejectionReason: 'Cliente preferiu manter a trilha acústica mais orgânica da versão anterior.'
  }
];

