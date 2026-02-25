import { create } from "zustand";

interface RolePermissionsModalStore {
  roleId?: string;
  roleName?: string;
  setRoleId: (id: string) => void;
  setRoleName: (name: string) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPermissionsChange: () => void;
  setOnPermissionsChange: (callback: () => void) => void;
  refreshData: () => void;
  setRefreshData: (callback: () => void) => void;
}

const useRolePermissionsModal = create<RolePermissionsModalStore>(
  (set) => ({
    roleId: undefined,
    roleName: undefined,
    isOpen: false,
    setRoleId: (id) => set({ roleId: id }),
    setRoleName: (name) => set({ roleName: name }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
    onPermissionsChange: () => {},
    setOnPermissionsChange: (callback) => set({ onPermissionsChange: callback }),
    refreshData: () => {},
    setRefreshData: (callback) => set({ refreshData: callback }),
  })
);

export default useRolePermissionsModal;
