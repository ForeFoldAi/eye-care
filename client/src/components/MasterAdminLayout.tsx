import React, { useState } from 'react';
import { Link, useLocation, Outlet } from '@tanstack/react-router';
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
  PanelLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { authService } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWidget } from '@/components/chat/ChatWidget';

interface MasterAdminLayoutProps {
  children: React.ReactNode;
}

const MasterAdminLayout: React.FC<MasterAdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  React.useEffect(() => {
    const getUser = async () => {
      try {
        const userData = await authService.getCurrentUser();
        setCurrentUser(userData?.user);
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };
    getUser();
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
      badge: '12'
    },
    { 
      name: 'Subscriptions', 
      href: '/master-admin/subscriptions', 
      icon: CreditCard,
      description: 'License and billing management',
      badge: '8'
    },
    { 
      name: 'Support', 
      href: '/master-admin/support', 
      icon: Ticket,
      description: 'Helpdesk and tickets',
      badge: '3',
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
      name: 'Users', 
      href: '/master-admin/users', 
      icon: Users,
      description: 'User management'
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
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </div>
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
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
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
            })}
          </nav>

          {/* User section */}
          <div className="p-3 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-white" />
              </div>
              {sidebarOpen && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {currentUser?.firstName} {currentUser?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {currentUser?.email}
                  </p>
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 flex-shrink-0 p-1 rounded-md"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
    </div>
  );
};

export default MasterAdminLayout; 