import React from "react";
import Modal from "./Modal";
import useRoleModal from "@/app/hooks/use-role-Modal";
import RoleForms from "../../forms/RoleForms";

const AddRoleModal = () => {
  const { isOpen, onClose,setType,type } = useRoleModal();
  return (
    <Modal
      title={type === "add" ? "Add New Role" : "Edit Role"}
      description={type === "add" ? "Fill in the details to create a new role" : "Update the role information"}
      isOpen={isOpen}
      onChange={onClose}
    >
      <RoleForms type={type} />
    </Modal>
  );
};

export default AddRoleModal;
