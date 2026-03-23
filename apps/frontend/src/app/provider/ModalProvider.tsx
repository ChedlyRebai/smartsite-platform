import React from "react";
import AddPermissionModal from "../components/shared/Modals/AddPermissionModal";
import AddUserModal from "../components/shared/Modals/AddUserModal";
import AddRoleModal from "../components/shared/Modals/AddRoleModal";
import RolePermissionsModal from "../components/shared/Modals/RolePermissionsModal";
import AddTaskModal from "../components/shared/Modals/AddTaskModal";
import TaskDetailModal from "../components/shared/Modals/TaskDetailModal";
import AddMilestoneModal from "../components/shared/Modals/AddMilestoneModal";
import AddTaskStageModal from "../components/shared/Modals/AddTaskStageModal";

const ModalProvider = () => {
  return (
    <>
      <AddPermissionModal />
      <AddRoleModal />
      <AddUserModal />
      <AddTaskModal />
      <RolePermissionsModal />
      <TaskDetailModal/>
      <AddMilestoneModal/>
      <AddTaskStageModal/>
    </>
  );
};

export default ModalProvider;
