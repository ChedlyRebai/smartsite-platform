import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";
import axios from "axios";

// Mock users database
const mockUsers: User[] = [
  {
    id: "1",
    firstName: "Admin",
    lastName: "Super",
    email: "admin@smartsite.com",
    role: "super_admin",
    isActive: true,
    createdDate: "2026-01-01",
    lastLoginDate: "2026-02-17",
  },
];

const api = axios.create({
  baseURL: "http://localhost:3000",
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
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
        // get user profile
        //const profileRes = await api.get("/auth/profile");
        
        set({
          
          user: res.data,
          isAuthenticated: true,
        });
      },

      register: async (data: RegisterData) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const newUser: User = {
          id: Date.now().toString(),
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone,
          role: data.role,
          isActive: false,
          createdDate: new Date().toISOString(),
        };

        mockUsers.push(newUser);
        // Do not auto-login: new accounts require admin approval
        set({});
      },

      getPendingUsers: async () => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        return mockUsers.filter((u) => !u.isActive);
      },

      approveUser: async (userId: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const idx = mockUsers.findIndex((u) => u.id === userId);
        if (idx === -1) throw new Error("User not found");
        mockUsers[idx].isActive = true;
        return mockUsers[idx];
      },

      rejectUser: async (userId: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500));
        const idx = mockUsers.findIndex((u) => u.id === userId);
        if (idx === -1) throw new Error("User not found");
        // remove the user from the mock DB
        mockUsers.splice(idx, 1);
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "smartsite-auth",
    },
  ),
);
