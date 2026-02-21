import React from "react";
import Modal from "./Modal";
import useAddUserModal from "@/app/hooks/use-user-Modal";
import UserForms from "../../forms/UserForms";

const AddUserModal = () => {
  const { isOpen, onClose } = useAddUserModal();
  return (
    <Modal
      title="Add User"
      description="Fill in the details to create a new user account"
      isOpen={isOpen}
      onChange={onClose}
      
    >
      <UserForms  />
    </Modal>
  );
};

export default AddUserModal;
