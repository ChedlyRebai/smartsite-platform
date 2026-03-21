import { create } from "zustand";

interface MilestoneModalStore {
  id?: string | number;
  setId: (id: string | number) => void;
  projectId:string;
  setProjectId:(id:string) => void;
  type: "add" | "edit";
  setType: (type: "add" | "edit") => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRoleChange: () => void;
  setOnRoleChange: (callback: () => void) => void;
}

const useMilestoneModal = create<MilestoneModalStore>((set) => ({
  id: undefined,
  projectId:undefined,
  type: "add",
  setProjectId:(id)=> set({projectId:id}),
  setType: (type) => set({ type }),
  isOpen: false,
  setId: (id) => set({ id }),
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  onRoleChange: () => {},
  setOnRoleChange: (callback) => set({ onRoleChange: callback }),
}));

export default useMilestoneModal;
