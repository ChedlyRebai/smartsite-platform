import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const authData = localStorage.getItem('smartsite-auth');
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      if (parsed.state?.user?.access_token) {
        config.headers.Authorization = `Bearer ${parsed.state.user.access_token}`;
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  return config;
});

export interface Team {
  _id: string;
  name: string;
  description?: string;
  members: any[];
  manager?: any;
  site?: any;
  isActive: boolean;
  teamCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const getAllTeams = async (): Promise<{ status: number; data: Team[] }> => {
  try {
    const response = await api.get('/teams');
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const getTeamById = async (id: string): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.get(`/teams/${id}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error fetching team:', error);
    throw error;
  }
};

export const createTeam = async (team: Partial<Team>): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.post('/teams', team);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error creating team:', error);
    throw error;
  }
};

export const updateTeam = async (id: string, team: Partial<Team>): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.put(`/teams/${id}`, team);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error updating team:', error);
    throw error;
  }
};

export const deleteTeam = async (id: string): Promise<{ status: number }> => {
  try {
    const response = await api.delete(`/teams/${id}`);
    return { status: response.status };
  } catch (error: any) {
    console.error('Error deleting team:', error);
    throw error;
  }
};

export const addMemberToTeam = async (teamId: string, memberId: string): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.post(`/teams/${teamId}/members/${memberId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error adding member to team:', error);
    throw error;
  }
};

export const removeMemberFromTeam = async (teamId: string, memberId: string): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error removing member from team:', error);
    throw error;
  }
};

export const setTeamManager = async (teamId: string, managerId: string): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.put(`/teams/${teamId}/manager/${managerId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error setting team manager:', error);
    throw error;
  }
};

export const assignSiteToTeam = async (teamId: string, siteId: string): Promise<{ status: number; data: Team }> => {
  try {
    const response = await api.put(`/teams/${teamId}/site/${siteId}`);
    return { status: response.status, data: response.data };
  } catch (error: any) {
    console.error('Error assigning site to team:', error);
    throw error;
  }
};
