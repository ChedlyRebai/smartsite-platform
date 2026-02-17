import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User, RegisterData } from "../types";

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
  {
    id: "2",
    firstName: "John",
    lastName: "Director",
    email: "director@smartsite.com",
    role: "director",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "3",
    firstName: "Sarah",
    lastName: "Manager",
    email: "pm@smartsite.com",
    role: "project_manager",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "4",
    firstName: "Mike",
    lastName: "Site",
    email: "site@smartsite.com",
    role: "site_manager",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "5",
    firstName: "Emma",
    lastName: "Works",
    email: "works@smartsite.com",
    role: "works_manager",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "6",
    firstName: "David",
    lastName: "Finance",
    email: "accountant@smartsite.com",
    role: "accountant",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "7",
    firstName: "Lisa",
    lastName: "Procurement",
    email: "procurement@smartsite.com",
    role: "procurement_manager",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "8",
    firstName: "Tom",
    lastName: "Safety",
    email: "qhse@smartsite.com",
    role: "qhse_manager",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "9",
    firstName: "Client",
    lastName: "Owner",
    email: "client@smartsite.com",
    role: "client",
    isActive: true,
    createdDate: "2026-01-01",
  },
  {
    id: "10",
    firstName: "Sub",
    lastName: "Contractor",
    email: "subcontractor@smartsite.com",
    role: "subcontractor",
    isActive: true,
    createdDate: "2026-01-01",
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Mock authentication - in production, this would be a real API call
        const user = mockUsers.find((u) => u.email === email);

        if (!user || password !== "password123") {
          throw new Error("Invalid credentials");
        }

        if (!user.isActive) {
          throw new Error("Account is not active. Waiting for admin approval.");
        }

        set({ user, isAuthenticated: true });
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
