import { Shield, Users as UsersIcon, Lock } from "lucide-react";

import { useState, useEffect } from "react";

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
  deleteRole,
} from "@/app/action/role.action";
import { getAllStatics } from "@/app/action/statiscs.action";
import useRoleModal from "@/app/hooks/use-role-Modal";
import { useQuery } from "@tanstack/react-query";
import Forbidden from "../Error/Forbidden";
import { usePermissionStore } from "@/app/hooks/permission.store";

import { useTranslation } from "@/app/hooks/useTranslation";
import { RolesDataTable } from "../users/_components/roles-data-table";

export default function RolesPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Contournement : si le role est null, utiliser un role par défaut
  const userRole = user?.role || { name: "super_admin" as const };

  const [statics, setStatics] = useState({
    totalRoles: 0,
    totalUsers: 0,
    totalPermissions: 0,
  });

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


 
  const loadStatics = async () => {
    try {
      const response = await getAllStatics();
      if (response?.status === 200) {
        setStatics(response.data);
      }
    } catch (error) {
      console.error("Failed to load statics:", error);
    }
  };

  
 
  const { data: roles, isLoading: isRoleLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => getAllRoles(),
  });
  
  const handleEditRole = (role: Role) => {
    const { setId, setType, onOpen } = useRoleModal.getState();
    setId(role._id);
    setType("edit");
    onOpen();
  };

  const handleDeleteRole = async (roleId: string) => {
    try {
      const response = await deleteRole(roleId);
      if (response?.status === 200) {
        toast.success(
          t("userManagement.toast.roleDeleted", "Role deleted successfully"),
        );
        // loadRoles();
      } else {
        toast.error(
          response?.data ||
            t("userManagement.toast.failedDeleteRole", "Failed to delete role"),
        );
      }
    } catch (error) {
      console.error("Failed to delete role:", error);
      toast.error(
        t("userManagement.toast.failedDeleteRole", "Failed to delete role"),
      );
    }
  };

  const handleAddNewRole = () => {
    toast.success("Add new role");
    // TODO: Implement create dialog
  };

  

  const access = usePermissionStore((s) => s.permissions);
 

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">
          {t("userManagement.title", "User Management")}
        </h1>
        <p className="text-gray-500 mt-1">
          {t(
            "userManagement.subtitle",
            "Manage user roles, permissions, and access control settings to ensure secure access.",
          )}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="h-5 w-5" />
              {t("userManagement.stats.totalUsers", "Total Users")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white">
              {statics.totalUsers || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t("userManagement.stats.usersAssigned", "Users assigned to roles")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("userManagement.stats.totalRoles", "Total Roles")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white">
              {statics.totalRoles || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t("userManagement.stats.activeRoles", "Active roles in the system")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              {t("userManagement.stats.permissions", "Permissions")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900 dark:text-white dark:text-white">
              {statics.totalPermissions || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t(
                "userManagement.stats.totalPermissions",
                "Total permissions available",
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
            <CardTitle>{t("userManagement.rolesSectionTitle", "Roles")}</CardTitle>
            {/* {canManagePermissions && (
                <Button onClick={handleAddNewRole}>
                {t("userManagement.addRole", "Add Role")}
                </Button>
            )} */}
            </CardHeader>
        <CardContent>
            {isRoleLoading ? (
                <div className="text-center py-12">
                  {t("userManagement.loadingRoles", "Loading roles...")}
                </div>
              ) : (
                <RolesDataTable
                  roles={roles}
                  onEdit={handleEditRole}
                  onDelete={handleDeleteRole}
                  onAddNew={handleAddNewRole}
                />
              )}
        </CardContent>
      </Card>
    </div>
  );
}
