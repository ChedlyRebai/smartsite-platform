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
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Role } from "@/app/types";

import {
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
} from "@/app/action/role.action";
import { RolesDataTable } from "./_components/roles-data-table";

export default function RolesPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const canManageRoles = user && canEdit(user.role, "users");
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    setIsLoading(true);
    try {
      const response = await getAllRoles();
      if (response.status === 200 && Array.isArray(response.data)) {
        setRoles(response.data);
      } else {
        // Mock data for development - matches Mongoose schema
        setRoles([
          {
            _id: "65a1b2c3d4e5f6g7h8i9j0k1",
            name: "Super Administrator",
            permissions: [], // Will be populated with Permission ObjectIds
            userCount: 1,
            createdAt: new Date("2026-01-01T00:00:00Z"),
            updatedAt: new Date("2026-01-01T00:00:00Z"),
          },
          {
            _id: "65a1b2c3d4e5f6g7h8i9j0k2",
            name: "Director",
            permissions: [],
            userCount: 2,
            createdAt: new Date("2026-01-01T00:00:00Z"),
            updatedAt: new Date("2026-01-05T00:00:00Z"),
          },
          {
            _id: "65a1b2c3d4e5f6g7h8i9j0k3",
            name: "Project Manager",
            permissions: [],
            userCount: 5,
            createdAt: new Date("2026-01-05T00:00:00Z"),
            updatedAt: new Date("2026-01-10T00:00:00Z"),
          },
          {
            _id: "65a1b2c3d4e5f6g7h8i9j0k4",
            name: "Site Manager",
            permissions: [],
            userCount: 4,
            createdAt: new Date("2026-01-08T00:00:00Z"),
            updatedAt: new Date("2026-01-15T00:00:00Z"),
          },
          {
            _id: "65a1b2c3d4e5f6g7h8i9j0k5",
            name: "QHSE Manager",
            permissions: [],
            userCount: 2,
            createdAt: new Date("2026-01-10T00:00:00Z"),
            updatedAt: new Date("2026-01-12T00:00:00Z"),
          },
          {
            _id: "65a1b2c3d4e5f6g7h8i9j0k6",
            name: "Accountant",
            permissions: [],
            userCount: 2,
            createdAt: new Date("2026-01-12T00:00:00Z"),
            updatedAt: new Date("2026-01-18T00:00:00Z"),
          },
        ]);
      }
    } catch (error) {
      console.error("Failed to load roles:", error);
      toast.error("Failed to load roles");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditRole = (role: Role) => {
    toast.info(`Edit role: ${role.name}`);
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
    toast.info("Add new role");
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
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-500 mt-1">
          Manage system roles and their permissions
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
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
}
