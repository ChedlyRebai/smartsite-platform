import { check } from "zod";
import type { RoleType, UserRole } from "../types";
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
  Target as TargetIcon,
  type LucideIcon,
  Clock,
  Check,
  TrendingUp,
} from "lucide-react";

export interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  roles?: RoleType[];
  children?: NavItemChild[];
  isSection?: boolean;
}

export interface NavItemChild {
  label: string;
  href: string;
  roles: RoleType[];
  icon?: LucideIcon;
}





export const roleLabels: Record<RoleType, string> = {
  super_admin: "Super Administrator",
  director: "Director / Business Manager",
  project_manager: "Project Manager",
  site_manager: "Site Manager",
  works_manager: "Works Manager",
  accountant: "Accountant / Controller",
  procurement_manager: "Procurement Manager",
  qhse_manager: "QHSE Manager",
  client: "Client / Project Owner",
  subcontractor: "Subcontractor",
  user: "SmartSite User",
};

export const navigationItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [
      "super_admin",
      "director",
      "site_manager",
      "works_manager",
      "accountant",
      "procurement_manager",
      "qhse_manager",
      "client",
      "subcontractor",
      "user",
    ],
  },

  {
    label: "Project delivery",
    icon: Briefcase,
    roles: ["super_admin", "director", "project_manager", "site_manager", "works_manager"],
    children: [
      {
        label: "My projects",
        href: "/project-manager-dashboard",
        roles: ["project_manager"],
      },
      {
        label: "All projects",
        href: "/super-admin-projects",
        roles: ["super_admin"],
      },
      {
        label: "Planning",
        href: "/planning",
        roles: ["super_admin", "project_manager", "site_manager", "works_manager"],
      },
      {
        label: "My tasks",
        href: "/my-task",
        roles: ["super_admin", "director", "project_manager", "site_manager", "works_manager", "accountant", "procurement_manager", "qhse_manager", "client", "subcontractor", "user"],
      },
    ],
  },

  {
    label: "Resources & operations",
    icon: Package,
    roles: ["super_admin", "director", "site_manager", "works_manager", "procurement_manager"],
    children: [
      {
        label: "Sites",
        href: "/sites",
        roles: ["super_admin", "director", "project_manager", "site_manager", "works_manager", "qhse_manager"],
      },
      {
        label: "Team",
        href: "/team",
        roles: ["super_admin", "director", "project_manager", "site_manager", "works_manager"],
      },
      {
        label: "Suppliers",
        href: "/suppliers",
        roles: ["super_admin", "procurement_manager", "accountant"],
      },
      {
        label: "Material Catalog",
        href: "/catalog",
        roles: ["super_admin", "procurement_manager", "site_manager", "works_manager"],
      },
      {
        label: "Supplier-Materials",
        href: "/supplier-materials",
        roles: ["super_admin", "procurement_manager", "accountant"],
      },
      {
        label: "Materials",
        href: "/materials",
        roles: ["super_admin", "procurement_manager", "site_manager", "works_manager"],
      },
    ],
  },

  {
    label: "Finance & clients",
    icon: DollarSign,
    roles: ["super_admin", "director", "accountant"],
    children: [
      {
        label: "Finance",
        href: "/finance",
        roles: ["super_admin", "director", "accountant"],
      },
      {
        label: "Paiements",
        href: "/payments",
        roles: ["super_admin", "director", "accountant", "project_manager"],
      },
      {
        label: "Clients",
        href: "/clients",
        roles: ["super_admin", "director", "accountant"],
      },
    ],
  },

  {
    label: "Quality & safety",
    icon: Shield,
    roles: ["super_admin", "qhse_manager", "site_manager", "works_manager", "project_manager"],
    children: [
      {
        label: "QHSE",
        href: "/qhse",
        roles: ["super_admin", "qhse_manager", "site_manager", "works_manager"],
      },
      {
        label: "Incidents",
        href: "/incidents",
        roles: ["super_admin", "qhse_manager", "site_manager", "works_manager", "project_manager"],
      },
    ],
  },

  {
    label: "Analytics & optimization",
    icon: BarChart3,
    roles: ["super_admin", "director", "project_manager", "works_manager", "accountant"],
    children: [
      {
        label: "Analytics",
        href: "/analytics",
        roles: ["super_admin", "director", "project_manager", "works_manager", "accountant"],
      },
      {
        label: "Resource optimization",
        href: "/resource-optimization",
        roles: ["super_admin", "director"],
      },
    ],
  },

  {
    label: "Administration",
    icon: Settings,
    roles: ["super_admin"],
    children: [
      {
        label: "User management",
        href: "/users",
        roles: ["super_admin"],
      },
      {
        label: "Pending approvals",
        href: "/admin/pending-users",
        roles: ["super_admin"],
      },
      {
        label: "System logs",
        href: "/admin/system-logs",
        roles: ["super_admin"],
      },
    ],
  },

  {
    label: "Tools",
    icon: Check,
    roles: ["super_admin", "director", "project_manager", "site_manager", "works_manager", "accountant", "procurement_manager", "qhse_manager", "client", "subcontractor", "user"],
    children: [
      {
        label: "Map view",
        href: "/map",
        roles: ["super_admin", "director", "works_manager", "project_manager"],
      },
      {
        label: "Reports",
        href: "/reports",
        roles: ["super_admin", "director", "project_manager", "works_manager", "accountant", "qhse_manager", "client"],
      },
      {
        label: "Notifications",
        href: "/notifications",
        roles: ["super_admin", "director", "project_manager", "site_manager", "works_manager", "accountant", "procurement_manager", "qhse_manager", "client", "subcontractor", "user"],
      },
    ],
  },
];

export const getNavigationForRole = (role: RoleType): NavItem[] => {
  return navigationItems.filter((item) => item.roles.includes(role));
};



export const canAccessRoute = (role: RoleType, path: string): boolean => {
  const navItem = navigationItems.find((item) => path.startsWith(item.href));
  return navItem ? navItem.roles.includes(role) : false;
};
