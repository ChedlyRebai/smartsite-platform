import React from "react";
import Modal from "./Modal";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";
import PermissionForms from "../../forms/PermissionForms";

const AddPermissionModal = () => {
  const { isOpen, onClose, type, setType } = useAddPermissionModal();
  return (
    <Modal
      title={type === "add" ? "Add New Permission" : "Edit Permission"}
      description={
        type === "add"
          ? "Fill the form to add a new permission."
          : "Update the permission information."
      }
      isOpen={isOpen}
      onChange={onClose}
    >
      <PermissionForms type ={type} />
    </Modal>
  );
};

export default AddPermissionModal;
