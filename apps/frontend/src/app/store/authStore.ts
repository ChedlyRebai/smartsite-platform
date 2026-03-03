import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (cin: string, password: string, recaptchaToken: string) => {
        try {
          const res = await api.post("/auth/login", {
            cin,
            password,
            recaptchaToken,
          });

          const token = res.data.access_token;
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          console.log('Login successful, token:', token);

          set({
            user: {
              access_token: res.data.access_token,
              id: res.data.id,
              cin: res.data.cin,
              firstname: res.data.firstname,
              lastname: res.data.lastname,
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

      loginWithGoogle: (user: any, token: string) => {
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        set({
          user: {
            access_token: token,
            id: user.id,
            cin: user.cin || '',
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
          },
          isAuthenticated: true,
        });
      },

      register: async (
        cin: string,
        password: string,
        firstname: string,
        lastname: string,
        email: string,
        telephone: string,
        departement: string,
        adresse: string,
        role: string,
      ) => {
        const res = await api.post("/auth/register", {
          cin,
          password,
          firstname,
          lastname,
          email,
          telephone,
          departement,
          adresse,
          role,
        });
        return res.data;
      },

      getPendingUsers: async () => {
        const res = await api.get("/users/pending");
        return res.data;
      },

      approveUser: async (userId: string, password: string) => {
        const res = await api.post(`/auth/approve-user/${userId}`, {
          password,
        });
        return res.data;
      },

      rejectUser: async (userId: string) => {
        const res = await api.delete(`/users/${userId}`);
        return res.data;
      },

      logout: () => {
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