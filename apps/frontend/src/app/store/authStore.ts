import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";

const API_URL = "http://localhost:3000";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (cin: string, password: string) => {
        try {
          // Call the backend API
          const response = await axios.post(`${API_URL}/auth/login`, {
            cin,
            password,
          });

          const { access_token, user } = response.data;

          // Store token in localStorage
          localStorage.setItem("token", access_token);

          // Map backend user to frontend User type
          const mappedUser: User = {
            id: user.id,
            firstName: user.prenom,
            lastName: user.nom,
            email: "", // Backend doesn't return email
            cin: user.cin,
            role: user.roles[0] || "user", // Use first role
            isActive: true,
            createdDate: new Date().toISOString(),
          };

          set({ user: mappedUser, isAuthenticated: true });
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Invalid credentials";
          throw new Error(message);
        }
      },

      register: async (data: RegisterData) => {
        try {
          const response = await axios.post(`${API_URL}/auth/register`, {
            cin: data.cin,
            password: data.password,
            nom: data.lastName,
            prenom: data.firstName,
          });

          if (response.data.error) {
            throw new Error(response.data.error);
          }
        } catch (error: any) {
          const message =
            error?.response?.data?.message ||
            error?.response?.data?.error ||
            "Registration failed";
          throw new Error(message);
        }
      },

      getPendingUsers: async () => {
        // This would need a backend endpoint
        return [];
      },

      approveUser: async (userId: string) => {
        // This would need a backend endpoint
        throw new Error("Not implemented");
      },

      rejectUser: async (userId: string) => {
        // This would need a backend endpoint
        throw new Error("Not implemented");
      },

      logout: () => {
        localStorage.removeItem("token");
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "smartsite-auth",
    },
  ),
);
