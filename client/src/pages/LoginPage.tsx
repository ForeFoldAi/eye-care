import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart } from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import LoadingEye from '@/components/ui/LoadingEye';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Debug: Check current auth state
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    console.log('LoginPage: Current auth state:', { 
      hasToken: !!token, 
      hasUser: !!user,
      tokenLength: token?.length,
      userData: user ? JSON.parse(user) : null
    });
  }, []);

  const navigateByRole = (userRole: string) => {
    switch (userRole) {
      case 'master_admin':
        navigate({ to: '/master-admin', replace: true });
        break;
      case 'admin':
        navigate({ to: '/admin', replace: true });
        break;
      case 'sub_admin':
        navigate({ to: '/sub-admin', replace: true });
        break;
      case 'doctor':
        navigate({ to: '/doctor/dashboard', replace: true });
        break;
      case 'receptionist':
        navigate({ to: '/receptionist/dashboard', replace: true });
        break;
      default:
        navigate({ to: '/login', replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both your email and password to log in.",
        variant: "destructive",
      });
      return;
    }

    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select your role to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password, role);
      
      // Show success message
      toast({
        title: "Login Successful",
        description: `Welcome back${response.user.firstName ? ', ' + response.user.firstName : ''}!`,
        variant: "default",
      });

      // Small delay to ensure token is stored before navigation
      setTimeout(() => {
        navigateByRole(response.user.role);
      }, 100);
    } catch (error) {
      let errorMsg = error instanceof Error ? error.message : "Invalid email or password. Please check your credentials and try again.";
      if (errorMsg.toLowerCase().includes('network')) {
        errorMsg = 'Network error. Please check your internet connection and try again.';
      }
      toast({
        title: "Login Failed",
        description: errorMsg,
        variant: "destructive",
      });
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userType: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist') => {
    const credentials = {
      master_admin: { email: "master@hospital.com", password: "masteradmin123" },
      admin: { email: "admin@hospital.com", password: "admin123" },
      sub_admin: { email: "subadmin@hospital.com", password: "subadmin123" },
      doctor: { email: "doctor@hospital.com", password: "doctor123" },
      receptionist: { email: "receptionist@hospital.com", password: "receptionist123" }
    };
    
    const creds = credentials[userType];
    setEmail(creds.email);
    setPassword(creds.password);
    setRole(userType);
    
    // Submit the form after setting the values
    const demoCredentials = {
      email: creds.email,
      password: creds.password,
      role: userType,
    };
    
    setIsLoading(true);
    
    try {
      const response = await authService.login(
        demoCredentials.email,
        demoCredentials.password,
        demoCredentials.role
      );
      
      toast({
        title: "Demo Login Successful",
        description: `Welcome back${response.user.firstName ? ', ' + response.user.firstName : ''}!`,
        variant: "default",
      });

      // Small delay to ensure token is stored before navigation
      setTimeout(() => {
        navigateByRole(response.user.role);
      }, 100);
    } catch (error) {
      console.error('Demo login error:', error);
      toast({
        title: "Demo Login Failed",
        description: "Failed to log in with demo credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugAuth = async () => {
    try {
      console.log('Debug: Testing auth state...');
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      console.log('Debug: Local storage:', { token: !!token, user: !!user });
      
      if (token && user) {
        console.log('Debug: Testing getCurrentUser...');
        const currentUser = await authService.getCurrentUser();
        console.log('Debug: getCurrentUser result:', currentUser);
        
        toast({
          title: "Debug: Auth Test",
          description: "Authentication is working! Check console for details.",
          variant: "default",
        });
      } else {
        console.log('Debug: No token or user in localStorage');
        toast({
          title: "Debug: Auth Test",
          description: "No authentication data found in localStorage.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Debug: Auth test failed:', error);
      toast({
        title: "Debug: Auth Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleClearStorage = () => {
    localStorage.clear();
    console.log('Debug: Local storage cleared');
    toast({
      title: "Debug: Storage Cleared",
      description: "Local storage has been cleared. Please login again.",
      variant: "default",
    });
  };

  const handleTestTokenStorage = () => {
    const testToken = 'test-token-123';
    const testUser = { id: '1', email: 'test@test.com', role: 'receptionist' };
    
    console.log('Debug: Testing token storage...');
    localStorage.setItem('token', testToken);
    localStorage.setItem('user', JSON.stringify(testUser));
    
    const retrievedToken = localStorage.getItem('token');
    const retrievedUser = localStorage.getItem('user');
    
    console.log('Debug: Token storage test results:', {
      storedToken: testToken,
      retrievedToken,
      tokensMatch: testToken === retrievedToken,
      storedUser: testUser,
      retrievedUser: retrievedUser ? JSON.parse(retrievedUser) : null
    });
    
    toast({
      title: "Debug: Token Storage Test",
      description: `Token storage test completed. Check console for results.`,
      variant: "default",
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-80">
          <LoadingEye size={64} />
        </div>
      )}
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="w-12 h-12 bg-medical-blue-500 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h1 className="ml-4 text-2xl font-bold text-gray-900">EyeCare</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <Label>Role</Label>
              <Select
                value={role} 
                onValueChange={setRole}
                disabled={isLoading}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="master_admin">Master Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              className="w-full bg-medical-blue-500 hover:bg-medical-blue-600"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          {/* Demo Login Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Button
                type="button"
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                onClick={() => handleDemoLogin('master_admin')}
                disabled={isLoading}
              >
                Master Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={() => handleDemoLogin('admin')}
                disabled={isLoading}
              >
                Admin
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                onClick={() => handleDemoLogin('sub_admin')}
                disabled={isLoading}
              >
                Sub Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-medical-blue-50 text-medical-blue-700 border-medical-blue-200 hover:bg-medical-blue-100"
                onClick={() => handleDemoLogin('doctor')}
                disabled={isLoading}
              >
                Doctor
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-medical-green-50 text-medical-green-700 border-medical-green-200 hover:bg-medical-green-100"
                onClick={() => handleDemoLogin('receptionist')}
                disabled={isLoading}
              >
                Receptionist
              </Button>
            </div>
            
            {/* Debug Button */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                className="w-full text-gray-600 border-gray-300 hover:bg-gray-50"
                onClick={handleDebugAuth}
                disabled={isLoading}
              >
                Debug Auth State
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full text-red-600 border-red-300 hover:bg-red-50 mt-2"
                onClick={handleClearStorage}
                disabled={isLoading}
              >
                Clear Local Storage
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full text-blue-600 border-blue-300 hover:bg-blue-50 mt-2"
                onClick={handleTestTokenStorage}
                disabled={isLoading}
              >
                Test Token Storage
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
