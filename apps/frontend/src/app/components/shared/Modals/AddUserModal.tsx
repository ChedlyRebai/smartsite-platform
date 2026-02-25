import React from "react";
import Modal from "./Modal";
import useAddUserModal from "@/app/hooks/use-user-Modal";
import UserForms from "../../forms/UserForms";

const AddUserModal = () => {
  const { isOpen, onClose,setType,type } = useAddUserModal();
  return (
    <Modal
      title={type === "add" ? "Add New User" : "Edit User"}
      description={type === "add" ? "Fill the form to add a new user." : "Update the user information."}
      isOpen={isOpen}
      onChange={onClose}
    >
      <UserForms type={type} />
    </Modal>
  );
};

export default AddUserModal;
