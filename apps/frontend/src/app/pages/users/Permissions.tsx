import { Shield, Lock, Key, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { useAuthStore } from "../../store/authStore";
import { canEdit } from "../../utils/permissions";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Permission } from "@/app/types";
import { PermissionsDataTable } from "./_components/permissions-data-table";
import {
  getAllPermissions,
  createPermission,
  updatePermission,
  deletePermission,
} from "@/app/action/permission.action";

export default function PermissionsPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
<<<<<<< HEAD
  const canManagePermissions = user && canEdit(user.role, "users");
=======
  const canManagePermissions = user && canEdit(user.role.name, "users");
>>>>>>> origin/main
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

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
    toast.info(`Edit permission: ${permission.name}`);
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
    toast.info("Add new permission");
    // TODO: Implement create dialog
  };

  if (!canManagePermissions) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
            <p className="text-gray-500 mt-1">This page is restricted to system administrators</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-6">
                Only Super Administrators can access permission management.
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

  // Group permissions by resource
  

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Permission Management</h1>
        <p className="text-gray-500 mt-1">Manage system permissions and access controls</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Total Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{permissions.length}</p>
            <p className="text-sm text-gray-500 mt-2">Defined permissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* <p className="text-4xl font-bold text-gray-900">
              {Object.keys(permissionsByResource).length}
            </p> */}
            <p className="text-sm text-gray-500 mt-2">Protected resources</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">
              {/* {[...new Set(permissions.map((p) => p.action))].length} */}
            </p>
            <p className="text-sm text-gray-500 mt-2">Unique actions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles Using
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">-</p>
            <p className="text-sm text-gray-500 mt-2">Roles with permissions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Permissions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Loading permissions...</div>
          ) : (
            <PermissionsDataTable
              permissions={permissions}
              onEdit={handleEditPermission}
              onDelete={handleDeletePermission}
              onAddNew={handleAddNewPermission}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
