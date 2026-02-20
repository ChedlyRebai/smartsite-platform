import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";

<<<<<<< HEAD
const API_URL = "http://localhost:3000";
=======


const api = axios.create({
  baseURL: "http://localhost:3000",
});
>>>>>>> origin/main

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
<<<<<<< HEAD
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
=======
      isAuthenticated: true,

      login: async (cin: string, password: string) => {
        const res = await api.post("/auth/login", {
          cin,
          password,
        });

        const token = res.data.access_token;
        const userWIthToken= res.data
        // attach token globally
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log('mmmmmmmmmmmmmmmmmmmmm',userWIthToken);

        set({
          user: res.data,
          isAuthenticated: true,
        });
      },

      register: async (data: RegisterData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newUser: User = {
          _id: Date.now().toString(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          isActive: false,
          createdDate: new Date().toISOString(),
        };

        
        // Do not auto-login: new accounts require admin approval
        set({});
      },

      // getPendingUsers: async () => {
      //   await new Promise((resolve) => setTimeout(resolve, 500));
      //   return mockUsers.filter((u) => !u.isActive);
      // },

      // approveUser: async (userId: string) => {
      //   await new Promise((resolve) => setTimeout(resolve, 500));
      //   const idx = mockUsers.findIndex((u) => u.id === userId);
      //   if (idx === -1) throw new Error("User not found");
      //   mockUsers[idx].isActive = true;
      //   return mockUsers[idx];
      // },

      // rejectUser: async (userId: string) => {
      //   await new Promise((resolve) => setTimeout(resolve, 500));
      //   const idx = mockUsers.findIndex((u) => u.id === userId);
      //   if (idx === -1) throw new Error("User not found");
      //   // remove the user from the mock DB
      //   mockUsers.splice(idx, 1);
      // },

      logout: () => {
>>>>>>> origin/main
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "smartsite-auth",
    },
  ),
);
