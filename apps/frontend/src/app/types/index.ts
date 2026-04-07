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

export interface Milestone {
  _id?: string;
  title?: string;
  tasks?: Task[];
  description?: string;
  projectId?: string;
  siteId?: string;
  createdBy?: string;
  updatedBy?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreateTaskPayload {
  title?: string;
  description?: string;
  milestoneId?: string;
  status?: string;
  priority?: TaskPriorityEnum;
  projectId?: string;
  siteId?: string;
  assignedTeams?: string[];
  startDate?: Date;
  endDate?: Date;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: string;
  priority?: TaskPriorityEnum;
  projectId?: string;
  siteId?: string;
  assignedTeams?: string[];
  progress?: number;
  startDate?: Date;
  endDate?: Date;
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
  telephone: string;
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
  assignedTeam?: string[];
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

export interface TaskStage {
  _id?: string;
  name: string;
  description?: string;
  color?: string;
  order?: number;
  milestoneId?: string;
  projectId?: string;
  tasks?: Task[];
  createdBy?: string;
  updatedBy?: string;
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

  href: string;
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
  isFirstLogin: boolean;
  login: (cin: string, password: string) => Promise<any>;
  updateFirstLoginStatus: (status: boolean) => void;
  register: (
    cin: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string,
    telephone?: string,
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
  logout: () => Promise<void>;
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
  teams?: SiteTeam[];
  priority?: "low" | "medium" | "high" | "critical";
  comments?: SiteComment[];
  issues?: SiteIssue[];
}

export interface SiteComment {
  id: string;
  text: string;
  author: string;
  createdAt: string;
}

export interface SiteIssue {
  id: string;
  type: "delay" | "budget" | "safety" | "quality" | "resource" | "other";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  createdAt: string;
  resolved: boolean;
}

export interface SiteTeam {
  _id: string;
  name: string;
  description?: string;
  teamCode?: string;
}

// export interface Task {
//   id: string;
//   title: string;
//   description: string;
//   status: "todo" | "in_progress" | "review" | "completed";
//   priority: "low" | "medium" | "high" | "critical";
//   startDate: string;
//   plannedEndDate: string;
//   actualEndDate?: string;
//   progress: number;
//   workedHours: number;
//   dependencies: string[];
//   projectId: string;
//   assignees: string[];
//   createdAt: string;
//   updatedAt: string;
// }


export const THEMES = [
  {
    name: "light",
    label: "Light",
    colors: ["#ffffff", "#5a67d8", "#8b5cf6", "#1a202c"],
  },
  {
    name: "dark",
    label: "Dark",
    colors: ["#1f2937", "#8b5cf6", "#ec4899", "#1a202c"],
  },
  {
    name: "cupcake",
    label: "Cupcake",
    colors: ["#f5f5f4", "#65c3c8", "#ef9fbc", "#291334"],
  },
  {
    name: "forest",
    label: "Forest",
    colors: ["#1f1d1d", "#3ebc96", "#70c217", "#e2e8f0"],
  },
  {
    name: "bumblebee",
    label: "Bumblebee",
    colors: ["#ffffff", "#f8e36f", "#f0d50c", "#1c1917"],
  },
  {
    name: "emerald",
    label: "Emerald",
    colors: ["#ffffff", "#66cc8a", "#3b82f6", "#1e3a8a"],
  },
  {
    name: "corporate",
    label: "Corporate",
    colors: ["#ffffff", "#4b6bfb", "#7b92b2", "#1d232a"],
  },
  {
    name: "synthwave",
    label: "Synthwave",
    colors: ["#2d1b69", "#e779c1", "#58c7f3", "#f8f8f2"],
  },
  {
    name: "retro",
    label: "Retro",
    colors: ["#e4d8b4", "#ea6962", "#6aaa64", "#282425"],
  },
  {
    name: "cyberpunk",
    label: "Cyberpunk",
    colors: ["#ffee00", "#ff7598", "#75d1f0", "#1a103d"],
  },
  {
    name: "valentine",
    label: "Valentine",
    colors: ["#f0d6e8", "#e96d7b", "#a991f7", "#37243c"],
  },
  {
    name: "halloween",
    label: "Halloween",
    colors: ["#0d0d0d", "#ff7800", "#006400", "#ffffff"],
  },
  {
    name: "garden",
    label: "Garden",
    colors: ["#e9e7e7", "#ec4899", "#16a34a", "#374151"],
  },

  {
    name: "aqua",
    label: "Aqua",
    colors: ["#193549", "#4cd4e3", "#9059ff", "#f8d766"],
  },
  {
    name: "lofi",
    label: "Lofi",
    colors: ["#0f0f0f", "#1a1919", "#232323", "#2c2c2c"],
  },
  {
    name: "pastel",
    label: "Pastel",
    colors: ["#f7f3f5", "#d1c1d7", "#a1e3d8", "#4a98f1"],
  },
  {
    name: "fantasy",
    label: "Fantasy",
    colors: ["#ffe7d6", "#a21caf", "#3b82f6", "#f59e0b"],
  },
  {
    name: "wireframe",
    label: "Wireframe",
    colors: ["#e6e6e6", "#b3b3b3", "#b3b3b3", "#888888"],
  },
  {
    name: "black",
    label: "Black",
    colors: ["#000000", "#191919", "#313131", "#4a4a4a"],
  },
  {
    name: "luxury",
    label: "Luxury",
    colors: ["#171618", "#1e293b", "#94589c", "#d4a85a"],
  },
  {
    name: "dracula",
    label: "Dracula",
    colors: ["#282a36", "#ff79c6", "#bd93f9", "#f8f8f2"],
  },
  {
    name: "cmyk",
    label: "CMYK",
    colors: ["#f0f0f0", "#0891b2", "#ec4899", "#facc15"],
  },
  {
    name: "autumn",
    label: "Autumn",
    colors: ["#f2f2f2", "#8c1f11", "#f28c18", "#6f4930"],
  },
  {
    name: "business",
    label: "Business",
    colors: ["#f5f5f5", "#1e40af", "#3b82f6", "#f97316"],
  },
  {
    name: "acid",
    label: "Acid",
    colors: ["#110e0e", "#ff00f2", "#ff7a00", "#99ff01"],
  },
  {
    name: "lemonade",
    label: "Lemonade",
    colors: ["#ffffff", "#67e8f9", "#f5d742", "#2c3333"],
  },
  {
    name: "night",
    label: "Night",
    colors: ["#0f172a", "#38bdf8", "#818cf8", "#e2e8f0"],
  },
  {
    name: "coffee",
    label: "Coffee",
    colors: ["#20161f", "#dd9866", "#497174", "#eeeeee"],
  },
  {
    name: "winter",
    label: "Winter",
    colors: ["#ffffff", "#0284c7", "#d946ef", "#0f172a"],
  },
  {
    name: "dim",
    label: "Dim",
    colors: ["#1c1c27", "#10b981", "#ff5a5f", "#0f172a"],
  },
  {
    name: "nord",
    label: "Nord",
    colors: ["#eceff4", "#5e81ac", "#81a1c1", "#3b4252"],
  },
  {
    name: "sunset",
    label: "Sunset",
    colors: ["#1e293b", "#f5734c", "#ec4899", "#ffffff"],
  },
];

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Mandarin",
  "Japanese",
  "Korean",
  "Hindi",
  "Russian",
  "Portuguese",
  "Arabic",
  "Italian",
  "Turkish",
  "Dutch",
];

export const LANGUAGE_TO_FLAG = {
  english: "gb",
  spanish: "es",
  french: "fr",
  german: "de",
  mandarin: "cn",
  japanese: "jp",
  korean: "kr",
  hindi: "in",
  russian: "ru",
  portuguese: "pt",
  arabic: "sa",
  italian: "it",
  turkish: "tr",
  dutch: "nl",
};

export interface Task {
  _id: string;
  title?: string;

  description?: string;

  milestoneId?: string;

  assignedTeams?: string[];

  priority?: TaskPriorityEnum;

  projectId?: string;

  siteId?: string;

  createdBy?: string;

  updatedBy?: string;

  status?: TaskStatusEnum;
  progress?: number;

  startDate?: Date;

  endDate?: Date;
}
export enum TaskStatusEnum {
  BACKLOG = "BACKLOG",
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  IN_REVIEW = "IN_REVIEW",
  DONE = "DONE",
}

export enum TaskPriorityEnum {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}
export interface Client {
  _id: string;
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

export const KANBAN_BOARD_CIRCLE_COLORS_MAP = {
  primary: "bg-kanban-board-circle-primary",
  gray: "bg-kanban-board-circle-gray",
  red: "bg-kanban-board-circle-red",
  yellow: "bg-kanban-board-circle-yellow",
  green: "bg-kanban-board-circle-green",
  cyan: "bg-kanban-board-circle-cyan",
  blue: "bg-kanban-board-circle-blue",
  indigo: "bg-kanban-board-circle-indigo",
  violet: "bg-kanban-board-circle-violet",
  purple: "bg-kanban-board-circle-purple",
  pink: "bg-kanban-board-circle-pink",
};
