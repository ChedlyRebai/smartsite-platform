// User Roles
export type RoleType =
  | "super_admin"
  | "director"
  | "project_manager"
  | "site_manager"
  | "works_manager"
  | "accountant"
  | "procurement_manager"
  | "qhse_manager"
  | "client"
  | "subcontractor"
  | "user";

export interface UserRole {
  _id: string;
  name: RoleType;
  permissions: Array<String>;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  _id: string;
  nom?: string;
  prenom?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  phoneNumber: string;
  cin: string;
  profilePicture?: string;
  isActive: boolean;
  preferredLanguage?: string;
  projectsCount?: number;
  companyName?: string;
  createdDate: string;
  lastLoginDate?: string;
  avatar?: string;
  address?: string;
  departement?: string;
  status?: string;
  certifications?: string[];
}

export interface Permisssion {
  _id: string;
  name: string;
  href: string;
  access: boolean;
  create: boolean;
  delete: boolean;
  update: boolean;
  description?: string;
}

export interface Role {
  _id: string;
  name: string;
  permissions: string[] | Permission[]; // ObjectId[] or populated Permission[]
  createdAt: Date;
  updatedAt: Date;
  userCount?: number; // Virtual field for frontend
}

export interface Permission {
  _id: string;
  name: string;
  source: boolean;
  access: boolean;
  create: boolean;
  delete: boolean;
  update: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: {
    access_token: string;
    id: string;
    cin: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    firstLogin?: boolean;
  };
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    cin: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    phoneNumber?: string,
    departement?: string,
    address?: string,
    role?: string,
    companyName?: string,
    preferredLanguage?: string,
    certifications?: string[],
  ) => Promise<void>;
  getPendingUsers?: () => Promise<User[]>;
  approveUser?: (userId: string, password: string) => Promise<User>;
  rejectUser?: (userId: string) => Promise<void>;
  getCurrentUser?: () => Promise<any>;
  updateProfile?: (data: any) => Promise<any>;
  logout: () => void;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: UserRole;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description: string;
  clientId: string;
  budget: number;
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  status: "planning" | "in_progress" | "on_hold" | "completed" | "cancelled";
  progress: number;
  estimatedHours: number;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  name: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  area: number;
  status: "planning" | "in_progress" | "on_hold" | "completed";
  workStartDate: string;
  workEndDate?: string;
  projectId: string;
  budget: number;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "completed";
  priority: "low" | "medium" | "high" | "critical";
  startDate: string;
  plannedEndDate: string;
  actualEndDate?: string;
  progress: number;
  workedHours: number;
  dependencies: string[];
  projectId: string;
  assignees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  projects: number;
  totalValue: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  address: string;
  contact: string;
  email: string;
  phone: string;
  category: string;
  rating: number;
  contractDate: string;
  stockType: string;
  stockQuantity: number;
  receivedQuantity: number;
  usedQuantity: number;
}

export interface Notification {
  id: string;
  type: "info" | "warning" | "critical" | "success";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  userId: string;
}

export interface Incident {
  id: string;
  type: "safety" | "quality" | "delay" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  siteId: string;
  reportedBy: string;
  status: "open" | "investigating" | "resolved" | "closed";
  createdAt: string;
  resolvedAt?: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalSites: number;
  activeSites: number;
  totalTeamMembers: number;
  activeTeamMembers: number;
  totalBudget: number;
  budgetConsumed: number;
  averageProgress: number;
  delayedProjects: number;
  safetyIncidents: number;
  pendingTasks: number;
}
