import { create } from "zustand";

interface addUserModalStore {
  id?: string | number;
  type: "add" | "edit";
  setType:(type: "add" | "edit") => void
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}

const useAddUserModal = create<addUserModalStore>(
  (set) => ({
    id: undefined,
    type:undefined,
    setType: (type) => set({type}),

    isOpen: false,
    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
  })
);

export default useAddUserModal;