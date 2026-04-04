export interface Task {
  _id?: string;
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  deadline?: string;
  projectId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Incident {
  _id?: string;
  id?: string;
  title?: string;
  type?: string;
  description?: string;
  severity?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  assignedTo?: string;
  assignedUserRole?: string;
}

export const incidentMatchesSearch = (incident: Incident, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;

  const searchLower = searchTerm.toLowerCase();

  return (
    incident.title?.toLowerCase().includes(searchLower) ||
    incident.type?.toLowerCase().includes(searchLower) ||
    incident.description?.toLowerCase().includes(searchLower) ||
    incident.severity?.toLowerCase().includes(searchLower) ||
    incident.status?.toLowerCase().includes(searchLower) ||
    incident.assignedTo?.toLowerCase().includes(searchLower)
  );
};

export const taskMatchesSearch = (task: Task, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;

  const searchLower = searchTerm.toLowerCase();

  return (
    task.title?.toLowerCase().includes(searchLower) ||
    task.status?.toLowerCase().includes(searchLower) ||
    task.priority?.toLowerCase().includes(searchLower) ||
    task.description?.toLowerCase().includes(searchLower)
  );
};
