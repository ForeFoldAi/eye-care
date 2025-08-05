import React, { useState, useEffect } from "react";
import { Outlet } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { authService, type User as AuthUser } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import { cn } from "@/lib/utils";
import { 
  Bell, 
  Heart, 
  Users, 
  Calendar, 
  FileText, 
  Clock, 
  LayoutDashboard, 
  LogOut, 
  PanelLeftClose, 
  PanelLeft,
  Building2,
  MapPin,
  Stethoscope,
  User
} from "lucide-react";
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const API_URL = import.meta.env.VITE_API_URL;

interface HospitalInfo {
  _id: string;
  name: string;
  logo?: string;
  address: string;
  phoneNumber: string;
  email: string;
}

interface BranchInfo {
  _id: string;
  branchName: string;
  branchType: 'main' | 'sub';
  city: string;
  state: string;
  phoneNumber: string;
  email: string;
}

interface DepartmentInfo {
  _id: string;
  name: string;
  description?: string;
}

const doctorMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/doctor/dashboard" },
  { icon: Calendar, label: "Appointments", href: "/doctor/appointments" },
  { icon: Users, label: "Patients", href: "/doctor/patients" },
  { icon: FileText, label: "Prescriptions", href: "/doctor/prescriptions" },
  { icon: Clock, label: "Availability", href: "/doctor/availability" },
];

function DoctorLayoutContent({ user }: { user: AuthUser }) {
  // Initialize isCollapsed from localStorage or default to true
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('sidebar_collapsed');
    return stored ? JSON.parse(stored) : true;
  });

  // Save isCollapsed state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', JSON.stringify(isCollapsed));
  }, [isCollapsed]);

  // Fetch hospital information
  const { data: hospitalInfo, isLoading: hospitalLoading } = useQuery<HospitalInfo>({
    queryKey: ['doctor', 'hospital', user.hospitalId],
    queryFn: async () => {
      if (!user.hospitalId) throw new Error('No hospital assigned');
      const response = await fetch(`${API_URL}/api/hospitals/${user.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch hospital info');
      return response.json();
    },
    enabled: !!user.hospitalId
  });

  // Fetch branch information
  const { data: branchInfo, isLoading: branchLoading } = useQuery<BranchInfo>({
    queryKey: ['doctor', 'branch', user.branchId],
    queryFn: async () => {
      if (!user.branchId) throw new Error('No branch assigned');
      const response = await fetch(`${API_URL}/api/branches/${user.branchId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch branch info');
      return response.json();
    },
    enabled: !!user.branchId
  });

  // Fetch department information (if user has department)
  const { data: departmentInfo, isLoading: departmentLoading } = useQuery<DepartmentInfo>({
    queryKey: ['doctor', 'department', user.department],
    queryFn: async () => {
      if (!user.department) throw new Error('No department assigned');
      const response = await fetch(`${API_URL}/api/departments/${user.department}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch department info');
      return response.json();
    },
    enabled: !!user.department
  });

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
            <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center p-1">
              <img 
                src="/logo.png" 
                alt="Forefold HMS" 
                className="w-full h-full object-contain"
              />
            </div>
            {!isCollapsed && (
              <span className="ml-2 text-base font-semibold text-white">Forefold HMS</span>
            )}
          </div>
        </div>

        {/* Toggle Button */}
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
          <div className="px-3 py-3 border-b border-[#2d4b71]">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-[#1a3b61]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-white truncate">
                    Dr. {user.firstName} {user.lastName}
                  </span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <Stethoscope className="h-3 w-3 text-[#8ba1bc]" />
                  <span className="text-xs text-[#8ba1bc] truncate">
                    {user.specialization || 'General Practice'}
                  </span>
                </div>
                {departmentInfo && (
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs bg-[#2d4b71] border-[#4a6b8a] text-white">
                      {departmentInfo.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-2">
          <TooltipProvider delayDuration={0}>
            {doctorMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = window.location.pathname === item.href;
              
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
        {/* Enhanced Header with Hospital/Branch Info */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left side - Hospital & Branch Info */}
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    {hospitalLoading ? (
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    ) : hospitalInfo ? (
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">
                          {hospitalInfo.name}
                        </h2>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">
                            {branchLoading ? 'Loading...' : branchInfo ? 
                              `${branchInfo.branchName} - ${branchInfo.city}, ${branchInfo.state}` :
                              'No branch assigned'
                            }
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <h2 className="text-sm font-semibold text-gray-900">No Hospital Assigned</h2>
                        <p className="text-xs text-gray-500">Contact administrator</p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Branch Type Badge */}
                {branchInfo && (
                  <Badge 
                    variant={branchInfo.branchType === 'main' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {branchInfo.branchType === 'main' ? 'Main Branch' : 'Sub Branch'}
                  </Badge>
                )}
              </div>

              {/* Center - Page Title */}
              <div className="text-center">
                <h1 className="text-lg font-semibold text-gray-900">Doctor Dashboard</h1>
                <p className="text-xs text-gray-600">Manage your patients and appointments</p>
              </div>

              {/* Right side - Date/Time & Notifications */}
              <div className="flex items-center justify-end space-x-4 min-w-0 flex-1">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{date}</p>
                  <p className="text-xs text-gray-500">{time}</p>
                </div>
                <NotificationBell />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function DoctorLayout() {
  return (
    <ProtectedRoute requiredRole="doctor">
      {(currentUser: AuthUser) => (
        <DoctorLayoutContent user={currentUser} />
      )}
    </ProtectedRoute>
  );
} 