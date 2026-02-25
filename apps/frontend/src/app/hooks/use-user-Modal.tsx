import { create } from "zustand";

interface addUserModalStore {
  id?: string | number;
  type: "add" | "edit";
  setType:(type: "add" | "edit") => void
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onUserChange: () => void;
  setOnUserChange: (callback: () => void) => void;
}

const useAddUserModal = create<addUserModalStore>(
  (set, get) => ({
    id: undefined,
    type:"add",
    setType: (type) => set({type}),

    isOpen: false,
    setId: (id) => set({ id }),
    onOpen: () => set({ isOpen: true }),
    onClose: () => set({ isOpen: false }),
    onUserChange: () => {},
    setOnUserChange: (callback) => set({ onUserChange: callback }),
  })
);

export default useAddUserModal;