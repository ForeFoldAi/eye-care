import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { authService, User } from "@/lib/auth";
import { 
  Heart, 
  BarChart3, 
  Calendar, 
  Users, 
  FileText, 
  Clock,
  Receipt,
  LogOut,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface LayoutProps {
  children: ReactNode;
  user: User;
}

export default function Layout({ children, user }: LayoutProps) {
  const [location] = useLocation();

  const handleLogout = () => {
    authService.logout();
    window.location.href = '/';
  };

  const isDoctorRoute = location.startsWith('/doctor');
  const isReceptionistRoute = location.startsWith('/receptionist');

  const doctorNavItems = [
    { href: '/doctor', icon: BarChart3, label: 'Dashboard' },
    { href: '/doctor/appointments', icon: Calendar, label: 'Appointments' },
    { href: '/doctor/patients', icon: Users, label: 'Patients' },
    { href: '/doctor/prescriptions', icon: FileText, label: 'Prescriptions' },
    { href: '/doctor/availability', icon: Clock, label: 'Availability' },
  ];

  const receptionistNavItems = [
    { href: '/receptionist', icon: BarChart3, label: 'Dashboard' },
    { href: '/receptionist/patients', icon: Users, label: 'Patients' },
    { href: '/receptionist/appointments', icon: Calendar, label: 'Appointments' },
    { href: '/receptionist/payments', icon: Receipt, label: 'Payments' },
  ];

  const navItems = isDoctorRoute ? doctorNavItems : receptionistNavItems;

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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-30">
        <div className="flex items-center h-16 px-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-medical-blue-500 rounded-lg flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="ml-3 text-lg font-semibold text-gray-900">HealthCare</span>
          </div>
        </div>

        <nav className="mt-6">
          <div className="px-6 mb-6">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                user.role === 'doctor' ? 'bg-medical-blue-100' : 'bg-medical-green-100'
              }`}>
                <Users className={`w-5 h-5 ${
                  user.role === 'doctor' ? 'text-medical-blue-600' : 'text-medical-green-600'
                }`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {user.role === 'doctor' ? 'Dr. ' : ''}{user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {user.specialization || user.role}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-1 px-3">
            {navItems.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;
              
              return (
                <Link key={item.href} href={item.href}>
                  <a className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-medical-blue-50 text-medical-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}>
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-0 w-full p-4">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600 hover:text-gray-900"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {user.role === 'doctor' ? 'Doctor Dashboard' : 'Receptionist Dashboard'}
                </h1>
                <p className="text-gray-600">
                  {user.role === 'doctor' 
                    ? 'Manage your patients and appointments' 
                    : 'Manage patients and appointments'
                  }
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" className="relative p-2">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400"></span>
                </Button>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{date}</p>
                  <p className="text-xs text-gray-500">{time}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
