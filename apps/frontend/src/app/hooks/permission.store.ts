
import { create } from "zustand";

type Permission = {
  href: string;
  access: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

type Store = {
  permissions: Record<string, Permission>;

  setPermissions: (data: Permission[]) => void;

  canAccess: (route: string) => boolean;
  canCreate: (route: string) => boolean;
  canUpdate: (route: string) => boolean;
  canDelete: (route: string) => boolean;
};

const normalize = (route: string) => {
  const parts = route.split("/").filter(Boolean);
  return parts.length ? `/${parts[0]}` : "/";
};

export const usePermissionStore = create<Store>((set, get) => ({
  permissions: {},

  setPermissions: (data) => {
    const map: Record<string, Permission> = {};
    data.forEach((p) => {
      map[p.href] = p;
    });
    set({ permissions: map });
  },

  canAccess: (route) => {
    const base = normalize(route);
    return get().permissions[base]?.access === true;
  },

  canCreate: (route) => {
    const base = normalize(route);
    return get().permissions[base]?.create === true;
  },

  canUpdate: (route) => {
    const base = normalize(route);
    return get().permissions[base]?.update === true;
  },

  canDelete: (route) => {
    const base = normalize(route);
    return get().permissions[base]?.delete === true;
  },
}));