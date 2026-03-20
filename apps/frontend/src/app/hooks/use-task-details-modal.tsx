import { create } from "zustand";
import { Task } from "../types";

interface TaskModalStore {
  id?: string | number;
  task: Task;
  setTask:(task:Task) => void;
  setId: (id: string | number) => void;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onTaskChange: () => void;
  setOnTaskChange: (callback: () => void) => void;
}

const useTaskDetailsModal = create<TaskModalStore>((set) => ({
  id: undefined,
  task: undefined,
  setTask: (task) => set({ task }),
  isOpen: false,
  setId: (id) => set({ id }),
  onOpen: () => set({ isOpen: true }),
  onClose: () => set({ isOpen: false }),
  onTaskChange: () => {},
  setOnTaskChange: (callback) => set({ onTaskChange: callback }),
}));

export default useTaskDetailsModal;
