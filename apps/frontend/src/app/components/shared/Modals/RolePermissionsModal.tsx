import React from "react";
import Modal from "./Modal";
import useRolePermissionsModal from "@/app/hooks/use-role-permissions-modal";
import RolePermissionsForm from "../../forms/RolePermissionsForm";

const RolePermissionsModal = () => {
  const { isOpen, onClose, roleName } = useRolePermissionsModal();
  
  return (
    <Modal
      title={`Manage Permissions - ${roleName || "Role"}`}
      description="Assign or remove permissions for this role"
      isOpen={isOpen}
      onChange={onClose}
    >
      <RolePermissionsForm />
    </Modal>
  );
};

export default RolePermissionsModal;
