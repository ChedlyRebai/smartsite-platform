import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Building2, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from 'sonner';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-green-50 to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-3 text-center">
          <div className="flex justify-center">
            <div className="bg-gradient-to-br from-blue-600 to-green-600 p-3 rounded-2xl shadow-lg">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            SmartSite
          </CardTitle>
          <CardDescription className="text-base">
            AI-Integrated Construction Management Platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@smartsite.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm font-semibold text-blue-900 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs text-blue-700">
              <p><strong>Super Admin:</strong> admin@smartsite.com</p>
              <p><strong>Director:</strong> director@smartsite.com</p>
              <p><strong>Project Manager:</strong> pm@smartsite.com</p>
              <p><strong>Site Manager:</strong> site@smartsite.com</p>
              <p><strong>Works Manager:</strong> works@smartsite.com</p>
              <p><strong>Accountant:</strong> accountant@smartsite.com</p>
              <p><strong>Procurement:</strong> procurement@smartsite.com</p>
              <p><strong>QHSE Manager:</strong> qhse@smartsite.com</p>
              <p><strong>Client:</strong> client@smartsite.com</p>
              <p><strong>Subcontractor:</strong> subcontractor@smartsite.com</p>
              <p className="mt-2 font-semibold">Password for all: <span className="text-blue-900">password123</span></p>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
