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
  PanelLeft
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
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
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
  const { data: hospitalData } = useQuery({
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

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/admin/dashboard', 
      icon: LayoutDashboard,
      description: 'Overview and key metrics'
    },
    { 
      name: 'Add Branch', 
      href: '/admin/add-branch', 
      icon: Building2,
      description: 'Create new branch location'
    },
    { 
      name: 'Department Management', 
      href: '/admin/department-management', 
      icon: Users,
      description: 'Manage hospital departments'
    },
    { 
      name: 'Doctor Availability', 
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
                {hospitalData?.logoUrl ? (
                  <img 
                    src={hospitalData.logoUrl}
                    alt={`${hospitalData.name} Logo`}
                    className="w-5 h-5 object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <Hospital className="w-5 h-5 text-blue-600 hidden" />
              </div>
              {sidebarOpen && (
                <div className="text-white min-w-0 flex-1">
                  <h1 className="text-sm font-bold truncate">
                    {hospitalData?.name || 'Admin Panel'}
                  </h1>
                  <p className="text-xs text-blue-100 truncate">
                    {hospitalData?.name ? 'Administration' : 'Hospital Management'}
                  </p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10 flex-shrink-0 ml-2"
              onClick={() => setMobileSidebarOpen(false)}
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

          {/* Hospital Info */}
          <div className="p-3 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Online
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-72' : 'lg:ml-16'
      }`}>
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </Button>
              <h1 className="text-xl font-semibold text-gray-900">Hospital Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
              
              {/* User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-100">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.profilePhotoUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">Hospital Administrator</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
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
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:hidden flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Hospital Management</h1>
            <div className="flex items-center space-x-2">
              <NotificationBell />
              
              {/* Mobile User Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-1">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={user.profilePhotoUrl} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-xs">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
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

        <main className="flex-1 overflow-y-auto min-h-0">
          <Outlet />
        </main>
        
        {/* Chat Widget */}
        <div className="fixed bottom-4 right-4 z-50">
          <ChatWidget />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

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