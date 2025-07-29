import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet, useNavigate } from '@tanstack/react-router';
import { 
  Building2, 
  Users, 
  Settings, 
  BarChart3,
  LogOut,
  User,
  CreditCard,
  Ticket,
  IndianRupee,
  FileText,
  Search,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Home,
  Shield,
  Database,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Globe,
  Server,
  Zap,
  Target,
  PieChart,
  LineChart,
  BarChart,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Plus,
  Filter,
  Download,
  RefreshCw,
  ExternalLink,
  Info,
  HelpCircle,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  HardDrive,
  Cpu,
  Network,
  Star,
  TrendingDown,
  AlertTriangle,
  CheckSquare,
  Square,
  Minus,
  Plus as PlusIcon,
  PanelLeftClose,
  PanelLeft,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWidget } from '@/components/chat/ChatWidget';

interface MasterAdminLayoutProps {
  children: React.ReactNode;
}

const MasterAdminLayout: React.FC<MasterAdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hospitalCount, setHospitalCount] = useState(0);
  const [subscriptionCount, setSubscriptionCount] = useState(0);
  const [supportCount, setSupportCount] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileData, setProfileData] = useState({
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

  useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setCurrentUser(userData?.user);
        // Initialize profile data with current user data
        if (userData?.user) {
          setProfileData(prev => ({
            ...prev,
            firstName: userData.user.firstName || '',
            lastName: userData.user.lastName || '',
            email: userData.user.email || '',
            phone: userData.user.phoneNumber || '',
            address: userData.user.address || '',
            bio: '' // bio is not in User interface, so we'll leave it empty
          }));
        }
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    getUser();

    // Helper to fetch count with auth
    const fetchCount = async (url: string, setter: (n: number) => void) => {
      try {
        const token = authService.getToken?.() || localStorage.getItem('token');
        const res = await fetch(url, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        const data = await res.json();
        console.log('Count response for', url, data);
        // Try to find count in data.count, data.data.count, or fallback
        const count = data.count ?? data.data?.count ?? 0;
        setter(typeof count === 'number' ? count : 0);
      } catch (err) {
        console.error('Error fetching count for', url, err);
        setter(0);
      }
    };

    fetchCount('/api/hospitals/count', setHospitalCount);
    fetchCount('/api/subscriptions/count', setSubscriptionCount);
    fetchCount('/api/support/count', setSupportCount);
  }, []);

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/master-admin', 
      icon: BarChart3,
      description: 'System overview and analytics'
    },
    { 
      name: 'Hospitals', 
      href: '/master-admin/hospitals', 
      icon: Building2,
      description: 'Manage client hospitals',
      badge: hospitalCount > 0 ? String(hospitalCount) : undefined
    },
    { 
      name: 'Users', 
      href: '/master-admin/users', 
      icon: Users,
      description: 'User management'
    },
    { 
      name: 'Subscriptions', 
      href: '/master-admin/subscriptions', 
      icon: CreditCard,
      description: 'License and billing management',
      badge: subscriptionCount > 0 ? String(subscriptionCount) : undefined
    },
    { 
      name: 'Support', 
      href: '/master-admin/support', 
      icon: Ticket,
      description: 'Helpdesk and tickets',
      badge: supportCount > 0 ? String(supportCount) : undefined,
      badgeColor: 'bg-red-500'
    },
    { 
      name: 'Billing', 
      href: '/master-admin/billing', 
      icon: IndianRupee,
      description: 'Invoices and payments'
    },
    { 
      name: 'Reports', 
      href: '/master-admin/reports', 
      icon: BarChart3,
      description: 'Reports and analytics'
    },
    
    { 
      name: 'Analytics', 
      href: '/master-admin/analytics', 
      icon: TrendingUp,
      description: 'Reports and insights'
    },
    { 
      name: 'System', 
      href: '/master-admin/settings', 
      icon: Settings,
      description: 'Configuration and settings'
    },
  ];

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
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
    navigate({ to: '/master-admin/settings' });
  };

  const handleNavigateToSecurity = () => {
    navigate({ to: '/master-admin/settings' });
    // Note: In a real implementation, you might want to pass a query parameter
    // to focus on the security tab, but for now we'll just navigate to settings
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
      } transition-all duration-300 ease-in-out bg-white shadow-lg z-50 fixed lg:fixed inset-y-0 left-0 overflow-hidden border-r border-gray-200`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain flex-shrink-0" />
              {sidebarOpen && (
                <div className="min-w-0">
                  <h1 className="text-lg font-bold text-gray-900">ForefoldAI</h1>
                  <p className="text-xs text-gray-500">Master Admin</p>
                </div>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden flex-shrink-0"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
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
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{item.name}</span>
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs flex-shrink-0 ${
                              item.badgeColor || 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${
                        isActive ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {item.description}
                      </p>
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
                        {item.badge && (
                          <Badge 
                            variant="secondary" 
                            className={`text-xs mt-1 ${
                              item.badgeColor || 'bg-blue-100 text-blue-700'
                            }`}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              }

              return linkContent;
            })}
          </nav>

          {/* User section */}
          {/* Remove the user section from the sidebar */}
        </div>
      </div>

      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
      }`}>
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="mr-2"
                onClick={toggleSidebar}
              >
                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
              </Button>
              
              {/* Breadcrumb */}
              <nav className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Master Admin</span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900 font-medium">
                  {navigation.find(item => item.href === location.pathname)?.name || 'Dashboard'}
                </span>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search..."
                  className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white"
                />
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* System status */}
              <div className="hidden sm:flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-600">System Online</span>
                </div>
              </div>

              {/* Master Admin Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-12 w-auto px-3 hover:bg-gray-100">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={currentUser?.profilePhotoUrl} 
                          alt={`${currentUser?.firstName} ${currentUser?.lastName}`}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                          {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <p className="text-sm font-medium text-gray-900">
                          {currentUser?.firstName} {currentUser?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">Master Administrator</p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {currentUser?.firstName} {currentUser?.lastName}
                      </p>
                      <p className="text-xs leading-none text-gray-500">
                        {currentUser?.email}
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

        {/* Page content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />

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

export default MasterAdminLayout; 