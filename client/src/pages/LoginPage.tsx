import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { authService, setupAuthInterceptor } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Heart, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(['doctor', 'receptionist'], {
    required_error: "Please select a role",
  }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      role: undefined,
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return authService.login(data.email, data.password, data.role);
    },
    onSuccess: (response) => {
      authService.setAuth(response.token, response.user);
      setupAuthInterceptor();
      
      // Redirect based on role
      if (response.user.role === 'doctor') {
        window.location.href = '/doctor';
      } else {
        window.location.href = '/receptionist';
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome back, ${response.user.firstName}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-blue-50 to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-medical-blue-500 rounded-full mb-4 mx-auto">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HealthCare Portal</h1>
          <p className="text-gray-600 mt-2">Patient Data Management System</p>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="doctor@hospital.com"
                className="mt-2"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </Label>
              <div className="relative mt-2">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...form.register("password")}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </Button>
              </div>
              {form.formState.errors.password && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                Role
              </Label>
              <Select
                value={form.watch("role")}
                onValueChange={(value: "doctor" | "receptionist") => 
                  form.setValue("role", value)
                }
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="receptionist">Receptionist</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-sm text-red-600 mt-1">
                  {form.formState.errors.role.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>
          </form>

          {/* Demo Access Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-center text-sm text-gray-500 mb-4">Quick Demo Access</p>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="bg-medical-blue-50 text-medical-blue-700 border-medical-blue-200 hover:bg-medical-blue-100"
                onClick={() => {
                  form.setValue("email", "doctor@hospital.com");
                  form.setValue("password", "doctor123");
                  form.setValue("role", "doctor");
                }}
              >
                Doctor Demo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="bg-medical-green-50 text-medical-green-700 border-medical-green-200 hover:bg-medical-green-100"
                onClick={() => {
                  form.setValue("email", "receptionist@hospital.com");
                  form.setValue("password", "receptionist123");
                  form.setValue("role", "receptionist");
                }}
              >
                Receptionist Demo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
