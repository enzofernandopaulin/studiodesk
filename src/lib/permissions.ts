import { UserRole, ActiveView } from '../types';

export type Permission =
  | 'view:team' | 'manage:team' | 'manage:integrations' | 'manage:settings'
  | 'manage:crm' | 'manage:projects' | 'manage:tasks' | 'manage:approvals'
  | 'manage:calendar' | 'manage:communication' | 'manage:kanban';

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'view:team','manage:team','manage:integrations','manage:settings','manage:crm',
    'manage:projects','manage:tasks','manage:approvals','manage:calendar','manage:communication','manage:kanban'
  ],
  gestor: [
    'view:team','manage:crm','manage:projects','manage:tasks','manage:approvals',
    'manage:calendar','manage:communication','manage:kanban'
  ],
  colaborador: ['manage:tasks','manage:approvals','manage:calendar','manage:communication']
};

export const can = (role: UserRole, permission: Permission) => rolePermissions[role]?.includes(permission) ?? false;

export const viewPermission: Partial<Record<ActiveView, Permission>> = {
  leads: 'manage:crm',
  clients: 'manage:crm',
  client_profile: 'manage:crm',
  kanban: 'manage:kanban',
  projects: 'manage:projects',
  project_detail: 'manage:projects',
  tasks: 'manage:tasks',
  calendar: 'manage:calendar',
  schedule: 'manage:calendar',
  approvals: 'manage:approvals',
  approval: 'manage:approvals',
  communication: 'manage:communication',
  team: 'view:team',
  integrations: 'manage:integrations',
  settings: 'manage:settings',
};
