import React from 'react';
import { Link, Outlet, useLocation } from '@tanstack/react-router';
import { 
  IndianRupee, 
  Settings, 
  Shield, 
  Building2, 
  Bell, 
  LogOut,
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
  LayoutDashboard
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
import { useQuery } from '@tanstack/react-query';

interface AdminLayoutProps {
  children?: React.ReactNode;
}
// In AdminLayout.tsx, replace:

// With:
const API_URL = import.meta.env.VITE_API_URL
const AdminLayoutContent: React.FC<{ user: AuthUser }> = ({ user }) => {
  const location = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = React.useState(false);

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

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white shadow-lg transform transition-all duration-300 ease-in-out",
        "lg:relative lg:translate-x-0 lg:transition-none",
        mobileSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        desktopSidebarCollapsed ? "lg:w-20" : "lg:w-64"
      )}>
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!desktopSidebarCollapsed && (
            <div className="flex items-center space-x-3">
              {/* Updated logo section */}
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                {hospitalData?.logoUrl ? (
                  <img 
                    src={hospitalData.logoUrl}
                    alt={`${hospitalData.name} Logo`}
                    className="w-full h-full object-contain p-0.5"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <IndianRupee className="w-5 h-5 text-blue-600" />
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
          )}
          {desktopSidebarCollapsed && (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
              <IndianRupee className="w-5 h-5 text-white" />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              className="lg:hidden"
            >
              {mobileSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDesktopSidebarCollapsed(!desktopSidebarCollapsed)}
              className="hidden lg:flex"
            >
              {desktopSidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    desktopSidebarCollapsed ? "justify-center" : ""
                  )}
                >
                  <item.icon
                    className={cn(
                      isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-500",
                      desktopSidebarCollapsed ? "mx-auto" : "mr-3"
                    )}
                  />
                  {!desktopSidebarCollapsed && (
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{item.description}</div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Quick Stats */}
        {!desktopSidebarCollapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">System Status</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Activity className="w-3 h-3 mr-1" />
                  Online
                </Badge>
              </div>
              
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                className="lg:hidden"
              >
                {mobileSidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
              
              <div className="flex items-center space-x-2">
                <Building2 className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Hospital Administration
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5 text-gray-400" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              </Button>

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
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
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