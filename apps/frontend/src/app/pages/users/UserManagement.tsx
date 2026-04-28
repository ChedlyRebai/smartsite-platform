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

import { getAllRoles, deleteRole } from "@/app/action/role.action";

import { RolesDataTable } from "./_components/roles-data-table";
import { UserDataTable } from "./_components/user-data-table";
import { banUser, deleteUser, getAllUsers } from "@/app/action/user.action";
import {
  deletePermission,
  getAllPermissions,
} from "@/app/action/permission.action";
import { PermissionsDataTable } from "./_components/permissions-data-table";
import { getAllStatics } from "@/app/action/statiscs.action";
import useAddPermissionModal from "@/app/hooks/use-permission-Modal";
import useRoleModal from "@/app/hooks/use-role-Modal";
import { useQuery } from "@tanstack/react-query";
import Forbidden from "../Error/Forbidden";
import { usePermissionStore } from "@/app/hooks/permission.store";
import useAddUserModal from "@/app/hooks/use-user-Modal";
import useRolePermissionsModal from "@/app/hooks/use-role-permissions-modal";

import { useTranslation } from "@/app/hooks/useTranslation";

export default function UserManagement() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const { t } = useTranslation();
  // Contournement : si le role est null, utiliser un role par défaut
  const userRole = user?.role || { name: "super_admin" as const };

 
  const canManagePermissions = user && canEdit(userRole.name, "users");


  const {data:staticsData, isError: isStaticsError} = useQuery({
    queryKey: ["statics"],
    queryFn: () => getAllStatics(),
    staleTime: Infinity,
  });
  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await getAllUsers();
      if (res.status !== 200 || !Array.isArray(res.data)) {
        throw new Error("Failed to load users");
      }
      return res.data;
    },
  });

  const handleDeleteUser = async (userId: string) => {
    try {
      const response = await deleteUser(userId);
      if (response?.status === 200) {
        toast.success(
          t("userManagement.toast.userDeleted", "User deleted successfully"),
        );
        //loadUsers();
      } else {
        toast.error(
          response?.data ||
            t("userManagement.toast.failedDeleteUser", "Failed to delete user"),
        );
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error(
        t("userManagement.toast.failedDeleteUser", "Failed to delete user"),
      );
    }
  };
  
  const handleBanUser = async (userId: string, isActif: boolean) => {
    try {
      const response = await banUser(userId, isActif);
      if (response?.status === 200) {
        toast.success(
          isActif
            ? t(
                "userManagement.toast.userUnbanned",
                "User unbanned successfully",
              )
            : t("userManagement.toast.userBanned", "User banned successfully"),
        );
        // loadUsers();
      } else {
        toast.error(
          response?.data ||
            t(
              "userManagement.toast.failedUpdateUserStatus",
              "Failed to update user status",
            ),
        );
      }
    } catch (error) {
      console.error("Failed to update user status:", error);
      toast.error(
        t(
          "userManagement.toast.failedUpdateUserStatus",
          "Failed to update user status",
        ),
      );
    }
  };
  
  const access = usePermissionStore((s) => s.permissions);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900  dark:text-white">
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
            <p className="text-4xl font-bold text-gray-900  dark:text-white">
              {staticsData?.data.totalUsers || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t(
                "userManagement.stats.usersAssigned",
                "Users assigned to roles",
              )}
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
            <p className="text-4xl font-bold text-gray-900  dark:text-white">
              {staticsData?.data.totalRoles || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {t(
                "userManagement.stats.activeRoles",
                "Active roles in the system",
              )}
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
              {staticsData?.data.totalPermissions || 0}
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
            <UsersIcon className="h-5 w-5" />
            {t("userManagement.users", "Users")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isUsersLoading ? (
            <div className="text-center py-12">
              {t("userManagement.loadingUsers", "Loading users...")}
            </div>
          ) : (
            <UserDataTable
              onBan={handleBanUser}
              users={users as User[]}
              onDelete={handleDeleteUser}
            />
          )}
          
        </CardContent>
      </Card>
    </div>
  );
}
