import React from "react";
import Modal from "./Modal";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";
import PermissionForms from "../../forms/PermissionForms";
import useMilestoneModal from "@/app/hooks/use-milestone-modal";
import AddMilestoneForms from "../../forms/AddMilestoneForms";

const AddMilestoneModal = () => {
  const { isOpen, onClose, type, setType } = useMilestoneModal();
  return (
    <Modal
      title={type === "add" ? "Add New Milestone" : "Edit Milestone"}
      description={
        type === "add"
          ? "Fill the form to add a new milestone."
          : "Update the milestone information."
      }
      isOpen={isOpen}
      onChange={onClose}
    >
      <AddMilestoneForms type={type} />
    </Modal>
  );
};

export default AddMilestoneModal;
