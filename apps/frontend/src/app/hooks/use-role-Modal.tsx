import { create } from "zustand";

interface RoleModalStore {
  id?: string | number;
  setId: (id: string | number) => void;
  type: "add" | "edit";
  setType:(type: "add" | "edit") => void
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
   onRoleChange: () => void;
  setOnRoleChange: (callback: () => void) => void;
}

const useRoleModal = create<RoleModalStore>(
  (set) => ({
    id: undefined,
    type:"add",
    setType: (type) => set({type}),

    isOpen: false,
    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
        onRoleChange: () => {},
    setOnRoleChange: (callback) => set({ onRoleChange: callback }),
  })
);

export default useRoleModal;