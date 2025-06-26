import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Heart } from "lucide-react";
import LoadingEye from '@/components/ui/LoadingEye';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!role) {
      toast({
        title: "Role Required",
        description: "Please select your role",
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
        if (response.user.role === 'doctor') {
          navigate('/doctor', { replace: true });
        } else if (response.user.role === 'receptionist') {
          navigate('/receptionist', { replace: true });
        }
      }, 100);
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error instanceof Error ? error.message : "Invalid email or password",
        variant: "destructive",
      });
      // Clear password field on error
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (userType: 'doctor' | 'receptionist') => {
    setEmail(userType === 'doctor' ? "doctor@hospital.com" : "receptionist@hospital.com");
    setPassword(userType === 'doctor' ? "doctor123" : "receptionist123");
    setRole(userType);
    
    // Submit the form after setting the values
    const demoCredentials = {
      email: userType === 'doctor' ? "doctor@hospital.com" : "receptionist@hospital.com",
      password: userType === 'doctor' ? "doctor123" : "receptionist123",
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
        if (response.user.role === 'doctor') {
          navigate('/doctor', { replace: true });
        } else if (response.user.role === 'receptionist') {
          navigate('/receptionist', { replace: true });
        }
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
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-medical-blue-50 text-medical-blue-700 border-medical-blue-200 hover:bg-medical-blue-100"
                onClick={() => handleDemoLogin('doctor')}
                disabled={isLoading}
              >
                Doctor Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-medical-green-50 text-medical-green-700 border-medical-green-200 hover:bg-medical-green-100"
                onClick={() => handleDemoLogin('receptionist')}
                disabled={isLoading}
              >
                Receptionist Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
