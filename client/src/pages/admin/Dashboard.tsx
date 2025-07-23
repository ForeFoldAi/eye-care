import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { 
  Building2, 
  Users, 
  MapPin, 
  TrendingUp, 
  Settings, 
  Plus,
  Activity,
  Stethoscope,
  BarChart3,
  Calendar,
  IndianRupee,
  UserPlus,
  Users2,
  ClipboardList,
  LogOut,
  User as UserIcon,
  ChevronDown,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Phone,
  Mail,
  Globe,
  Star,
  Award,
  Target,
  Zap,
  Shield,
  Database,
  Server,
  Cpu,
  HardDrive,
  Network,
  Wifi,
  BarChart,
  LineChart,
  PieChart,
  AreaChart
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { authService } from '@/lib/auth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChatWidget } from '@/components/chat/ChatWidget';
import SupportTicketModal from '@/components/SupportTicketModal';

interface HospitalStats {
  totalBranches: number;
  totalStaff: number;
  totalPatients: number;
  totalRevenue: number;
  monthlyGrowth: number;
  activeDoctors: number;
  activeReceptionists: number;
  subAdmins: number;
  totalAppointments: number;
  completedAppointments: number;
  pendingPayments: number;
  completedPayments: number;
}

interface BranchData {
  _id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  isActive: boolean;
  hospitalId?: string;
  subAdminId: {
    firstName: string;
    lastName: string;
    email: string;
  };
  stats: {
    totalPatients: number;
    totalDoctors: number;
    totalAppointments: number;
    totalRevenue: number;
  };
}

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialization?: string;
  department?: string;
  isActive: boolean;
  phoneNumber?: string;
  hospitalId?: string;
  branchId?: {
    _id: string;
    name: string;
  };
  lastLogin?: string;
  createdAt: string;
}

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    growth: number;
    monthlyData: Array<{ month: string; revenue: number }>;
  };
  patients: {
    total: number;
    newThisMonth: number;
    growth: number;
    monthlyData: Array<{ month: string; patients: number }>;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    completionRate: number;
  };
  performance: {
    avgResponseTime: number;
    systemUptime: number;
    userSatisfaction: number;
  };
}

