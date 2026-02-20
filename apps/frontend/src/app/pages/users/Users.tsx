import { Settings, Users, Shield } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { mockTeamMembers } from '@/app/utils/mockData';
import { UserDataTable } from './_components/data-table';
import { User } from '@/app/types';
import { getAllUsers, deleteUser } from '@/app/action/user.action';

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const canManageUsers = user && canEdit(user.role.name, 'users');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  if (!canManageUsers) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-500 mt-1">This page is restricted to system administrators</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Shield className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
              <p className="text-gray-600 mb-6">Only Super Administrators can access user management.</p>
              <Button onClick={() => navigate('/dashboard')} className="bg-gradient-to-r from-blue-600 to-green-600">
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
        <p className="text-gray-500 mt-1">Manage system users and permissions</p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">{users.length}</p>
            <p className="text-sm text-gray-500 mt-2">Active users in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">11</p>
            <p className="text-sm text-gray-500 mt-2">Different user roles</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Permissions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-900">45</p>
            <p className="text-sm text-gray-500 mt-2">Total system permissions</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">Loading users...</div>
          ) : (
            <UserDataTable users={users} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
