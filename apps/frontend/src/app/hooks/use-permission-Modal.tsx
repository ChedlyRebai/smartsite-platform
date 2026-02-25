import { create } from "zustand";

interface addPermissionModalStore {
  id?: string | number;
  type: "add" | "edit";
  setType:(type: "add" | "edit") => void
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onPermissionChange: () => void;
  setOnPermissionChange: (callback: () => void) => void;
}

const useAddPermissionModal = create<addPermissionModalStore>(
  (set, get) => ({
    id: undefined,
    isOpen: false,
    type:"add",
    setType: (type) => set({type}),

    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
    onPermissionChange: () => {},
    setOnPermissionChange: (callback) => set({ onPermissionChange: callback }),
  })
);

export default useAddPermissionModal;