export type RoleType =
  | "super_admin"
  | "admin"
  | "director"
  | "project_manager"
  | "site_manager"
  | "works_manager"
  | "qhse_manager"
  | "accountant"
  | "procurement_manager"
  | "client"
  | "subcontractor"
  | "user";

// Rôles autorisés à CRÉER un incident
export const CAN_CREATE_INCIDENT: RoleType[] = [
  "super_admin",
  "admin",
  "site_manager",
  "project_manager",
  "works_manager",
  "qhse_manager",
  "subcontractor",
];

// Rôles autorisés à LIRE les incidents
export const CAN_READ_INCIDENT: RoleType[] = [
  "super_admin",
  "admin",
  "director",
  "project_manager",
  "site_manager",
  "works_manager",
  "qhse_manager",
  "accountant",
  "client", // read-only
];

// Rôles autorisés à RÉSOUDRE un incident
export const CAN_RESOLVE_INCIDENT: RoleType[] = [
  "super_admin",
  "admin",
  "project_manager",
  "works_manager",
  "qhse_manager",
  "director", // si critique
];

// Rôles autorisés à SUPPRIMER un incident
export const CAN_DELETE_INCIDENT: RoleType[] = [
  "super_admin",
  "admin",
  "qhse_manager",
];

// Vérifier les permissions
export const canCreateIncident = (role: RoleType): boolean => {
  return CAN_CREATE_INCIDENT.includes(role);
};

export const canReadIncident = (role: RoleType): boolean => {
  return CAN_READ_INCIDENT.includes(role);
};

export const canResolveIncident = (
  role: RoleType,
  degree?: string,
): boolean => {
  if (role === "director" && degree === "high") {
    return true; // Director peut résoudre si critique
  }
  return CAN_RESOLVE_INCIDENT.includes(role);
};

export const canDeleteIncident = (role: RoleType): boolean => {
  return CAN_DELETE_INCIDENT.includes(role);
};

export const isReadOnly = (role: RoleType): boolean => {
  return role === "client"; // Client est en lecture seule
};
