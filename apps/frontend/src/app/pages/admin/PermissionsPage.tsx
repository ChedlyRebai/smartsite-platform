import { Shield, Users as UsersIcon, Lock } from "lucide-react";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { useAuthStore } from "../../store/authStore";
import { data, useNavigate } from "react-router";
import { toast } from "react-hot-toast";
import { Permission, Role, User } from "@/app/types";


import {
  deletePermission,
  getAllPermissions,
} from "@/app/action/permission.action";
import { getAllStatics } from "@/app/action/statiscs.action";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";
import { useQuery } from "@tanstack/react-query";
import { usePermissionStore } from "@/app/hooks/permission.store";

import { useTranslation } from "@/app/hooks/useTranslation";
import { PermissionsDataTable } from "../users/_components/permissions-data-table";

export default function PermissionsPage() {
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
 

  const { data: permissionsList, isLoading: isPermissionLoading } = useQuery({
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
      if (response?.status === 200) {
        toast.success(
          t(
            "userManagement.toast.permissionDeleted",
            "Permission deleted successfully",
          ),
        );
        // loadPermissions();
      } else {
        toast.error(
          response?.data ||
            t(
              "userManagement.toast.failedDeletePermission",
              "Failed to delete permission",
            ),
        );
      }
    } catch (error) {
      console.error("Failed to delete permission:", error);
      toast.error(
        t(
          "userManagement.toast.failedDeletePermission",
          "Failed to delete permission",
        ),
      );
    }
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
            <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                {t("userManagement.permissions", "Permissions")}
            </CardTitle>
            {/* {canManagePermissions && (
                <Button onClick={handleAddNewPermission}>
                {t("userManagement.addPermission", "Add Permission")}
                </Button>
            )} */}
            </CardHeader>
        <CardContent>

         {isPermissionLoading ? (
                <div className="text-center py-12">
                  {t(
                    "userManagement.loadingPermissions",
                    "Loading permissions...",
                  )}
                </div>
              ) : (
                <PermissionsDataTable
                  permissions={permissionsList}
                  onEdit={handleEditPermission}
                  onDelete={handleDeletePermission}
                />
              )}
              </CardContent>
      </Card>
    </div>
  );
}
