import { User as UserIcon, Mail, Phone, Calendar, Shield } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { useAuthStore } from '../../store/authStore';
import { roleLabels } from '../../utils/roleConfig';
import { toast } from 'sonner';

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const [editData, setEditData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleSaveProfile = () => {
    if (!editData.firstName || !editData.lastName) {
      toast.error('First and last names are required');
      return;
    }
    toast.success('Profile updated successfully!');
  };

  const handleChangePassword = () => {
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      toast.error('All password fields are required');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    toast.success('Password changed successfully!');
    setPasswords({ current: '', new: '', confirm: '' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1">Manage your personal information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-6">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-green-600 text-white text-2xl">
                {getInitials(user.firstName, user.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-500">{roleLabels[user.role]}</p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 text-gray-600">
                  <Mail className="h-5 w-5" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-gray-600">
                    <Phone className="h-5 w-5" />
                    <span>{user.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-600">
                  <Calendar className="h-5 w-5" />
                  <span>Joined {new Date(user.createdDate).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Shield className="h-5 w-5" />
                  <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700">
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your personal information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName"
                            value={editData.firstName}
                            onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                            placeholder="First name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName"
                            value={editData.lastName}
                            onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                            placeholder="Last name"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editData.phone}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          placeholder="Phone number"
                        />
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        onClick={handleSaveProfile}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">Change Password</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and new password
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current">Current Password</Label>
                        <Input
                          id="current"
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                          placeholder="Enter current password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new">New Password</Label>
                        <Input
                          id="new"
                          type="password"
                          value={passwords.new}
                          onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                          placeholder="Enter new password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm">Confirm Password</Label>
                        <Input
                          id="confirm"
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                          placeholder="Confirm new password"
                        />
                      </div>
                      <Button 
                        className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                        onClick={handleChangePassword}
                      >
                        Update Password
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-gray-600">Last Login</span>
              <span className="font-semibold text-gray-900">
                {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleString() : 'Never'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-gray-600">Account Status</span>
              <Badge variant={user.isActive ? 'secondary' : 'destructive'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-gray-600">Role</span>
              <Badge variant="outline">{roleLabels[user.role]}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
