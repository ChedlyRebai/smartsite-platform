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

import { useNavigate } from "react-router";

import { toast } from "react-hot-toast";

import { Permission, Role, User } from "@/app/types";

import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/app/action/role.action";

import { RolesDataTable } from "./_components/roles-data-table";

import { UserDataTable } from "./_components/data-table";

import { deleteUser, getAllUsers } from "@/app/action/user.action";

import { mockTeamMembers } from "@/app/utils/mockData";

import {
  deletePermission,
  getAllPermissions,
} from "@/app/action/permission.action";
import { PermissionsDataTable } from "./_components/permissions-data-table";

export default function UserManagement() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const canManageRoles = user && canEdit(user.role.name, "users");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const canManagePermissions = user && canEdit(user.role.name, "users");
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    loadRoles();
    loadPermissions();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await getAllUsers();
      if (response.status === 200 && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        // Use mock data for development
        setUsers(mockTeamMembers);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      setUsers(mockTeamMembers);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await deleteUser(userId);
      if (response.status === 200) {
        toast.success("User deleted successfully");
        loadUsers();
      } else {
        toast.error(response.data || "Failed to delete user");
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  

  const loadPermissions = async () => {
    setIsLoading(true);
    try {
      const response = await getAllPermissions();
      if (response.status === 200 && Array.isArray(response.data)) {
        setPermissions(response.data);
      } else {
        toast.error("Failed to load permissions");
      }
    } catch (error) {
      console.error("Failed to load permissions:", error);
      toast.error("Failed to load permissions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPermission = (permission: Permission) => {
    // toast.info(`Edit permission: ${permission.name}`);
    // TODO: Implement edit dialog
  };

  const handleDeletePermission = async (permissionId: string) => {
    try {
      const response = await deletePermission(permissionId);
      if (response.status === 200) {
        toast.success("Permission deleted successfully");
        loadPermissions();
      } else {
        toast.error(response.data || "Failed to delete permission");
      }
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast.error("Failed to delete permission");
    }
  };

  const handleAddNewPermission = () => {
    toast.success ("Add new permission");
    // TODO: Implement create dialog
  };
  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const response = await getAllRoles();
      if (response.status === 200 && Array.isArray(response.data)) {
        setRoles(response.data);
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    toast.success(`Edit role: ${role.name}`);
    // TODO: Implement edit dialog
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await deleteRole(roleId);
      if (response.status === 200) {
        toast.success("Role deleted successfully");
        loadRoles();
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
          Manage user roles, permissions, and access control settings to ensure secure
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Total Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{roles.length}</p>
            <p className="text-sm text-gray-500 mt-2">
              Active roles in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">
              {roles.reduce((acc, role) => acc + (role.userCount || 0), 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Users assigned to roles
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
            <p className="text-4xl font-bold text-gray-900">-</p>
            <p className="text-sm text-gray-500 mt-2">
              Total permissions available
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Tabs defaultValue="role">
          <CardHeader>
            <CardTitle>
              <TabsList>
                <TabsTrigger value="role">All Roles</TabsTrigger>
                <TabsTrigger value="users">All users</TabsTrigger>
                <TabsTrigger value="permissions">All permissions</TabsTrigger>
              </TabsList>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TabsContent value="role">
              {isLoading ? (
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
              {isLoading ? (
                <div className="text-center py-12">Loading users...</div>
              ) : (
                <UserDataTable users={users} />
              )}
            </TabsContent>

            <TabsContent value="permissions">
              {isLoading ? (
                <div className="text-center py-12">Loading permissions...</div>
              ) : (
                <PermissionsDataTable permissions={permissions} />
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
