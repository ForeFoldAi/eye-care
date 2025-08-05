import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Activity,
  BarChart3,
  Calendar,
  UserPlus,
  Stethoscope,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { authService } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWidget } from '@/components/chat/ChatWidget';
import SupportTicketModal from '@/components/SupportTicketModal';
import { useQuery } from '@tanstack/react-query';


interface BranchStats {
  totalPatients: number;
  totalStaff: number;
  totalAppointments: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeDoctors: number;
  activeReceptionists: number;
  bedOccupancy: number;
  patientSatisfaction: number;
  avgWaitTime: number;
  responseRate: number;
  appointmentCompletionRate?: number;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  avatar?: string;
}

interface Activity {
  id: string;
  type: 'appointment' | 'patient' | 'staff' | 'emergency';
  message: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error';
}
const API_URL = import.meta.env.VITE_API_URL; // Use environment variable directly
const SubAdminDashboard: React.FC = () => {
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const user = authService.getStoredUser();
  const navigate = useNavigate();

  const { data: branchStats } = useQuery({
    queryKey: ['branch', 'stats', user?.branchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/${user?.branchId}/stats`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch branch stats');
      return response.json();
    }
  });

  const { data: recentActivities } = useQuery({
    queryKey: ['branch', 'activities', user?.branchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/${user?.branchId}/activities`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    }
  });

  const { data: staffMembers } = useQuery({
    queryKey: ['branch', 'staff', user?.branchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/${user?.branchId}/staff`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch staff');
      return response.json();
    }
  });

  // Add department performance query
  const { data: departmentPerformance } = useQuery({
    queryKey: ['branch', 'departmentPerformance', user?.branchId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/${user?.branchId}/departments/performance`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch department performance');
      return response.json();
    },
    enabled: !!user?.branchId
  });

  // Show loading state while data is being fetched
  if (!branchStats || !recentActivities || !staffMembers) {
    return (
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Add New Patient",
      description: "Register a new patient",
      icon: UserPlus,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "bg-blue-500",
      action: () => navigate({ to: '/sub-admin/patients' }),
    },
    {
      title: "Schedule Appointment",
      description: "Book new appointment",
      icon: Calendar,
      color: "bg-green-50 hover:bg-green-100",
      iconColor: "bg-green-500",
      action: () => navigate({ to: '/sub-admin/appointments' }),
    },
    {
      title: "Staff Management",
      description: "Manage staff members",
      icon: Users,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "bg-purple-500",
      action: () => navigate({ to: '/sub-admin/staff' }),
    },
    {
      title: "View Analytics",
      description: "Branch performance insights",
      icon: BarChart3,
      color: "bg-orange-50 hover:bg-orange-100",
      iconColor: "bg-orange-500",
      action: () => navigate({ to: '/sub-admin/analytics' }),
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'appointment': return Calendar;
      case 'patient': return Users;
      case 'staff': return Stethoscope;
      case 'emergency': return AlertTriangle;
      default: return Activity;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branch Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user?.firstName}! Here's what's happening at your branch today.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => setIsSupportModalOpen(true)}
            className="flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Support
          </Button>
          
          <Badge className="bg-emerald-100 text-emerald-800">
            <Building2 className="w-4 h-4 mr-1" />
            Branch
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{(branchStats.totalPatients || 0).toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">+{branchStats.monthlyGrowth || 0}%</span>
                  <span className="text-sm text-gray-500 ml-1">this month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Staff Members</p>
                <p className="text-2xl font-bold text-gray-900">{branchStats.totalStaff || 0}</p>
                <div className="flex items-center mt-2">
                  <span className="text-sm text-gray-600">
                    {branchStats.activeDoctors || 0} doctors, {branchStats.activeReceptionists || 0} receptionists
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-gray-900">{branchStats.totalAppointments || 0}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    {Math.floor(Math.random() * 20) + 80}% completed
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{(branchStats.totalRevenue || 0).toLocaleString()}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    +{branchStats.monthlyGrowth}%
                  </span>
                  <span className="text-sm text-gray-500 ml-1">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600">₹</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Quick Actions */}
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-blue-600" />
                Quick Actions
              </CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className={`flex flex-col items-center justify-center h-28 rounded-xl shadow group transition-all duration-200 hover:bg-blue-50`}
                    onClick={action.action}
                  >
                    <div className={`w-10 h-10 ${action.iconColor} rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition`}>
                      <action.icon className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-sm text-gray-900 group-hover:text-blue-700">{action.title}</span>
                    <span className="text-xs text-gray-500 text-center">{action.description}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Charts and Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Department Performance</CardTitle>
                <CardDescription>Today's department metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(departmentPerformance || []).map((dept: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">{dept.name || `Department ${index + 1}`}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">{dept.patients || 0} patients</span>
                        <span className="text-xs text-gray-500 ml-2">({dept.utilization || 0}%)</span>
                      </div>
                    </div>
                  ))}
                  {(!departmentPerformance || departmentPerformance.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Building2 className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No department data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Staff Overview</CardTitle>
              <CardDescription>Current staff status and availability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffMembers.map((staff: StaffMember) => (
                  <div key={staff.id} className="flex items-center space-x-3 p-4 border rounded-lg">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={staff.avatar} />
                      <AvatarFallback className="bg-blue-100 text-blue-700">
                        {staff.name?.split(' ').map(n => n[0]).join('') || 'NA'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{staff.name || 'Unknown Staff'}</p>
                      <p className="text-sm text-gray-600">{staff.role || 'Unknown Role'}</p>
                    </div>
                    <Badge variant={staff.status === 'active' ? 'default' : 'secondary'}>
                      {staff.status || 'unknown'}
                    </Badge>
                  </div>
                ))}
                {staffMembers.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No staff members found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates and events</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity: Activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div key={activity.timestamp} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-lg ${getStatusColor(activity.status)} bg-opacity-10`}>
                        <IconComponent className={`w-4 h-4 ${getStatusColor(activity.status)}`} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.message || 'No message available'}</p>
                        <p className="text-xs text-gray-500">{activity.timestamp || 'Unknown time'}</p>
                      </div>
                    </div>
                  );
                })}
                {recentActivities.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Patient Satisfaction</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {(branchStats?.patientSatisfaction / 20).toFixed(1)}/5
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
                <Progress 
                  value={branchStats?.patientSatisfaction || 0} 
                  className="mt-3" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Wait Time</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {branchStats?.avgWaitTime || 0} min
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
                <Progress 
                  value={Math.max(0, 100 - (branchStats?.avgWaitTime || 0))} 
                  className="mt-3" 
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Rate</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {branchStats?.responseRate || 0}%
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={branchStats?.responseRate || 0} className="mt-3" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Support Ticket Modal */}
      <SupportTicketModal 
        isOpen={isSupportModalOpen} 
        onClose={() => setIsSupportModalOpen(false)} 
      />
      
      {/* Chat and Notification Components */}
      <div className="fixed bottom-4 right-4 z-50 flex items-center space-x-2">
        <NotificationBell />
        <ChatWidget />
      </div>
    </div>
  );
};

export default SubAdminDashboard; 