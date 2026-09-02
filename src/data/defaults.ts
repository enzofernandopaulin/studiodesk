import { KanbanColumn } from '../types';

export const DEFAULT_KANBAN_COLUMNS: KanbanColumn[] = [
  { id: 'col_briefing', title: 'BRIEFING & ROTEIRO', color: '#66acd7', order: 0 },
  { id: 'col_producao', title: 'GRAVAÇÃO / PRODUÇÃO', color: '#2F6F9C', order: 1 },
  { id: 'col_edicao', title: 'EDIÇÃO & MOTION', color: '#8B5CF6', order: 2 },
  { id: 'col_revisao', title: 'REVISÃO INTERNA', color: '#F59E0B', order: 3 },
  { id: 'col_aprovacao', title: 'APROVAÇÃO DO CLIENTE', color: '#EC4899', order: 4 },
  { id: 'col_concluido', title: 'ENTREGA & CONCLUÍDO', color: '#10B981', order: 5 },
];
