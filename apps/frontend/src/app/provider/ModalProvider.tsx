import React from "react";
import AddPermissionModal from "../components/shared/Modals/AddPermissionModal";
import AddUserModal from "../components/shared/Modals/AddUserModal";
import AddRoleModal from "../components/shared/Modals/AddRoleModal";
import RolePermissionsModal from "../components/shared/Modals/RolePermissionsModal";

const ModalProvider = () => {
  return (
    <>
      <AddPermissionModal />
      <AddRoleModal />
      <AddUserModal />
      <RolePermissionsModal />
    </>
  );
};

export default ModalProvider;
