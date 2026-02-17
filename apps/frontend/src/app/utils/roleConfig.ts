import type { UserRole } from '../types';
import {
  LayoutDashboard,
  Building2,
  Users,
  Calendar,
  Package,
  DollarSign,
  Shield,
  FileText,
  Settings,
  Bell,
  BarChart3,
  Briefcase,
  UserCog,
  Warehouse,
  AlertTriangle,
  MapPin,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const roleLabels: Record<UserRole, string> = {
  super_admin: 'Super Administrator',
  director: 'Director / Business Manager',
  project_manager: 'Project Manager',
  site_manager: 'Site Manager',
  works_manager: 'Works Manager',
  accountant: 'Accountant / Controller',
  procurement_manager: 'Procurement Manager',
  qhse_manager: 'QHSE Manager',
  client: 'Client / Project Owner',
  subcontractor: 'Subcontractor',
  user: 'SmartSite User',
};

export const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['super_admin', 'director', 'project_manager', 'site_manager', 'works_manager', 'accountant', 'procurement_manager', 'qhse_manager', 'client', 'subcontractor', 'user'],
  },
  {
    label: 'Sites',
    href: '/sites',
    icon: Building2,
    roles: ['super_admin', 'director', 'project_manager', 'site_manager', 'works_manager', 'qhse_manager'],
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: Briefcase,
    roles: ['super_admin', 'director', 'project_manager', 'works_manager', 'accountant', 'client'],
  },
  {
    label: 'Planning',
    href: '/planning',
    icon: Calendar,
    roles: ['super_admin', 'project_manager', 'site_manager', 'works_manager'],
  },
  {
    label: 'Team',
    href: '/team',
    icon: Users,
    roles: ['super_admin', 'director', 'project_manager', 'site_manager', 'works_manager'],
  },
  {
    label: 'Clients',
    href: '/clients',
    icon: UserCog,
    roles: ['super_admin', 'director', 'accountant'],
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: Warehouse,
    roles: ['super_admin', 'procurement_manager', 'accountant'],
  },
  {
    label: 'Materials',
    href: '/materials',
    icon: Package,
    roles: ['super_admin', 'procurement_manager', 'site_manager', 'works_manager'],
  },
  {
    label: 'Finance',
    href: '/finance',
    icon: DollarSign,
    roles: ['super_admin', 'director', 'accountant'],
  },
  {
    label: 'QHSE & Safety',
    href: '/qhse',
    icon: Shield,
    roles: ['super_admin', 'qhse_manager', 'site_manager', 'works_manager'],
  },
  {
    label: 'Incidents',
    href: '/incidents',
    icon: AlertTriangle,
    roles: ['super_admin', 'qhse_manager', 'site_manager', 'works_manager', 'project_manager'],
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: FileText,
    roles: ['super_admin', 'director', 'project_manager', 'works_manager', 'accountant', 'qhse_manager', 'client'],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    roles: ['super_admin', 'director', 'project_manager', 'works_manager', 'accountant'],
  },
  {
    label: 'Map View',
    href: '/map',
    icon: MapPin,
    roles: ['super_admin', 'director', 'works_manager', 'project_manager'],
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['super_admin', 'director', 'project_manager', 'site_manager', 'works_manager', 'accountant', 'procurement_manager', 'qhse_manager', 'client', 'subcontractor', 'user'],
  },
  {
    label: 'User Management',
    href: '/users',
    icon: Settings,
    roles: ['super_admin'],
  },
];

export const getNavigationForRole = (role: UserRole): NavItem[] => {
  return navigationItems.filter((item) => item.roles.includes(role));
};

export const canAccessRoute = (role: UserRole, path: string): boolean => {
  const navItem = navigationItems.find((item) => path.startsWith(item.href));
  return navItem ? navItem.roles.includes(role) : false;
};