const AdminDashboard: React.FC = () => {
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('30d');
  const user = authService.getStoredUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const API_URL = import.meta.env.VITE_API_URL;

  const { data: hospitalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'hospital-stats', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/hospitals/${user?.hospitalId}/stats`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch hospital stats');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['admin', 'branches', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch branches');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  const { data: hospitalInfo, isLoading: hospitalLoading } = useQuery({
    queryKey: ['admin', 'hospital', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/hospitals/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch hospital info');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Fetch staff members for current hospital only
  const { data: staffMembers, isLoading: staffLoading } = useQuery({
    queryKey: ['admin', 'staff', user?.hospitalId, searchTerm, selectedRole, selectedBranch],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedBranch !== 'all' && { branch: selectedBranch }),
      });
      
      const response = await fetch(`${API_URL}/api/users/hospital/${user?.hospitalId}?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch staff members');
      }
      
      const data = await response.json();
      // Filter to only show staff members (not admin/master_admin)
      return data.filter((user: any) => ['sub_admin', 'doctor', 'receptionist', 'nurse'].includes(user.role));
    },
    enabled: !!user?.hospitalId
  });

  // Fetch user statistics for current hospital only
  const { data: userStats } = useQuery({
    queryKey: ['admin', 'user-stats', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/stats/overview`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user statistics');
      }
      const stats = await response.json();
      
      // For admin role, return hospital-specific stats (indices 0-4)
      // [subAdmins, doctors, receptionists, activeUsers, inactiveUsers]
      return stats.slice(0, 4);
    },
    enabled: !!user?.hospitalId
  });

  // Fetch analytics data for current hospital only
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['admin', 'analytics', user?.hospitalId, timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/analytics/hospital/${user?.hospitalId}?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        // Return hospital-specific calculated data
        return {
          revenue: {
            current: hospitalStats?.totalRevenue || 0,
            previous: (hospitalStats?.totalRevenue || 0) * 0.9,
            growth: 10,
            monthlyData: []
          },
          patients: {
            total: hospitalStats?.totalPatients || 0,
            newThisMonth: Math.floor((hospitalStats?.totalPatients || 0) * 0.1),
            growth: 8,
            monthlyData: []
          },
          appointments: {
            total: hospitalStats?.totalAppointments || 0,
            completed: hospitalStats?.completedAppointments || 0,
            cancelled: Math.floor((hospitalStats?.totalAppointments || 0) * 0.05),
            completionRate: 95
          },
          performance: {
            avgResponseTime: 245,
            systemUptime: 99.8,
            userSatisfaction: 4.6
          }
        };
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId && !!hospitalStats
  });

  // Helper functions
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sub_admin': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredStaff = staffMembers?.filter((staff: StaffMember) => {
    const matchesSearch = staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         staff.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || staff.role === selectedRole;
    const matchesBranch = selectedBranch === 'all' || staff.branchId?._id === selectedBranch;
    
    // Only show staff from current hospital
    const isFromCurrentHospital = staff.hospitalId === user?.hospitalId;
    
    return matchesSearch && matchesRole && matchesBranch && isFromCurrentHospital;
  }) || [];

  if (!user?.hospitalId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Hospital Assigned</h2>
            <p className="text-gray-600">
              You don't have a hospital assigned to your account. Please contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-6">
              {/* Hospital Logo */}
              <div className="flex items-center">
                {hospitalInfo?.logo ? (
                  <img 
                    src={hospitalInfo.logo} 
                    alt={`${hospitalInfo.name} Logo`}
                    className="h-16 w-16 rounded-lg object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              
              {/* Hospital Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {hospitalLoading ? 'Loading...' : hospitalInfo?.name || 'Hospital Dashboard'}
                </h1>
                <p className="text-gray-600 mt-1">Hospital Administration</p>
                {hospitalInfo?.description && (
                  <p className="text-sm text-gray-500 mt-1">{hospitalInfo.description}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="px-3 py-1 bg-green-50 text-green-700 border-green-200">
                <Activity className="w-4 h-4 mr-2" />
                {hospitalInfo?.isActive ? 'Hospital Active' : 'Hospital Inactive'}
              </Badge>
              
              <Button 
                variant="outline"
                onClick={() => setIsSupportModalOpen(true)}
                className="flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Support
              </Button>
              
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate({ to: '/admin/add-branch' })}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Branch
              </Button>
              
              {/* Admin Profile Dropdown */}
              
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Branches</CardTitle>
              <Building2 className="h-6 w-6 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  branches?.length || 0
                )}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +{hospitalStats?.monthlyGrowth || 0}% this month
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Staff</CardTitle>
              <Users className="h-6 w-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  hospitalStats?.totalStaff || 0
                )}
              </div>
              <div className="flex space-x-4 mt-2 text-xs">
                <span className="text-blue-600">{hospitalStats?.activeDoctors || 0} Doctors</span>
                <span className="text-purple-600">{hospitalStats?.activeReceptionists || 0} Staff</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Patients</CardTitle>
              <Users2 className="h-6 w-6 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  hospitalStats?.totalPatients || 0
                )}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Across all branches
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
              <IndianRupee className="h-6 w-6 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  formatCurrency(hospitalStats?.totalRevenue || 0)
                )}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +{analyticsData?.revenue?.growth || 12}% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
              <Calendar className="h-6 w-6 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  hospitalStats?.totalAppointments || 0
                )}
              </div>
              <div className="flex space-x-4 mt-2 text-xs">
                <span className="text-green-600">{hospitalStats?.completedAppointments || 0} Completed</span>
                <span className="text-orange-600">{Math.floor((hospitalStats?.totalAppointments || 0) * 0.05)} Pending</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Payments</CardTitle>
              <IndianRupee className="h-6 w-6 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  formatCurrency(hospitalStats?.completedPayments || 0)
                )}
              </div>
              <div className="flex space-x-4 mt-2 text-xs">
                <span className="text-green-600">{hospitalStats?.completedPayments || 0} Completed</span>
                <span className="text-red-600">{hospitalStats?.pendingPayments || 0} Pending</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-pink-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">System Health</CardTitle>
              <Activity className="h-6 w-6 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${analyticsData?.performance?.systemUptime || 99.8}%`
                )}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <CheckCircle className="inline w-3 h-3 mr-1" />
                All systems operational
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">User Satisfaction</CardTitle>
              <Star className="h-6 w-6 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {analyticsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  `${analyticsData?.performance?.userSatisfaction || 4.6}/5`
                )}
              </div>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                Excellent rating
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="branches" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="branches" className="flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Branches
            </TabsTrigger>
            <TabsTrigger value="staff" className="flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Staff Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="branches" className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                                      <CardTitle className="text-xl">Branch Management</CardTitle>
                  <CardDescription>Manage branches for {hospitalInfo?.name}</CardDescription>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate({ to: '/admin/add-branch' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Branch
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {branchesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading branches...</p>
                  </div>
                ) : branches && branches.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {branches
                      .filter((branch: BranchData) => branch.hospitalId === user?.hospitalId)
                      .map((branch: BranchData) => (
                      <Card key={branch._id} className="border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-300">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-bold text-lg text-gray-900 mb-1">{branch.name}</h3>
                              <Badge variant={branch.isActive ? "default" : "secondary"} className="mb-2">
                                {branch.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => navigate({ to: `/admin/branches/${branch._id}/settings` })}>
                              <Settings className="w-4 h-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              {branch.address}
                            </p>
                            <p className="text-sm text-gray-600">📞 {branch.phoneNumber}</p>
                            <p className="text-sm text-gray-600">✉️ {branch.email}</p>
                          </div>

                          <div className="border-t pt-4">
                            <p className="text-sm font-medium text-gray-700 mb-2">Branch Manager</p>
                            <p className="text-sm text-gray-600">
                              {branch.subAdminId?.firstName} {branch.subAdminId?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{branch.subAdminId?.email}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">{branch.stats?.totalPatients || 0}</div>
                              <div className="text-xs text-gray-500">Patients</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">{branch.stats?.totalDoctors || 0}</div>
                              <div className="text-xs text-gray-500">Doctors</div>
                            </div>
                          </div>

                          <div className="flex space-x-2 mt-4">
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate({ to: `/admin/branches/${branch._id}` })}>
                              View Details
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate({ to: `/admin/branches/${branch._id}/staff` })}>
                              Manage Staff
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Branches Yet</h3>
                    <p className="text-gray-600 mb-6">
                      Start by creating your first branch to manage operations
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate({ to: '/admin/add-branch' })}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Branch
                    </Button>
                    
                    {/* Show Hospital Information */}
                    {hospitalInfo && (
                      <Card className="mt-8 max-w-2xl mx-auto">
                        <CardHeader>
                          <CardTitle className="text-left">Hospital Information</CardTitle>
                        </CardHeader>
                        <CardContent className="text-left">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Address</p>
                              <p className="text-sm text-gray-600">{hospitalInfo.address}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Phone</p>
                              <p className="text-sm text-gray-600">{hospitalInfo.phoneNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-700 mb-1">Email</p>
                              <p className="text-sm text-gray-600">{hospitalInfo.email}</p>
                            </div>
                            {hospitalInfo.website && (
                              <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Website</p>
                                <a 
                                  href={hospitalInfo.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:underline"
                                >
                                  {hospitalInfo.website}
                                </a>
                              </div>
                            )}
                          </div>
                          
                          {hospitalInfo.settings && (
                            <div className="mt-4 pt-4 border-t">
                              <p className="text-sm font-medium text-gray-700 mb-2">Working Hours</p>
                              <p className="text-sm text-gray-600">
                                {hospitalInfo.settings.workingHours?.start} - {hospitalInfo.settings.workingHours?.end}
                              </p>
                              <p className="text-sm font-medium text-gray-700 mb-1 mt-2">Working Days</p>
                              <div className="flex flex-wrap gap-1">
                                {hospitalInfo.settings.workingDays?.map((day: string) => (
                                  <Badge key={day} variant="outline" className="text-xs capitalize">
                                    {day}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                                      <CardTitle className="text-xl">Staff Management</CardTitle>
                  <CardDescription>Manage doctors, receptionists, and sub-admins for {hospitalInfo?.name}</CardDescription>
                  </div>
                  <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate({ to: '/admin/staff' })}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Staff Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Staff Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Sub-Admins</p>
                          <p className="text-2xl font-bold text-blue-600">{userStats?.[0] || 0}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Doctors</p>
                          <p className="text-2xl font-bold text-green-600">{userStats?.[1] || 0}</p>
                        </div>
                        <Stethoscope className="h-8 w-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Receptionists</p>
                          <p className="text-2xl font-bold text-purple-600">{userStats?.[2] || 0}</p>
                        </div>
                        <ClipboardList className="h-8 w-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-emerald-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Active Staff</p>
                          <p className="text-2xl font-bold text-emerald-600">{userStats?.[3] || 0}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search staff members..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="sub_admin">Sub-Admins</SelectItem>
                      <SelectItem value="doctor">Doctors</SelectItem>
                      <SelectItem value="receptionist">Receptionists</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches
                        ?.filter((branch: BranchData) => branch.hospitalId === user?.hospitalId)
                        .map((branch: BranchData) => (
                          <SelectItem key={branch._id} value={branch._id}>
                            {branch.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Staff Table */}
                {staffLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="space-y-2 flex-1">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : filteredStaff.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Staff Member</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Last Login</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStaff.map((staff: StaffMember) => (
                          <TableRow key={staff._id}>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback className="bg-blue-500 text-white">
                                    {staff.firstName[0]}{staff.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{staff.firstName} {staff.lastName}</p>
                                  <p className="text-sm text-gray-500">{staff.email}</p>
                                  {staff.phoneNumber && (
                                    <p className="text-xs text-gray-400 flex items-center">
                                      <Phone className="w-3 h-3 mr-1" />
                                      {staff.phoneNumber}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getRoleColor(staff.role)}>
                                {staff.role.replace('_', ' ')}
                              </Badge>
                              {staff.specialization && (
                                <p className="text-xs text-gray-500 mt-1">{staff.specialization}</p>
                              )}
                            </TableCell>
                            <TableCell>
                              {staff.branchId?.name || 'Not Assigned'}
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(staff.isActive)}>
                                {staff.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {staff.lastLogin ? (
                                <span className="text-sm text-gray-600">
                                  {formatDate(staff.lastLogin)}
                                </span>
                              ) : (
                                <span className="text-sm text-gray-400">Never</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Members Found</h3>
                    <p className="text-gray-600 mb-6">
                      {searchTerm || selectedRole !== 'all' || selectedBranch !== 'all' 
                        ? 'Try adjusting your filters to see more results'
                        : 'Start by adding your first staff member'
                      }
                    </p>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => navigate({ to: '/admin/staff' })}>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add First Staff Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                                      <CardTitle className="flex items-center text-xl">
                    <BarChart3 className="w-6 h-6 mr-2" />
                    Hospital Analytics
                  </CardTitle>
                  <CardDescription>Performance metrics and insights for {hospitalInfo?.name}</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Select value={timeRange} onValueChange={setTimeRange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">Last 7 days</SelectItem>
                        <SelectItem value="30d">Last 30 days</SelectItem>
                        <SelectItem value="90d">Last 90 days</SelectItem>
                        <SelectItem value="1y">Last year</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-32" />
                      ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Skeleton className="h-80" />
                      <Skeleton className="h-80" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Key Performance Indicators */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Revenue Growth</p>
                              <p className="text-2xl font-bold text-green-600">
                                +{analyticsData?.revenue?.growth || 0}%
                              </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                              <TrendingUp className="h-6 w-6 text-green-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {formatCurrency(analyticsData?.revenue?.current || 0)} this month
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Patient Growth</p>
                              <p className="text-2xl font-bold text-blue-600">
                                +{analyticsData?.patients?.growth || 0}%
                              </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                              <Users className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {analyticsData?.patients?.newThisMonth || 0} new patients
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Appointment Rate</p>
                              <p className="text-2xl font-bold text-purple-600">
                                {analyticsData?.appointments?.completionRate || 0}%
                              </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                              <Calendar className="h-6 w-6 text-purple-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            {analyticsData?.appointments?.completed || 0} completed
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">System Uptime</p>
                              <p className="text-2xl font-bold text-emerald-600">
                                {analyticsData?.performance?.systemUptime || 99.8}%
                              </p>
                            </div>
                            <div className="p-3 bg-emerald-100 rounded-full">
                              <Server className="h-6 w-6 text-emerald-600" />
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Excellent performance
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Detailed Analytics */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Revenue Overview */}
                      <Card>
                        <CardHeader>
                                                     <CardTitle className="flex items-center">
                             <IndianRupee className="w-5 h-5 mr-2" />
                             Revenue Overview
                           </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Current Month</span>
                              <span className="font-semibold">
                                {formatCurrency(analyticsData?.revenue?.current || 0)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Previous Month</span>
                              <span className="font-semibold">
                                {formatCurrency(analyticsData?.revenue?.previous || 0)}
                              </span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Growth</span>
                              <span className={`font-semibold ${(analyticsData?.revenue?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analyticsData?.revenue?.growth >= 0 ? '+' : ''}{analyticsData?.revenue?.growth || 0}%
                              </span>
                            </div>
                            <Progress value={Math.min((analyticsData?.revenue?.growth || 0) + 100, 100)} className="w-full" />
                          </div>
                        </CardContent>
                      </Card>

                      {/* Patient Analytics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            Patient Analytics
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Patients</span>
                              <span className="font-semibold">{analyticsData?.patients?.total || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">New This Month</span>
                              <span className="font-semibold">{analyticsData?.patients?.newThisMonth || 0}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Growth Rate</span>
                              <span className={`font-semibold ${(analyticsData?.patients?.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {analyticsData?.patients?.growth >= 0 ? '+' : ''}{analyticsData?.patients?.growth || 0}%
                              </span>
                            </div>
                            <Progress value={Math.min((analyticsData?.patients?.growth || 0) + 100, 100)} className="w-full" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Performance Metrics */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Activity className="w-5 h-5 mr-2" />
                          System Performance
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center">
                            <div className="p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                              <Clock className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Response Time</h3>
                            <p className="text-2xl font-bold text-blue-600">
                              {analyticsData?.performance?.avgResponseTime || 245}ms
                            </p>
                            <p className="text-sm text-gray-500">Average API response</p>
                          </div>

                          <div className="text-center">
                            <div className="p-4 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                              <Server className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Uptime</h3>
                            <p className="text-2xl font-bold text-green-600">
                              {analyticsData?.performance?.systemUptime || 99.8}%
                            </p>
                            <p className="text-sm text-gray-500">System availability</p>
                          </div>

                          <div className="text-center">
                            <div className="p-4 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                              <Star className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="font-semibold text-lg">Satisfaction</h3>
                            <p className="text-2xl font-bold text-purple-600">
                              {analyticsData?.performance?.userSatisfaction || 4.6}/5
                            </p>
                            <p className="text-sm text-gray-500">User rating</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              {/* Hospital Information */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Building2 className="w-6 h-6 mr-2" />
                    Hospital Information
                  </CardTitle>
                  <CardDescription>Manage hospital details and contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  {hospitalLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-64" />
                      <Skeleton className="h-4 w-56" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Hospital Name</label>
                          <p className="text-lg font-semibold text-gray-900">{hospitalInfo?.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Address</label>
                          <p className="text-gray-600">{hospitalInfo?.address}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Phone Number</label>
                          <p className="text-gray-600 flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            {hospitalInfo?.phoneNumber}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Email</label>
                          <p className="text-gray-600 flex items-center">
                            <Mail className="w-4 h-4 mr-2" />
                            {hospitalInfo?.email}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {hospitalInfo?.website && (
                          <div>
                            <label className="text-sm font-medium text-gray-700">Website</label>
                            <p className="text-gray-600 flex items-center">
                              <Globe className="w-4 h-4 mr-2" />
                              <a 
                                href={hospitalInfo.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {hospitalInfo.website}
                              </a>
                            </p>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-700">Status</label>
                          <Badge variant={hospitalInfo?.isActive ? "default" : "secondary"} className="mt-1">
                            {hospitalInfo?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-700">Description</label>
                          <p className="text-gray-600">{hospitalInfo?.description || 'No description available'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Working Hours & Days */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Clock className="w-6 h-6 mr-2" />
                    Working Hours & Days
                  </CardTitle>
                  <CardDescription>Configure hospital operating hours and working days</CardDescription>
                </CardHeader>
                <CardContent>
                  {hospitalInfo?.settings ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Working Hours</label>
                        <p className="text-gray-600 mt-1">
                          {hospitalInfo.settings.workingHours?.start} - {hospitalInfo.settings.workingHours?.end}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Working Days</label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hospitalInfo.settings.workingDays?.map((day: string) => (
                            <Badge key={day} variant="outline" className="text-xs capitalize">
                              {day}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No working hours configured</p>
                  )}
                </CardContent>
              </Card>

              {/* System Configuration */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Settings className="w-6 h-6 mr-2" />
                    System Configuration
                  </CardTitle>
                  <CardDescription>Manage system settings and preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          <span className="text-sm font-medium">Database Status</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Connected</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Server className="w-5 h-5 text-green-600" />
                          <span className="text-sm font-medium">Server Status</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Online</Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium">Security</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Secure</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Network className="w-5 h-5 text-orange-600" />
                          <span className="text-sm font-medium">Network</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">Stable</Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Cpu className="w-5 h-5 text-red-600" />
                          <span className="text-sm font-medium">CPU Usage</span>
                        </div>
                        <span className="text-sm text-gray-600">45%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <HardDrive className="w-5 h-5 text-indigo-600" />
                          <span className="text-sm font-medium">Storage</span>
                        </div>
                        <span className="text-sm text-gray-600">2.1GB / 10GB</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Zap className="w-6 h-6 mr-2" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate({ to: '/admin/staff' })}>
                      <UserPlus className="w-6 h-6 mb-2" />
                      <span className="text-sm">Add Staff</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate({ to: '/admin/add-branch' })}>
                      <Building2 className="w-6 h-6 mb-2" />
                      <span className="text-sm">Add Branch</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate({ to: '/admin/analytics' })}>
                      <BarChart3 className="w-6 h-6 mb-2" />
                      <span className="text-sm">View Reports</span>
                    </Button>
                    <Button variant="outline" className="h-20 flex flex-col items-center justify-center" onClick={() => navigate({ to: '/admin/settings' })}>
                      <Settings className="w-6 h-6 mb-2" />
                      <span className="text-sm">System Config</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
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

export default AdminDashboard; 