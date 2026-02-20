import type { UserRole } from '../types';

export type Permission = 
  | 'view_dashboard'
  | 'manage_sites'
  | 'manage_projects'
  | 'manage_team'
  | 'manage_clients'
  | 'manage_suppliers'
  | 'manage_materials'
  | 'manage_finance'
  | 'manage_qhse'
  | 'manage_incidents'
  | 'manage_users'
  | 'view_analytics'
  | 'view_reports';

const rolePermissions: Record<UserRole, Permission[]> = {
  super_admin: [
    'view_dashboard',
    'manage_sites',
    'manage_projects',
    'manage_team',
    'manage_clients',
    'manage_suppliers',
    'manage_materials',
    'manage_finance',
    'manage_qhse',
    'manage_incidents',
    'manage_users',
    'view_analytics',
    'view_reports',
  ],
  director: [
    'view_dashboard',
    'manage_sites',
    'manage_projects',
    'manage_team',
    'manage_clients',
    'manage_finance',
    'manage_incidents',
    'view_analytics',
    'view_reports',
  ],
  project_manager: [
    'view_dashboard',
    'manage_sites',
    'manage_projects',
    'manage_team',
    'manage_incidents',
    'view_analytics',
    'view_reports',
  ],
  site_manager: [
    'view_dashboard',
    'manage_sites',
    'manage_materials',
    'manage_team',
    'manage_qhse',
    'manage_incidents',
  ],
  works_manager: [
    'view_dashboard',
    'manage_sites',
    'manage_projects',
    'manage_team',
    'manage_materials',
    'manage_qhse',
    'manage_incidents',
    'view_analytics',
  ],
  accountant: [
    'view_dashboard',
    'manage_clients',
    'manage_suppliers',
    'manage_finance',
    'view_analytics',
  ],
  procurement_manager: [
    'view_dashboard',
    'manage_suppliers',
    'manage_materials',
  ],
  qhse_manager: [
    'view_dashboard',
    'manage_qhse',
    'manage_incidents',
    'view_reports',
  ],
  client: [
    'view_dashboard',
    'view_reports',
  ],
  subcontractor: [
    'view_dashboard',
  ],
  user: [
    'view_dashboard',
  ],
};

export const hasPermission = (role: UserRole, permission: Permission): boolean => {
  return rolePermissions[role]?.includes(permission) ?? false;
};

export const canEdit = (role: UserRole, resource: 'sites' | 'projects' | 'team' | 'clients' | 'suppliers' | 'materials' | 'finance' | 'qhse' | 'incidents' | 'users'): boolean => {
  const permissionMap: Record<string, Permission> = {
    sites: 'manage_sites',
    projects: 'manage_projects',
    team: 'manage_team',
    clients: 'manage_clients',
    suppliers: 'manage_suppliers',
    materials: 'manage_materials',
    finance: 'manage_finance',
    qhse: 'manage_qhse',
    incidents: 'manage_incidents',
    users: 'manage_users',
  };

  return hasPermission(role, permissionMap[resource]);
};

export const canCreate = canEdit;
export const canDelete = canEdit;
export const canUpdate = canEdit;
