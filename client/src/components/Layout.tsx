import { useRouter } from "@tanstack/react-router";
import { Bell, Heart, Users, Calendar, FileText, Clock, LayoutDashboard, LogOut, PanelLeftClose, PanelLeft, Receipt, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { authService, type User as AuthUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LayoutProps {
  children: React.ReactNode;
  user: AuthUser;
}

const doctorMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/doctor/dashboard" },
  { icon: Calendar, label: "Appointments", href: "/doctor/appointments" },
  { icon: Users, label: "Patients", href: "/doctor/patients" },
  { icon: FileText, label: "Prescriptions", href: "/doctor/prescriptions" },
  { icon: Clock, label: "Availability", href: "/doctor/availability" },
];

const receptionistMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/receptionist/dashboard" },
  { icon: Users, label: "Patients", href: "/receptionist/patients" },
  { icon: Calendar, label: "Appointments", href: "/receptionist/appointments" },
  { icon: Receipt, label: "Payments", href: "/receptionist/payments" },
  
];

export default function Layout({ children, user }: LayoutProps) {
  const router = useRouter();
  const location = router.state.location;

  // Get the appropriate menu items based on user role
  const menuItems = user.role === ROLES.DOCTOR ? doctorMenuItems : receptionistMenuItems;
  
  // Initialize isCollapsed from localStorage or default to true
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    return stored ? JSON.parse(stored) : true;
  });

  // Save isCollapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  const getCurrentDateTime = () => {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    };
    
    return {
      date: now.toLocaleDateString('en-US', dateOptions),
      time: now.toLocaleTimeString('en-US', timeOptions)
    };
  };

  const { date, time } = getCurrentDateTime();

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="h-screen overflow-hidden">
      {/* Sidebar */}
      <div 
        className={cn(
          "bg-[#1a3b61] flex flex-col transition-all duration-300 fixed top-0 bottom-0 left-0 z-50",
          isCollapsed ? "w-[60px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div className="h-14 flex items-center px-3 border-b border-[#2d4b71]">
          <div className="flex items-center">
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center">
              <Heart className="h-4 w-4 text-[#1a3b61]" />
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-base font-semibold text-white">EyeCare</span>
            )}
          </div>
        </div>

        {/* Toggle Button - Repositioned */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "absolute -right-3 top-16 z-[60]",
            "w-6 h-6 rounded-full bg-white shadow-md",
            "flex items-center justify-center",
            "hover:bg-gray-100 transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a3b61]"
          )}
        >
          {isCollapsed ? (
            <PanelLeft className="h-3 w-3 text-[#1a3b61]" />
          ) : (
            <PanelLeftClose className="h-3 w-3 text-[#1a3b61]" />
          )}
        </button>

        {/* User Info */}
        {!isCollapsed && (
          <div className="px-3 py-2 border-b border-[#2d4b71]">
            <div className="flex items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">
                  {user.role === ROLES.DOCTOR ? 'Dr.' : ''} {user.firstName} {user.lastName}
                </span>
                <span className="text-xs text-[#8ba1bc]">
                  {user.role === ROLES.DOCTOR ? 'Doctor' : 'Receptionist'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2">
          <TooltipProvider delayDuration={0}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <a
                      href={item.href}
                      className={cn(
                        "flex items-center h-10 text-sm transition-colors",
                    isActive 
                          ? "bg-[#2d4b71] text-white font-medium"
                          : "text-[#8ba1bc] hover:bg-[#234567] hover:text-white",
                        isCollapsed ? "px-4 mx-2 rounded-lg" : "px-3"
                      )}
                >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && <span className="ml-2 truncate">{item.label}</span>}
                    </a>
                  </TooltipTrigger>
                  {isCollapsed && (
                    <TooltipContent side="right">
                    {item.label}
                    </TooltipContent>
                  )}
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>

        {/* Logout */}
        <div className="p-2 border-t border-[#2d4b71]">
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
            onClick={handleLogout}
                  className={cn(
                    "flex items-center h-10 text-sm text-[#8ba1bc] hover:text-white hover:bg-[#234567] w-full transition-colors",
                    isCollapsed ? "px-4 mx-2 rounded-lg justify-center" : "px-3"
                  )}
          >
                  <LogOut className="h-4 w-4 shrink-0" />
                  {!isCollapsed && <span className="ml-2">Logout</span>}
                </button>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={cn(
          "h-full flex flex-col overflow-hidden transition-all duration-300",
          isCollapsed ? "ml-[60px]" : "ml-[240px]"
        )}
      >
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
              <div className="w-64">
                <button className="relative p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </button>
              </div>
              <div className="text-center flex-1">
                <h1 className="text-xl font-semibold text-gray-900">
                  {user.role === 'doctor' ? 'Doctor Dashboard' : 'Receptionist Dashboard'}
                </h1>
                <p className="text-sm text-gray-600">
                  {user.role === 'doctor' 
                    ? 'Manage your patients and appointments' 
                    : 'Manage appointments and patient records'}
                </p>
              </div>
              <div className="w-64 text-right">
                  <p className="text-sm text-gray-900">{date}</p>
                  <p className="text-xs text-gray-500">{time}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
