import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { authService } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Clock,
  Receipt,
  Search,
  LogOut,
  UserRound,
  UserRoundCheck
} from "lucide-react";

const doctorMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/doctor" },
  { icon: Calendar, label: "Appointments", href: "/doctor/appointments" },
  { icon: Users, label: "Patients", href: "/doctor/patients" },
  { icon: FileText, label: "Prescriptions", href: "/doctor/prescriptions" },
  { icon: Clock, label: "Availability", href: "/doctor/availability" },
];

const receptionistMenuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/receptionist" },
  { icon: Users, label: "Patients", href: "/receptionist/patients" },
  { icon: Calendar, label: "Appointments", href: "/receptionist/appointments" },
  { icon: Receipt, label: "Payments", href: "/receptionist/payments" },
  { icon: Search, label: "Search", href: "/receptionist/search" },
];

export function Sidebar() {
  const location = useLocation();
  const user = authService.getStoredUser();

  if (!user) return null;

  const menuItems = user.role === ROLES.DOCTOR ? doctorMenuItems : receptionistMenuItems;
  const userIcon = user.role === ROLES.DOCTOR ? UserRound : UserRoundCheck;
  const UserIcon = userIcon;

  const handleLogout = () => {
    authService.logout();
    window.location.href = "/login";
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg border-r">
      <div className="flex flex-col h-full">
        {/* Logo and User Info */}
        <div className="flex items-center px-6 py-4 border-b border-gray-200">
          <div className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            user.role === ROLES.DOCTOR ? "bg-medical-blue" : "bg-medical-green"
          )}>
            <UserIcon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {user.role === ROLES.DOCTOR ? 'Dr.' : ''} {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {user.specialization || user.role.charAt(0).toUpperCase() + user.role.slice(1)}
            </p>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link 
                key={item.href} 
                to={item.href} 
                className="block"
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && user.role === ROLES.DOCTOR && "bg-medical-blue hover:bg-medical-blue",
                    isActive && user.role === ROLES.RECEPTIONIST && "bg-medical-green hover:bg-medical-green"
                  )}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="px-4 py-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-700 hover:bg-gray-100"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
