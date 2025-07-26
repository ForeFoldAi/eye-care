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
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  Stethoscope,
  Eye,
  EyeOff
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
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = React.useState(false);
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 bottom-0 z-50 bg-white shadow-lg border-r border-gray-200 transform transition-all duration-300 ease-in-out",
        "lg:relative lg:translate-x-0 lg:transition-none lg:top-0 lg:bottom-0",
        mobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        desktopSidebarCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            {!desktopSidebarCollapsed ? (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  {hospitalData?.logoUrl ? (
                    <img 
                      src={hospitalData.logoUrl}
                      alt={`${hospitalData.name} Logo`}
                      className="w-8 h-8 object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <Hospital className="w-6 h-6 text-white" />
                  )}
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {hospitalData?.name || 'Admin Panel'}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {hospitalData?.name ? 'Administration' : 'Hospital Management'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <Hospital className="w-6 h-6 text-white" />
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-3 space-y-2 overflow-hidden">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    desktopSidebarCollapsed ? "justify-center" : ""
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5",
                      isActive ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700",
                      desktopSidebarCollapsed ? "mx-auto" : "mr-3"
                    )}
                  />
                  {!desktopSidebarCollapsed && (
                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          {!desktopSidebarCollapsed && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Activity className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                {mobileSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              
              {/* Desktop sidebar toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
                className="hidden lg:flex items-center space-x-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors text-gray-600 hover:text-gray-900"
                title={desktopSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {desktopSidebarCollapsed ? (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    <span className="text-sm font-medium">Expand</span>
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    <span className="text-sm font-medium">Collapse</span>
                  </>
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-700 font-medium">
                  Hospital Administration
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <NotificationBell />

              {/* Admin Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-auto px-3 hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={user?.profilePhotoUrl} 
                          alt={`${user?.firstName} ${user?.lastName}`}
                        />
                        <AvatarFallback className="bg-blue-500 text-white">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileModal(true)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNavigateToSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleNavigateToSecurity}>
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Security</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <Outlet />
          </div>
        </main>
        
        {/* Chat and Notification Components */}
        <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2">
          <ChatWidget />
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
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