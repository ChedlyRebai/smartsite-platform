import React from "react";
import AddPermissionModal from "../components/shared/Modals/AddPermissionModal";
import AddUserModal from "../components/shared/Modals/AddUserModal";
import AddRoleModal from "../components/shared/Modals/AddRoleModal";

const ModalProvider = () => {
  return (
    <>
      <AddPermissionModal />
      <AddRoleModal />
      <AddUserModal />
    </>
  );
};

export default ModalProvider;
