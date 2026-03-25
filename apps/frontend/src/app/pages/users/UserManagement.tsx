import { Shield, Users as UsersIcon, Lock } from "lucide-react";

import { useState, useEffect } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { data, useNavigate } from "react-router";
import { toast } from "react-hot-toast";

import { Permission, Role, User } from "@/app/types";

import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/app/action/role.action";

import { RolesDataTable } from "./_components/roles-data-table";
import { UserDataTable } from "./_components/user-data-table";
import { banUser, deleteUser, getAllUsers } from "@/app/action/user.action";
import {
  accessPermissionByurl,
  deletePermission,
  getAllPermissions,
} from "@/app/action/permission.action";
import { PermissionsDataTable } from "./_components/permissions-data-table";
import { getAllStatics } from "@/app/action/statiscs.action";
import useAddUserModal from "@/app/hooks/use-user-Modal";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";
import useRoleModal from "@/app/hooks/use-role-Modal";
import useRolePermissionsModal from "@/app/hooks/use-role-permissions-modal";
import { useQuery } from "@tanstack/react-query";
import Forbidden from "../Error/Forbidden";
import { usePermissionStore } from "@/app/hooks/permission.store";

export default function UserManagement() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const canManageRoles = user && canEdit(user.role.name, "users");
  const [statics, setStatics] = useState({
    totalRoles: 0,
    totalUsers: 0,
    totalPermissions: 0,
  });
  //const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStatics();
  }, []);

  const { data, isError, error } = useQuery({
    queryKey: ["statics"],
    queryFn: () => getAllStatics(),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data) {
      setStatics(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (isError) {
      toast.error("Failed to load statics");
    }
  }, [isError, error]);

  const loadStatics = async () => {
    try {
      const response = await getAllStatics();
      if (response.status === 200) {
        setStatics(response.data);
      }
    } catch (error) {
      console.error("Failed to load statics:", error);
    }
  };
  const { data: users, isLoading:isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: () => getAllUsers(),
  });

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await deleteUser(userId);
      if (response.status === 200) {
        toast.success("User deleted successfully");
        //loadUsers();
      } else {
        toast.error(response.data || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  const { data: permissionsList , isLoading: isPermissionLoading } = useQuery({
    queryKey: ["permissions"],
    queryFn: getAllPermissions,
    staleTime: Infinity,
  });

  const handleEditPermission = (permission: Permission) => {
    const { setId, setType, onOpen } = useAddPermissionModal.getState();
    setId(permission._id);
    setType("edit");
    onOpen();
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await deletePermission(permissionId);
      if (response.status === 200) {
        toast.success("Permission deleted successfully");
        // loadPermissions();
      } else {
        toast.error(response.data || "Failed to delete permission");
      }
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast.error("Failed to delete permission");
    }
  };

  const handleAddNewPermission = () => {
    toast.success("Add new permission");
    // TODO: Implement create dialog
  };
  // const loadRoles = async () => {
  //   setIsLoading(true);
  //   try {
  //     const response = await getAllRoles();
  //     if (response.status === 200 && Array.isArray(response.data)) {
  //       setRoles(response.data);
  //     }
  //   } catch (error) {
  //     console.error("Failed to load roles:", error);
  //     toast.error("Failed to load roles");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const { data: roles,isLoading:isRoleLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getAllRoles(),
  });
  const handleBanUser = async (userId: string, isActif: boolean) => {
    try {
      const response = await banUser(userId, isActif);
      if (response.status === 200) {
        toast.success(
          isActif ? "User unbanned successfully" : "User banned successfully",
        );
        // loadUsers();
      } else {
        toast.error(response.data || "Failed to update user status");
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error("Failed to update user status");
    }
  };
  const handleEditRole = (role: Role) => {
    const { setId, setType, onOpen } = useRoleModal.getState();
    setId(role._id);
    setType("edit");
    onOpen();
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await deleteRole(roleId);
      if (response.status === 200) {
        toast.success("Role deleted successfully");
        // loadRoles();
      } else {
        toast.error(response.data || "Failed to delete role");
      }
    } catch (error) {
      console.error("Failed to delete role:", error);
      toast.error("Failed to delete role");
    }
  };

  const handleAddNewRole = () => {
    toast.success("Add new role");
    // TODO: Implement create dialog
  };

  // const { data: accessData, isLoading: isAccessLoading } = useQuery({
  //   queryKey: ["access", "users"],
  //   queryFn: () => accessPermissionByurl("users"),

  // });

  // console.log("Access permissions for /dashboard/users:", accessData);
  // if (accessData && !isAccessLoading) {
  //   if (!accessData.access) {
  //     return (
  //       <Forbidden/>
  //     );
  //   }
  // }

  const access = usePermissionStore((s) => s.permissions);
  console.log("Access permissions for /dashboard/users:", access["users"]);
  if (!access["users"]?.access) {
    return <Forbidden />;
  }
  if (!canManageRoles) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Role Management
            </h1>
            <p className="text-gray-500 mt-1">
              This page is restricted to system administrators
            </p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Access Denied
              </h3>
              <p className="text-gray-600 mb-6">
                Only Super Administrators can access role management.
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-green-600"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500 mt-1">
          Manage user roles, permissions, and access control settings to ensure
          secure
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">
              {statics.totalUsers}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Users assigned to roles
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Total Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">
              {statics.totalRoles}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Active roles in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">
              {statics.totalPermissions}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Total permissions available
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="users">
          <CardHeader>
            <CardTitle>
              <TabsList>
                <TabsTrigger value="users">users</TabsTrigger>
                <TabsTrigger value="role">Roles</TabsTrigger>

                <TabsTrigger value="permissions">permissions</TabsTrigger>
              </TabsList>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="role">
              {isRoleLoading ? (
                <div className="text-center py-12">Loading roles...</div>
              ) : (
                <RolesDataTable
                  roles={roles}
                  onEdit={handleEditRole}
                  onDelete={handleDeleteRole}
                  onAddNew={handleAddNewRole}
                />
              )}
            </TabsContent>

            <TabsContent value="users">
              {isUsersLoading ? (
                <div className="text-center py-12">Loading users...</div>
              ) : (
                <UserDataTable
                  onBan={handleBanUser}
                  users={users}
                  onDelete={handleDeleteUser}
                />
              )}
            </TabsContent>

            <TabsContent value="permissions">
              {isPermissionLoading ? (
                <div className="text-center py-12">Loading permissions...</div>
              ) : (
                <PermissionsDataTable
                  permissions={permissionsList}
                  onEdit={handleEditPermission}
                  onDelete={handleDeletePermission}
                />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
