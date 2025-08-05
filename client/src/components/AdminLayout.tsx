import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from '@tanstack/react-router';
import { 
  IndianRupee, 
  Settings, 
  Shield, 
  Building2, 
  Bell, 
  LogOut,
  Hospital,
  AlertCircle,
  Menu,
  X,
  User,
  ChevronDown,
  Activity,
  FileText,
  Database,
  TrendingUp,
  Wallet,
  Target,
  Lock,
  AlertTriangle,
  LayoutDashboard,
  Users,
  Stethoscope,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeft,
  Mail,
  HelpCircle,
  Clock,
  Phone,
  Globe,
  Server,
  Network,
  Cpu,
  HardDrive,
  Zap,
  UserPlus,
  BarChart3,
  Plus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { authService, type User as AuthUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useQuery } from '@tanstack/react-query';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWidget } from '@/components/chat/ChatWidget';

interface AdminLayoutProps {
  children?: React.ReactNode;
}
// In AdminLayout.tsx, replace:

// With:
const API_URL = import.meta.env.VITE_API_URL
const AdminLayoutContent: React.FC<{ user: AuthUser }> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const [showSupportModal, setShowSupportModal] = React.useState(false);
  const [showSettingsModal, setShowSettingsModal] = React.useState(false);
  const [currentTime, setCurrentTime] = React.useState(new Date());
  const [profileData, setProfileData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false,
    twoFactorAuth: false,
    loginAlerts: true,
    sessionTimeout: '30'
  });

  // Add hospital data query
  const { data: hospitalData, isLoading: hospitalLoading } = useQuery({
    queryKey: ['hospital', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/hospitals/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch hospital data');
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Add subscription data query
  const { data: subscriptionData } = useQuery({
    queryKey: ['subscription', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/subscriptions/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Initialize profile data when user data is available
  React.useEffect(() => {
    if (user) {
      setProfileData(prev => ({
        ...prev,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || '',
        address: user.address || '',
        bio: '' // bio is not in User interface, so we'll leave it empty
      }));
    }
  }, [user]);

  // Update time every minute
  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard,
      description: 'Overview and key metrics'
    },
    { 
      name: 'Branch Management', 
      href: '/admin/branches', 
      icon: Building2,
      description: 'Manage all branch locations'
    },
    /*{ 
      name: 'Add Branch', 
      href: '/admin/add-branch', 
      icon: Plus,
      description: 'Create new branch location'
    },*/
    { 
      name: 'Department Management', 
      href: '/admin/department-management', 
      icon: Users,
      description: 'Manage hospital departments'
    },
    { 
      name: 'Dr. Calendar', 
      href: '/admin/doctor-availability', 
      icon: Stethoscope,
      description: 'Manage doctor schedules and availability'
    },
    { 
      name: 'Staff Management', 
      href: '/admin/staff', 
      icon: User,
      description: 'Manage hospital staff'
    },
    { 
      name: 'Financial Management', 
      href: '/admin/financial', 
      icon: IndianRupee,
      description: 'Revenue and expense tracking'
    },
    { 
      name: 'Analytics', 
      href: '/admin/analytics', 
      icon: TrendingUp,
      description: 'Advanced reporting and insights'
    },
    { 
      name: 'Audit & Compliance', 
      href: '/admin/audit', 
      icon: Shield,
      description: 'Security and compliance monitoring'
    },
    { 
      name: 'System Configuration', 
      href: '/admin/settings', 
      icon: Settings,
      description: 'System settings and preferences'
    },
  ];

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const handleProfileUpdate = async () => {
    try {
      // Validate password change if attempting to change password
      if (profileData.newPassword || profileData.currentPassword) {
        if (!profileData.currentPassword) {
          toast({
            title: "Error",
            description: "Current password is required to change password",
            variant: "destructive"
          });
          return;
        }
        if (profileData.newPassword !== profileData.confirmPassword) {
          toast({
            title: "Error",
            description: "New passwords do not match",
            variant: "destructive"
          });
          return;
        }
        if (profileData.newPassword.length < 8) {
          toast({
            title: "Error",
            description: "New password must be at least 8 characters long",
            variant: "destructive"
          });
          return;
        }
      }

      // Simulate API call (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      setShowProfileModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNavigateToSettings = () => {
    navigate({ to: '/admin/settings' });
  };

  const handleNavigateToSecurity = () => {
    navigate({ to: '/admin/settings' });
    // Note: In a real implementation, you might want to pass a query parameter
    // to focus on the security tab, but for now we'll just navigate to settings
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-72' : 'w-0 lg:w-16'
      } transition-all duration-300 ease-in-out bg-white shadow-lg z-50 fixed lg:fixed inset-y-0 left-0 overflow-hidden border-r border-gray-200`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
            <div className="flex items-center space-x-2 min-w-0 flex-1">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <img src="/logo.png" alt="ForeFold HMS Logo" className="w-5 h-5 object-contain rounded" />
              </div>
              {sidebarOpen && (
                <div className="text-white min-w-0 flex-1">
                  <h1 className="text-sm font-bold truncate">ForeFold HMS</h1>
                  <p className="text-xs text-blue-100 truncate">Hospital Management System</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10 flex-shrink-0 ml-2"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const linkContent = (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <div className={`p-2 rounded-md mr-3 flex-shrink-0 ${
                    isActive 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                  }`}>
                    <item.icon className="w-4 h-4" />
                  </div>
                  {sidebarOpen && (
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate">{item.description}</div>
                    </div>
                  )}
                </Link>
              );

              // Show tooltip only when sidebar is closed
              if (!sidebarOpen) {
                return (
                  <TooltipProvider key={item.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="flex flex-col items-start">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs text-gray-400">{item.description}</span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return linkContent;
            })}
          </nav>


        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-16'
      }`}>
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-14 px-4">
            <div className="flex items-center min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </Button>
              
              <div className="flex items-center min-w-0 flex-1">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0 mr-2">
                  {hospitalData?.logoUrl ? (
                    <img 
                      src={hospitalData.logoUrl}
                      alt={`${hospitalData.name} Logo`}
                      className="w-6 h-6 object-contain rounded"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <Hospital className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base font-semibold text-gray-900 truncate max-w-[50ch]">
                    {hospitalLoading ? 'Loading...' : hospitalData?.name || 'Hospital Management'}
                  </h1>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600">Account Status</span>
                <div className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  subscriptionData?.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {subscriptionData?.status === 'active' ? 'Active' : 'Inactive'}
                </div>
              </div>
              
              <Button 
                variant="ghost"
                size="sm"
                onClick={() => setShowSupportModal(true)}
                className="h-8 px-2"
              >
                <AlertCircle className="w-4 h-4" />
              </Button>

              {/* Date and Time */}
              <div className="hidden xl:flex items-center space-x-1 px-2 py-1 bg-gray-50 rounded border text-xs min-w-[100px]">
                <div className="font-medium text-gray-900">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    hour12: true 
                  })}
                </div>
                <div className="text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              
              <NotificationBell />
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-2 py-1 h-8 hover:bg-gray-100">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.profilePhotoUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left min-w-0">
                      <p className="text-xs font-medium text-gray-900 truncate max-w-[20ch]">
                        {user.firstName} {user.lastName}
                      </p>
                    </div>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    System Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-12 px-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              className="p-1"
            >
              <Menu className="w-4 h-4" />
            </Button>
            <div className="flex items-center min-w-0 flex-1 mx-2">
              <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center mr-2 flex-shrink-0">
                <Hospital className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-sm font-semibold text-gray-900 truncate">
                {hospitalLoading ? 'Loading...' : hospitalData?.name || 'Hospital Management'}
              </h1>
            </div>
            <div className="flex items-center space-x-1">
              <NotificationBell />
              
              {/* Mobile User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={user.profilePhotoUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSettingsModal(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    System Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        
        {/* Chat Widget */}
        <div className="fixed bottom-4 right-4 z-50">
          <ChatWidget />
        </div>
      </div>

      {/* Profile Settings Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Profile Settings</DialogTitle>
            <DialogDescription>
              Update your personal information and account settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your basic profile information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={profileData.address}
                    onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Input
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your account password</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={profileData.showCurrentPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setProfileData(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                    >
                      {profileData.showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={profileData.showNewPassword ? "text" : "password"}
                      value={profileData.newPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setProfileData(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                    >
                      {profileData.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={profileData.showConfirmPassword ? "text" : "password"}
                      value={profileData.confirmPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setProfileData(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                    >
                      {profileData.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>Manage your account security preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-600">Add an extra layer of security</p>
                  </div>
                  <Switch
                    id="twoFactorAuth"
                    checked={profileData.twoFactorAuth}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, twoFactorAuth: checked }))}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="loginAlerts">Login Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified of new login attempts</p>
                  </div>
                  <Switch
                    id="loginAlerts"
                    checked={profileData.loginAlerts}
                    onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, loginAlerts: checked }))}
                  />
                </div>
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout</Label>
                  <Select
                    value={profileData.sessionTimeout}
                    onValueChange={(value) => setProfileData(prev => ({ ...prev, sessionTimeout: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-2 pt-6">
            <Button variant="outline" onClick={() => setShowProfileModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleProfileUpdate}>
              Update Profile
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Modal */}
      <Dialog open={showSupportModal} onOpenChange={setShowSupportModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Support Ticket</DialogTitle>
            <DialogDescription>
              Submit a support ticket for assistance with the Hospital Management System
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ticketType">Ticket Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ticket type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technical">Technical Issue</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                    <SelectItem value="training">Training Request</SelectItem>
                    <SelectItem value="general">General Inquiry</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Brief description of your issue"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                placeholder="Please provide detailed information about your issue, including steps to reproduce if applicable..."
                rows={4}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input 
                  id="contactEmail" 
                  type="email"
                  placeholder="your.email@hospital.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input 
                  id="contactPhone" 
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="urgent" 
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <Label htmlFor="urgent" className="text-sm">
                Mark as urgent (for critical system issues)
              </Label>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSupportModal(false)}
              >
                Cancel
              </Button>
              <Button onClick={() => {
                toast({
                  title: "Support Ticket Submitted",
                  description: "Your support ticket has been submitted successfully. We'll get back to you within 24 hours.",
                });
                setShowSupportModal(false);
              }}>
                <Mail className="w-4 h-4 mr-2" />
                Submit Ticket
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* System Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">System Settings</DialogTitle>
            <DialogDescription>
              Manage hospital settings, system configuration, and administrative tasks
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Hospital Information */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Building2 className="w-6 h-6 mr-2" />
                  Hospital Information
                </CardTitle>
                <CardDescription>Manage hospital details and contact information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Hospital Name</label>
                      <p className="text-lg font-semibold text-gray-900">{hospitalData?.name || 'Hospital Name'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Address</label>
                      <p className="text-gray-600">{hospitalData?.address || 'Address not available'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Phone Number</label>
                      <p className="text-gray-600 flex items-center">
                        <Phone className="w-4 h-4 mr-2" />
                        {hospitalData?.phoneNumber || 'Phone not available'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-600 flex items-center">
                        <Mail className="w-4 h-4 mr-2" />
                        {hospitalData?.email || 'Email not available'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {hospitalData?.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-700">Website</label>
                        <p className="text-gray-600 flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          <a 
                            href={hospitalData.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {hospitalData.website}
                          </a>
                        </p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-700">Status</label>
                      <Badge variant={hospitalData?.isActive ? "default" : "secondary"} className="mt-1">
                        {hospitalData?.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Description</label>
                      <p className="text-gray-600">{hospitalData?.description || 'No description available'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Configuration */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Settings className="w-6 h-6 mr-2" />
                  System Configuration
                </CardTitle>
                <CardDescription>Manage system settings and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Database className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Database Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium">Server Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Online</Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-purple-600" />
                        <span className="text-sm font-medium">Security</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Secure</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Network className="w-5 h-5 text-orange-600" />
                        <span className="text-sm font-medium">Network</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Stable</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Cpu className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium">CPU Usage</span>
                      </div>
                      <span className="text-sm text-gray-600">45%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-5 h-5 text-indigo-600" />
                        <span className="text-sm font-medium">Storage</span>
                      </div>
                      <span className="text-sm text-gray-600">2.1GB / 10GB</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = () => {
  return (
    <ProtectedRoute requiredRole="admin">
      {(currentUser: AuthUser) => (
        <AdminLayoutContent user={currentUser} />
      )}
    </ProtectedRoute>
  );
};

export default AdminLayout; 