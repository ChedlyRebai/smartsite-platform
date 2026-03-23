
import React from "react";
import Modal from "./Modal";
import useAddUserModal from "@/app/hooks/use-user-Modal";
import UserForms from "../../forms/UserForms";
import useTaskStageModal from "@/app/hooks/use-task-stage-modal";
import TaskStageForm from "../../forms/TaskStageForm";

const AddTaskStageModal = () => {
  const { isOpen, onClose,setType,type } = useTaskStageModal();
  return (
    <Modal
      title={type === "add" ? "Add New Task Stage" : "Edit Task Stage"}
      description={type === "add" ? "Fill the form to add a new task stage." : "Update the task stage information."}
      isOpen={isOpen}
      onChange={onClose}
    >
      <TaskStageForm type={type} />
    </Modal>
  );
};

export default AddTaskStageModal;
