import React, { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Heart, 
  Eye, 
  EyeOff, 
  Mail, 
  Lock, 
  User, 
  Shield, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  Sparkles,
  UserCog,
  Stethoscope,
  Users,
  Settings
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import LoadingEye from '@/components/ui/LoadingEye';

interface ValidationErrors {
  email?: string;
  password?: string;
  role?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  color: string;
  label: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Slideshow images
  const slideshowImages = ['/1.jpg', '/2.jpg', '/3.jpg', '/4.jpg', '/5.jpg'];

  // Lockout timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && lockoutTime > 0) {
      timer = setInterval(() => {
        setLockoutTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setLoginAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockoutTime]);

  // Load remembered credentials
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    const rememberedRole = localStorage.getItem('rememberedRole');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
    if (rememberedRole) {
      setRole(rememberedRole);
    }
  }, []);

  // Slideshow effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === slideshowImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [slideshowImages.length]);

  // Email validation
  const validateEmail = (email: string): string | undefined => {
    if (!email) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return undefined;
  };

  // Password validation
  const validatePassword = (password: string): string | undefined => {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters long';
    return undefined;
  };

  // Password strength calculator
  const calculatePasswordStrength = (password: string): PasswordStrength => {
    if (!password) return { score: 0, feedback: [], color: 'bg-gray-200', label: 'No password' };
    
    let score = 0;
    const feedback: string[] = [];
    
    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Add lowercase letters');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Add uppercase letters');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Add numbers');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Add special characters');

    const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    
    return {
      score,
      feedback,
      color: colors[score] || 'bg-gray-200',
      label: labels[score] || 'Very Weak'
    };
  };

  // Real-time validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field);
  };

  const validateField = (field: string) => {
    const newErrors: ValidationErrors = { ...errors };
    
    switch (field) {
      case 'email':
        newErrors.email = validateEmail(email);
        break;
      case 'password':
        newErrors.password = validatePassword(password);
        break;
      case 'role':
        newErrors.role = !role ? 'Please select your role' : undefined;
        break;
    }
    
    setErrors(newErrors);
  };

  const navigateByRole = (userRole: string) => {
    const routes = {
      master_admin: '/master-admin',
      admin: '/admin',
      sub_admin: '/sub-admin',
      doctor: '/doctor/dashboard',
      receptionist: '/receptionist/dashboard'
    };
    
    navigate({ 
      to: routes[userRole as keyof typeof routes] || '/login', 
      replace: true 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) {
      toast({
        title: "Account Temporarily Locked",
        description: `Please wait ${lockoutTime} seconds before trying again.`,
        variant: "destructive",
      });
      return;
    }

    // Validate all fields
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const roleError = !role ? 'Please select your role' : undefined;

    setErrors({
      email: emailError,
      password: passwordError,
      role: roleError
    });

    if (emailError || passwordError || roleError) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below and try again.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.login(email, password, role);
      
      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
        localStorage.setItem('rememberedRole', role);
      } else {
        localStorage.removeItem('rememberedEmail');
        localStorage.removeItem('rememberedRole');
      }

      // Reset login attempts on success
      setLoginAttempts(0);
      
      toast({
        title: "Welcome Back!",
        description: `Successfully logged in${response.user.firstName ? ', ' + response.user.firstName : ''}`,
        variant: "default",
      });

      setTimeout(() => {
        navigateByRole(response.user.role);
      }, 100);
    } catch (error) {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);

      // Lock account after 5 failed attempts
      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockoutTime(300); // 5 minutes
        toast({
          title: "Account Locked",
          description: "Too many failed attempts. Account locked for 5 minutes.",
          variant: "destructive",
        });
      } else {
        let errorMsg = error instanceof Error ? error.message : "Invalid credentials. Please try again.";
        if (errorMsg.toLowerCase().includes('network')) {
          errorMsg = 'Network error. Please check your connection.';
        }
        
        toast({
          title: "Login Failed",
          description: `${errorMsg} (${5 - newAttempts} attempts remaining)`,
          variant: "destructive",
        });
      }
      
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { 
      type: 'master_admin' as const, 
      label: 'Master Admin', 
      icon: Shield, 
      email: 'master@hospital.com',
      description: 'Full system access',
      bgClass: 'bg-gradient-to-r from-red-500 to-pink-500',
      hoverClass: 'hover:from-red-600 hover:to-pink-600'
    },
    { 
      type: 'admin' as const, 
      label: 'Admin', 
      icon: UserCog, 
      email: 'admin@hospital.com',
      description: 'Administrative access',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      hoverClass: 'hover:from-emerald-600 hover:to-teal-600'
    },
    { 
      type: 'sub_admin' as const, 
      label: 'Sub Admin', 
      icon: Settings, 
      email: 'subadmin@hospital.com',
      description: 'Limited admin access',
      bgClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
      hoverClass: 'hover:from-purple-600 hover:to-indigo-600'
    },
    { 
      type: 'doctor' as const, 
      label: 'Doctor', 
      icon: Stethoscope, 
      email: 'doctor@hospital.com',
      description: 'Medical professional',
      bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
      hoverClass: 'hover:from-emerald-600 hover:to-teal-600'
    },
    { 
      type: 'receptionist' as const, 
      label: 'Receptionist', 
      icon: Users, 
      email: 'receptionist@hospital.com',
      description: 'Front desk operations',
      bgClass: 'bg-gradient-to-r from-orange-500 to-amber-500',
      hoverClass: 'hover:from-orange-600 hover:to-amber-600'
    }
  ];

  const handleDemoLogin = async (userType: typeof demoUsers[0]['type']) => {
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
    setIsLoading(true);
    
    try {
      const response = await authService.login(creds.email, creds.password, userType);
      
      toast({
        title: "Demo Access Granted",
        description: `Welcome to the ${userType.replace('_', ' ')} demo!`,
        variant: "default",
      });

      setTimeout(() => {
        navigateByRole(response.user.role);
      }, 100);
    } catch (error) {
      toast({
        title: "Demo Login Failed",
        description: "Unable to access demo account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = calculatePasswordStrength(password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background slideshow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Slideshow images */}
        {slideshowImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-1000 ease-in-out ${
              index === currentImageIndex ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ backgroundImage: `url(${image})` }}
          />
        ))}
        
        {/* Overlay gradient for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/60 via-slate-800/50 to-zinc-900/60"></div>
        
        {/* Slideshow indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slideshowImages.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              onClick={() => setCurrentImageIndex(index)}
            />
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <LoadingEye size={64} />
            <p className="mt-4 text-lg font-medium text-gray-700">Signing you in...</p>
          </div>
        </div>
      )}

      <div className="w-full max-w-lg relative z-10">
        <Card className="shadow-2xl border-0 bg-white/20 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 p-2">
                  <img 
                    src="/logo.png" 
                    alt="ForeFold HMS Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-white">
              Welcome to ForeFold HMS
            </CardTitle>
            <CardDescription className="text-lg text-white/90 mt-2">
              Sign in to access your healthcare dashboard
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 gap-3 mb-6 bg-white/10 backdrop-blur-sm">
                <TabsTrigger value="login" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=inactive]:text-white/80 hover:text-white">
                  <User className="w-4 h-4" />
                  Login
                </TabsTrigger>
                <TabsTrigger value="demo" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=inactive]:text-white/80 hover:text-white">
                  <Sparkles className="w-4 h-4" />
                  Quick Demo
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-6">
                {/* Lockout warning */}
                {isLocked && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      Account temporarily locked. Please wait {Math.floor(lockoutTime / 60)}:{(lockoutTime % 60).toString().padStart(2, '0')} before trying again.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Login attempts warning */}
                {loginAttempts > 0 && loginAttempts < 5 && !isLocked && (
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      {5 - loginAttempts} login attempts remaining before temporary lockout.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-white">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (touched.email) validateField('email');
                        }}
                        onBlur={() => handleBlur('email')}
                        className={`pl-10 transition-all duration-200 ${
                          errors.email && touched.email 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
                        }`}
                        placeholder="Enter your email address"
                        disabled={isLoading || isLocked}
                      />
                      {touched.email && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {errors.email ? (
                            <XCircle className="w-5 h-5 text-red-500" />
                          ) : (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {errors.email && touched.email && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium text-white">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (touched.password) validateField('password');
                        }}
                        onBlur={() => handleBlur('password')}
                        className={`pl-10 pr-10 transition-all duration-200 ${
                          errors.password && touched.password 
                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                            : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
                        }`}
                        placeholder="Enter your password"
                        disabled={isLoading || isLocked}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        disabled={isLoading || isLocked}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    
                    {/* Password strength indicator */}
                    {password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Password strength:</span>
                          <span className={`text-xs font-medium ${
                            passwordStrength.score >= 4 ? 'text-green-600' :
                            passwordStrength.score >= 3 ? 'text-blue-600' :
                            passwordStrength.score >= 2 ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {errors.password && touched.password && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Role</Label>
                    <Select
                      value={role} 
                      onValueChange={(value) => {
                        setRole(value);
                        if (touched.role) validateField('role');
                      }}
                      onOpenChange={() => handleBlur('role')}
                      disabled={isLoading || isLocked}
                    >
                      <SelectTrigger className={`transition-all duration-200 ${
                        errors.role && touched.role 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-200'
                      }`}>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="master_admin">
                          <div className="flex items-center gap-2">
                            <Shield className="w-4 h-4 text-red-500" />
                            Master Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="admin">
                          <div className="flex items-center gap-2">
                            <UserCog className="w-4 h-4 text-emerald-500" />
                            Account Admin
                          </div>
                        </SelectItem>
                        <SelectItem value="sub_admin">
                          <div className="flex items-center gap-2">
                            <Settings className="w-4 h-4 text-purple-500" />
                            Hospital Branch Admin 
                          </div>
                        </SelectItem>
                        <SelectItem value="doctor">
                          <div className="flex items-center gap-2">
                            <Stethoscope className="w-4 h-4 text-emerald-500" />
                            Doctor
                          </div>
                        </SelectItem>
                        <SelectItem value="receptionist">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-orange-500" />
                            Receptionist
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.role && touched.role && (
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <XCircle className="w-4 h-4" />
                        {errors.role}
                      </p>
                    )}
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      disabled={isLoading || isLocked}
                    />
                    <Label htmlFor="remember" className="text-sm text-white/90 cursor-pointer">
                      Remember my email and role
                    </Label>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    disabled={isLoading || isLocked}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="demo" className="space-y-6">
                                  <div className="text-center mb-6">
                    <p className="text-sm text-white/80">
                      Try different user roles with pre-configured demo accounts
                    </p>
                  </div>
                
                <div className="grid gap-3">
                  {demoUsers.map((user) => {
                    const Icon = user.icon;
                    return (
                      <button
                        key={user.type}
                        type="button"
                        className={`group p-4 rounded-lg text-white font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${user.bgClass} ${user.hoverClass}`}
                        onClick={() => handleDemoLogin(user.type)}
                        disabled={isLoading}
                      >
                        <div className="flex items-center gap-4 w-full">
                          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="text-left flex-1">
                            <div className="font-semibold text-white">{user.label}</div>
                            <div className="text-sm text-white/90">{user.description}</div>
                            <div className="text-xs text-white/75 mt-1">{user.email}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-white/70">
          <p>© 2025 EyeCare Health Management System</p>
          <p className="mt-1">Secure • Reliable • Professional</p>
        </div>
      </div>
    </div>
  );
}