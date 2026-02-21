import { create } from "zustand";

interface addPermissionModalStore {
  id?: string | number;
   type: "add" | "edit";
  setType:(type: "add" | "edit") => void
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useAddPermissionModal = create<addPermissionModalStore>(
  (set) => ({
    id: undefined,
    isOpen: false,
    type:undefined,
    setType: (type) => set({type}),

    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);

export default useAddPermissionModal;