import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";
import { trackLogout } from "../action/audit.action";
import { AUTH_API_URL } from "@/lib/auth-api-url";

const api = axios.create({
  baseURL: AUTH_API_URL,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isFirstLogin: false,

      login: async (cin: string, password: string) => {
        try {
          const res = await api.post("/auth/login", {
            cin,
            password,
          });

          const token = res.data.access_token;
          // attach token globally
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          console.log("Login successful, token:", token);

          const userData = {
            access_token: res.data.access_token,
            id: res.data.id,
            cin: res.data.cin,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            role: res.data.role,
            firstLogin: res.data.firstLogin,
          };  

          set({
            user: userData,
            isAuthenticated: true,
            isFirstLogin: res.data.firstLogin || false,
          });

          const expires = new Date(Date.now() + 1000 * 1000 * 1000);

          localStorage.setItem("jwt", res.data.access_token);
          console.log("Login successful, token stored in localStorage", res.data.access_token);

          // Debug logging
          console.log("AuthStore login - res.data:", res.data);
          console.log(
            "AuthStore login - firstLogin from response:",
            res.data.firstLogin,
          );
          console.log(
            "AuthStore login - isFirstLogin set to:",
            res.data.firstLogin || false,
          );
          if (res.data.session_id) {
            localStorage.setItem("session_id", res.data.session_id);
          }

          return userData;
        } catch (error: any) {
          console.error(
            "Login failed:",
            error.response?.data?.message || error.message,
          );
          set({
            user: null,
            isAuthenticated: false,
            isFirstLogin: false,
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
        telephone?: string,
        departement?: string,
        address?: string,
        role?: string,
        companyName?: string,
        preferredLanguage?: string,
        certifications?: string[],
      ) => {
        const res = await api.post("/auth/register", {
          cin,
          password,
          firstName,
          lastName,
          email,
          phoneNumber: telephone,
          departement,
          address,
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

      // Rejeter un utilisateur (admin)
      rejectUser: async (userId: string, reason?: string) => {
        const res = await api.post(`/auth/reject-user/${userId}`, {
          reason,
        });
        return res.data;
      },

      logout: async () => {
        const sessionId = localStorage.getItem("session_id") || undefined;
        await trackLogout(sessionId);
        localStorage.removeItem("session_id");
        // Clear authorization header
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, isAuthenticated: false, isFirstLogin: false });
      },

      updateFirstLoginStatus: (status: boolean) => {
        set({ isFirstLogin: status });
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
