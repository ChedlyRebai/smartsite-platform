import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";



const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (cin: string, password: string) => {
        try {
          const res = await api.post("/auth/login", {
            cin,
            password,
          });

          const token = res.data.access_token;
          // attach token globally
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          console.log('Login successful, token:', token);

          set({
            user: {
              access_token: res.data.access_token,
              id: res.data.id,
              cin: res.data.cin,
              firstName: res.data.firstName,
              lastName: res.data.lastName,
              role: res.data.role,
            },
            isAuthenticated: true,
          });
          
          return res.data;
        } catch (error: any) {
          console.error('Login failed:', error.response?.data?.message || error.message);
          set({
            user: null,
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Inscription réelle via backend d'auth (signature compatible avec Register.tsx)
      register: async (
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
      ) => {
        const res = await api.post("/auth/register", {
          cin,
          password, // généralement vide, mot de passe généré à l'approbation
          firstName,
          lastName,
          email,
          phoneNumber,
          departement,
          adresse: address,
          role,
          companyName,
          preferredLanguage,
          certifications,
        });
        return res.data;
      },

      // Récupérer les utilisateurs en attente (admin)
      getPendingUsers: async () => {
        const res = await api.get("/users/pending");
        return res.data;
      },

      // Approuver un utilisateur (admin)
      approveUser: async (userId: string, password: string) => {
        const res = await api.post(`/auth/approve-user/${userId}`, {
          password,
        });
        return res.data;
      },

      // Rejeter / supprimer un utilisateur (admin)
      rejectUser: async (userId: string) => {
        const res = await api.delete(`/users/${userId}`);
        return res.data;
      },

      logout: () => {
        // Clear authorization header
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "smartsite-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.user?.access_token) {
          api.defaults.headers.common["Authorization"] =
            `Bearer ${state.user.access_token}`;
        }
      },
    },
  ),
);
