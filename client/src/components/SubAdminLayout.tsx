import React from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { 
  BarChart3, 
  Users, 
  Calendar, 
  Settings, 
  Building2, 
  Bell, 
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
  Activity,
  FileText,
  TrendingUp,
  Stethoscope,
  ClipboardList,
  MapPin,
  Mail,
  Phone,
  Shield,
  Eye,
  EyeOff,
  Save,
  Edit3
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
import { authService, type User as AuthUser } from '@/lib/auth';
import ProtectedRoute from '@/components/ProtectedRoute';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface SubAdminLayoutProps {
  children?: React.ReactNode;
}

const SubAdminLayoutContent: React.FC<{ user: AuthUser }> = ({ user }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [showProfileSettings, setShowProfileSettings] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const { toast } = useToast();

  // Profile settings state
  const [profileData, setProfileData] = React.useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    email: user.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = React.useState({
    emailNotifications: true,
    pushNotifications: true,
    appointmentReminders: true,
    systemUpdates: true,
    patientAlerts: true,
    staffUpdates: false
  });

  const navigation = [
    { 
      name: 'Dashboard', 
      href: '/sub-admin/dashboard', 
      icon: BarChart3,
      description: 'Branch overview and metrics'
    },
    { 
      name: 'Departments', 
      href: '/sub-admin/departments', 
      icon: Building2,
      description: 'Department organization'
    },
    { 
      name: 'Staff Management', 
      href: '/sub-admin/staff', 
      icon: Users,
      description: 'Manage branch staff'
    },
    { 
      name: 'Doctor Availability', 
      href: '/sub-admin/doctor-availability', 
      icon: Stethoscope,
      description: 'Manage doctor schedules and availability'
    },
    { 
      name: 'Patients', 
      href: '/sub-admin/patients', 
      icon: User,
      description: 'Patient records and information'
    },
    { 
      name: 'Appointments', 
      href: '/sub-admin/appointments', 
      icon: Calendar,
      description: 'Appointment scheduling and management'
    },
    { 
      name: 'Analytics', 
      href: '/sub-admin/analytics', 
      icon: TrendingUp,
      description: 'Performance insights and reports'
    },
    { 
      name: 'Settings', 
      href: '/sub-admin/settings', 
      icon: Settings,
      description: 'Branch settings and configuration'
    },
  ];

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/login';
  };

  // Profile settings handlers
  const handleProfileUpdate = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Profile Updated",
        description: "Your profile information has been successfully updated.",
      });
      setShowProfileSettings(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePasswordChange = async () => {
    if (profileData.newPassword !== profileData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Password Changed",
        description: "Your password has been successfully updated.",
      });
      
      // Reset password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast({
        title: "Password Change Failed",
        description: "Failed to change password. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Notification settings handlers
  const handleNotificationSettingsUpdate = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
      setShowNotifications(false);
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b bg-gradient-to-r from-emerald-600 to-teal-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <Building2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-white">
                <h1 className="text-lg font-bold">Branch Admin</h1>
                <p className="text-xs text-emerald-100">Management Portal</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden text-white hover:bg-white/10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* User Info */}
          <div className="p-6 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.profilePhotoUrl} alt={`${user.firstName} ${user.lastName}`} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-xs text-gray-600">Branch Administrator</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="ml-auto">
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowProfileSettings(true)}>
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowNotifications(true)}>
                    <Bell className="w-4 h-4 mr-2" />
                    Notifications
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

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-emerald-600" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* Branch Info */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span className="truncate">Main Branch</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline" className="text-xs">
                <Activity className="w-3 h-3 mr-1" />
                Active
              </Badge>
              <span className="text-xs text-gray-500">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-72">
        {/* Desktop Header */}
        <div className="hidden lg:block bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Branch Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 lg:hidden">
          <div className="flex items-center justify-between h-16 px-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">Branch Management</h1>
            <div className="flex items-center space-x-2">
              <NotificationBell />
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
      <Dialog open={showProfileSettings} onOpenChange={setShowProfileSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Profile Settings</DialogTitle>
            <DialogDescription>
              Update your personal information and change your password
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter your email"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleProfileUpdate} className="w-full">
                <Save className="w-4 h-4 mr-2" />
                Update Profile
              </Button>
            </div>

            <div className="border-t pt-6">
              {/* Password Change */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="currentPassword"
                      type={profileData.showCurrentPassword ? "text" : "password"}
                      value={profileData.currentPassword}
                      onChange={(e) => setProfileData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setProfileData(prev => ({ ...prev, showCurrentPassword: !prev.showCurrentPassword }))}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {profileData.showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="newPassword"
                        type={profileData.showNewPassword ? "text" : "password"}
                        value={profileData.newPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Enter new password"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, showNewPassword: !prev.showNewPassword }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {profileData.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="confirmPassword"
                        type={profileData.showConfirmPassword ? "text" : "password"}
                        value={profileData.confirmPassword}
                        onChange={(e) => setProfileData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Confirm new password"
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setProfileData(prev => ({ ...prev, showConfirmPassword: !prev.showConfirmPassword }))}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {profileData.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
                <Button onClick={handlePasswordChange} className="w-full">
                  <Shield className="w-4 h-4 mr-2" />
                  Change Password
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Notifications Settings Modal */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Notification Settings</DialogTitle>
            <DialogDescription>
              Manage your notification preferences and alerts
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.emailNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Bell className="w-5 h-5 text-green-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                    <p className="text-sm text-gray-600">Receive real-time push notifications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.pushNotifications}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, pushNotifications: e.target.checked }))}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-purple-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">Appointment Reminders</h4>
                    <p className="text-sm text-gray-600">Get reminded about upcoming appointments</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.appointmentReminders}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, appointmentReminders: e.target.checked }))}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-orange-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">System Updates</h4>
                    <p className="text-sm text-gray-600">Receive system maintenance notifications</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.systemUpdates}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, systemUpdates: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-red-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">Patient Alerts</h4>
                    <p className="text-sm text-gray-600">Get notified about patient emergencies</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.patientAlerts}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, patientAlerts: e.target.checked }))}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-indigo-500" />
                  <div>
                    <h4 className="font-medium text-gray-900">Staff Updates</h4>
                    <p className="text-sm text-gray-600">Receive updates about staff changes</p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notificationSettings.staffUpdates}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, staffUpdates: e.target.checked }))}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
              </div>
            </div>

            <Button onClick={handleNotificationSettingsUpdate} className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Save Notification Settings
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const SubAdminLayout: React.FC<SubAdminLayoutProps> = () => {
  return (
    <ProtectedRoute requiredRole="sub_admin">
      {(user) => <SubAdminLayoutContent user={user} />}
    </ProtectedRoute>
  );
};

export default SubAdminLayout; 