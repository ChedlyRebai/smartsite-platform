import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, User, RegisterData } from '../types';

// Mock users database
const mockUsers: User[] = [
  {
    id: '1',
    firstName: 'Admin',
    lastName: 'Super',
    email: 'admin@smartsite.com',
    role: 'super_admin',
    isActive: true,
    createdDate: '2026-01-01',
    lastLoginDate: '2026-02-17',
  },
  {
    id: '2',
    firstName: 'John',
    lastName: 'Director',
    email: 'director@smartsite.com',
    role: 'director',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '3',
    firstName: 'Sarah',
    lastName: 'Manager',
    email: 'pm@smartsite.com',
    role: 'project_manager',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '4',
    firstName: 'Mike',
    lastName: 'Site',
    email: 'site@smartsite.com',
    role: 'site_manager',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '5',
    firstName: 'Emma',
    lastName: 'Works',
    email: 'works@smartsite.com',
    role: 'works_manager',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '6',
    firstName: 'David',
    lastName: 'Finance',
    email: 'accountant@smartsite.com',
    role: 'accountant',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '7',
    firstName: 'Lisa',
    lastName: 'Procurement',
    email: 'procurement@smartsite.com',
    role: 'procurement_manager',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '8',
    firstName: 'Tom',
    lastName: 'Safety',
    email: 'qhse@smartsite.com',
    role: 'qhse_manager',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '9',
    firstName: 'Client',
    lastName: 'Owner',
    email: 'client@smartsite.com',
    role: 'client',
    isActive: true,
    createdDate: '2026-01-01',
  },
  {
    id: '10',
    firstName: 'Sub',
    lastName: 'Contractor',
    email: 'subcontractor@smartsite.com',
    role: 'subcontractor',
    isActive: true,
    createdDate: '2026-01-01',
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

        if (!user || password !== 'password123') {
          throw new Error('Invalid credentials');
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
          isActive: true,
          createdDate: new Date().toISOString(),
        };

        mockUsers.push(newUser);
        set({ user: newUser, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'smartsite-auth',
    }
  )
);
