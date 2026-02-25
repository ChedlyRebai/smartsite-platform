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
      isAuthenticated: true,

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
        // Clear authorization header
        delete api.defaults.headers.common["Authorization"];
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "smartsite-auth",
    },
  ),
);
