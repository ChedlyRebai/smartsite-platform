import { Settings, Users, Shield } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { canEdit } from '../../utils/permissions';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export default function UsersPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const canManageUsers = user && canEdit(user.role, 'users');

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

  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  const roles = [
    { role: 'Super Administrator', users: 1, permissions: 'Full Access' },
    { role: 'Director / Business Manager', users: 2, permissions: 'Strategic Access' },
    { role: 'Project Manager', users: 5, permissions: 'Project Management' },
    { role: 'Site Manager', users: 4, permissions: 'Site Operations' },
    { role: 'QHSE Manager', users: 2, permissions: 'Safety & Compliance' },
    { role: 'Accountant', users: 2, permissions: 'Financial Access' },
  ];

  const handleManageRole = (roleName: string) => {
    setSelectedRole(roleName);
    toast.success(`Managing ${roleName}`);
  };
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
            <p className="text-4xl font-bold text-gray-900">24</p>
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
          <CardTitle>System Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {roles.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <h3 className="font-semibold text-gray-900">{item.role}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.permissions}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">{item.users} users</Badge>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline" onClick={() => handleManageRole(item.role)}>Manage</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Manage {item.role}</DialogTitle>
                        <DialogDescription>
                          Configure permissions and settings for this role
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">Role Details</h4>
                          <div className="space-y-2 text-sm text-gray-600">
                            <p><strong>Role Name:</strong> {item.role}</p>
                            <p><strong>Users:</strong> {item.users}</p>
                            <p><strong>Permissions:</strong> {item.permissions}</p>
                          </div>
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                          onClick={() => toast.success(`${item.role} settings updated successfully!`)}
                        >
                          Save Changes
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
