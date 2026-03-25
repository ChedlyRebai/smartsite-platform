import { create } from "zustand";

type Permission = {
  href: string;
  access: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

type PermissionStore = {
  permissions: Record<string, Permission>;
  setPermissions: (perms: Permission[]) => void;
};

export const usePermissionStore = create<PermissionStore>((set) => ({
  permissions: {},

  setPermissions: (perms) =>
    set({
      permissions: (perms ?? []).reduce((acc, p) => {
        acc[p.href] = p;
        return acc;
      }, {} as Record<string, Permission>),
    }),
}));