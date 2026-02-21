import axios from "axios";

const API_URL = "http://localhost:3002";

export enum IncidentType {
  MATERIEL = "materiel",
  ENVIRONNEMENT = "environnement",
  PERSONNEL = "personnel",
}

export enum IncidentDegree {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface Incident {
  id: string;
  type: IncidentType;
  degree: IncidentDegree;
  title: string;
  description?: string | null;
  reportedAt: string;
  reportedBy?: string | null;
  siteId?: string;
  projectId?: string;
  location?: string;
  reporterName?: string;
  reporterPhone?: string;
  affectedPersons?: string;
  immediateAction?: string;
  status?: string;
  resolvedBy?: string;
  resolutionNotes?: string;
}

export interface CreateIncidentDto {
  type: IncidentType;
  degree: IncidentDegree;
  title: string;
  description?: string;
  reportedBy?: string;
  siteId?: string;
  projectId?: string;
  location?: string;
  reporterName?: string;
  reporterPhone?: string;
  affectedPersons?: string;
  immediateAction?: string;
  status?: string;
}

export interface UpdateIncidentDto {
  type?: IncidentType;
  degree?: IncidentDegree;
  title?: string;
  description?: string;
  reportedBy?: string;
  siteId?: string;
  projectId?: string;
  location?: string;
  status?: string;
  resolutionNotes?: string;
  resolvedBy?: string;
}

// Créer un client axios
const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Récupérer tous les incidents
 */
export const getIncidents = async (): Promise<Incident[]> => {
  try {
    const response = await apiClient.get<Incident[]>("/incidents");
    return response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération des incidents:", error);
    throw error;
  }
};

/**
 * Récupérer un incident par ID
 */
export const getIncidentById = async (id: string): Promise<Incident> => {
  try {
    const response = await apiClient.get<Incident>(`/incidents/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'incident ${id}:`, error);
    throw error;
  }
};

/**
 * Créer un nouvel incident
 */
export const createIncident = async (
  dto: CreateIncidentDto,
): Promise<Incident> => {
  try {
    const response = await apiClient.post<Incident>("/incidents", dto);
    return response.data;
  } catch (error: any) {
    if (error.code === "ECONNREFUSED" || error.message === "Network Error") {
      console.error("❌ Impossible de se connecter à http://localhost:3002");
      throw new Error(
        "Le service incident-management n'est pas disponible.\n" +
          "Veuillez lancer: cd apps/backend/incident-management && npm run start:dev",
      );
    }
    console.error("Erreur lors de la création de l'incident:", error);
    throw error;
  }
};

/**
 * Mettre à jour un incident
 */
export const updateIncident = async (
  id: string,
  dto: UpdateIncidentDto,
): Promise<Incident> => {
  try {
    const response = await apiClient.put<Incident>(`/incidents/${id}`, dto);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la mise à jour de l'incident ${id}:`, error);
    throw error;
  }
};

/**
 * Supprimer un incident
 */
export const deleteIncident = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`/incidents/${id}`);
  } catch (error) {
    console.error(`Erreur lors de la suppression de l'incident ${id}:`, error);
    throw error;
  }
};
