import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
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
  branchName: string;
  branchType?: 'main' | 'sub';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phoneNumber: string;
  email: string;
  alternatePhone?: string;
  googleMapLink?: string;
  isActive: boolean;
  hospitalId: {
    _id: string;
    name: string;
  } | string;
  subAdminId: {
    _id: string;
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
  hospitalId?: string | {
    _id: string;
    name: string;
  };
  branchId?: {
    _id: string;
    branchName: string;
  };
  lastLogin?: string;
  createdAt: string;
  avatar?: string;
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchData | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [branchToView, setBranchToView] = useState<BranchData | null>(null);
  const [isStaffViewModalOpen, setIsStaffViewModalOpen] = useState(false);
  const [staffToView, setStaffToView] = useState<StaffMember | null>(null);
  const [isStaffEditModalOpen, setIsStaffEditModalOpen] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<StaffMember | null>(null);
  const [isStaffDeleteModalOpen, setIsStaffDeleteModalOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<StaffMember | null>(null);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [staffForActivity, setStaffForActivity] = useState<StaffMember | null>(null);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<{ type: 'branch' | 'staff', data: BranchData | StaffMember } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const user = authService.getStoredUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const API_URL = import.meta.env.VITE_API_URL;

  // Delete branch mutation
  const deleteBranchMutation = useMutation({
    mutationFn: async (branchId: string) => {
      const response = await fetch(`${API_URL}/api/branches/${branchId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete branch');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Error deleting branch:', error);
      // You can add toast notification here
    }
  });

  // Update branch mutation
  const updateBranchMutation = useMutation({
    mutationFn: async (branchData: BranchData) => {
      // Prepare the data for the API, only including fields that can be updated
      const updateData = {
        branchName: branchData.branchName,
        branchType: branchData.branchType || 'sub',
        email: branchData.email,
        phoneNumber: branchData.phoneNumber,
        alternatePhone: branchData.alternatePhone,
        country: branchData.country,
        state: branchData.state,
        city: branchData.city,
        addressLine1: branchData.addressLine1,
        addressLine2: branchData.addressLine2,
        postalCode: branchData.postalCode,
        googleMapLink: branchData.googleMapLink,
        isActive: branchData.isActive,
        // Ensure hospitalId is a string
        hospitalId: typeof branchData.hospitalId === 'string' 
          ? branchData.hospitalId 
          : branchData.hospitalId?._id || user?.hospitalId
      };

      const response = await fetch(`${API_URL}/api/branches/${branchData._id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update branch');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      setIsEditModalOpen(false);
      setBranchToEdit(null);
    },
    onError: (error: Error) => {
      console.error('Error updating branch:', error);
      // You can add toast notification here
    }
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await fetch(`${API_URL}/api/users/${staffId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete staff member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setIsStaffDeleteModalOpen(false);
      setStaffToDelete(null);
    },
    onError: (error: Error) => {
      console.error('Error deleting staff member:', error);
      // You can add toast notification here
    }
  });

  // Action handlers
  const handleViewDetails = (branch: BranchData) => {
    setBranchToView(branch);
    setIsViewModalOpen(true);
  };

  // Fetch single branch details
  const { data: singleBranchData, refetch: refetchBranch, isLoading: singleBranchLoading } = useQuery({
    queryKey: ['branch', branchToView?._id],
    queryFn: async () => {
      if (!branchToView?._id) return null;
      
      const response = await fetch(`${API_URL}/api/branches/${branchToView._id}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch branch details');
      }
      
      return response.json();
    },
    enabled: !!branchToView?._id && isViewModalOpen
  });

  const handleManageStaff = (branch: BranchData) => {
    navigate({ to: `/admin/branches/${branch._id}/staff` });
  };

  const handleSettings = (branch: BranchData) => {
    navigate({ to: `/admin/branches/${branch._id}/settings` });
  };

  const handleEditBranch = (branch: BranchData) => {
    setBranchToEdit(branch);
    setIsEditModalOpen(true);
  };

  const handleDeleteBranch = (branch: BranchData) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBranch = () => {
    if (branchToDelete) {
      deleteBranchMutation.mutate(branchToDelete._id);
    }
  };

  // Staff action handlers
  const handleViewStaffDetails = (staff: StaffMember) => {
    setStaffToView(staff);
    setIsStaffViewModalOpen(true);
  };

  const handleEditStaff = (staff: StaffMember) => {
    setStaffToEdit(staff);
    setIsStaffEditModalOpen(true);
  };

  const handleDeleteStaff = (staff: StaffMember) => {
    setStaffToDelete(staff);
    setIsStaffDeleteModalOpen(true);
  };

  const handleViewStaffActivity = (staff: StaffMember) => {
    setStaffForActivity(staff);
    setIsActivityModalOpen(true);
  };

  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      deleteStaffMutation.mutate(staffToDelete._id);
    }
  };

  // Message handlers
  const handleSendMessage = (type: 'branch' | 'staff', data: BranchData | StaffMember) => {
    setMessageRecipient({ type, data });
    setIsMessageModalOpen(true);
  };

  const sendMessage = async () => {
    if (!messageRecipient || !messageText.trim()) return;

    setIsSendingMessage(true);
    try {
      let endpoint = '';
      let body: any = { message: messageText };

      if (messageRecipient.type === 'branch') {
        const branch = messageRecipient.data as BranchData;
        endpoint = `${API_URL}/api/notifications/send-branch-message`;
        body.branchId = branch._id;
      } else {
        const staff = messageRecipient.data as StaffMember;
        endpoint = `${API_URL}/api/notifications/send-user-message`;
        body.userId = staff._id;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Success - close modal and reset
      setIsMessageModalOpen(false);
      setMessageRecipient(null);
      setMessageText('');
      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const { data: hospitalStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'hospital-stats', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/hospitals/${user?.hospitalId}/stats`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch hospital stats');
      }
      const data = await response.json();
      console.log('Hospital Stats API Response:', data);
      return data;
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


  // Fetch staff members for current hospital only
  const { data: staffMembers, isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ['admin', 'staff', user?.hospitalId, searchTerm, selectedRole, selectedBranch],
    queryFn: async () => {
      console.log('Fetching staff members for hospital:', user?.hospitalId);
      
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedBranch !== 'all' && { branch: selectedBranch }),
      });
      
      const response = await fetch(`${API_URL}/api/users/hospital/${user?.hospitalId}?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`Failed to fetch staff members: ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Raw staff data:', data);
      
      // Filter to only show staff members (not admin/master_admin) and include branch information
      const filteredData = data.filter((user: any) => ['sub_admin', 'doctor', 'receptionist', 'nurse', 'patient'].includes(user.role));
      console.log('Filtered staff data:', filteredData);
      
      // Log branch information for debugging
      filteredData.forEach((user: any, index: number) => {
        console.log(`User ${index + 1}:`, {
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          branchId: user.branchId,
          branchName: user.branchId?.branchName,
          hospitalId: user.hospitalId
        });
      });
      
      return filteredData;
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
      const response = await fetch(`${API_URL}/api/analytics?hospitalId=${user?.hospitalId}&timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        // Return hospital-specific calculated data as fallback
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
      
      const data = await response.json();
      
      // Transform the analytics data to match our expected format
      return {
        revenue: {
          current: data.overview?.totalRevenue || 0,
          previous: (data.overview?.totalRevenue || 0) * 0.9,
          growth: 10,
          monthlyData: data.revenueChart?.data || []
        },
        patients: {
          total: data.overview?.totalPatients || 0,
          newThisMonth: Math.floor((data.overview?.totalPatients || 0) * 0.1),
          growth: 8,
          monthlyData: data.patientChart?.data || []
        },
        appointments: {
          total: data.overview?.totalAppointments || 0,
          completed: Math.floor((data.overview?.totalAppointments || 0) * 0.95),
          cancelled: Math.floor((data.overview?.totalAppointments || 0) * 0.05),
          completionRate: 95
        },
        performance: {
          avgResponseTime: data.overview?.averageWaitTime || 245,
          systemUptime: 99.8,
          userSatisfaction: data.overview?.patientSatisfaction || 4.6
        }
      };
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
      case 'patient': return 'bg-indigo-100 text-indigo-800';
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
    
    // Only show staff from current hospital (handle both string and object types)
    const staffHospitalId = typeof staff.hospitalId === 'string' 
      ? staff.hospitalId 
      : staff.hospitalId?._id;
    const isFromCurrentHospital = staffHospitalId === user?.hospitalId;
    
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
     

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics - Primary Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <Card 
            className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-blue-500 cursor-pointer hover:bg-blue-50"
            onClick={() => navigate({ to: '/admin/branches' })}
          >
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

          <Card 
            className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-green-500 cursor-pointer hover:bg-green-50"
            onClick={() => navigate({ to: '/admin/staff' })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Staff</CardTitle>
              <Users className="h-6 w-6 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  filteredStaff.length || hospitalStats?.totalStaff || 0
                )}
              </div>
              <div className="flex space-x-4 mt-2 text-xs">
                <span className="text-blue-600">{filteredStaff.filter((s: StaffMember) => s.role === 'doctor').length} Doctors</span>
                <span className="text-purple-600">{filteredStaff.filter((s: StaffMember) => s.role === 'receptionist').length} Staff</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-purple-500 cursor-pointer hover:bg-purple-50"
            onClick={() => navigate({ to: '/admin/analytics' })}
          >
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
        </div>

        {/* Secondary Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-indigo-500 cursor-pointer hover:bg-indigo-50"
            onClick={() => navigate({ to: '/admin/doctor-availability' })}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Doctors</CardTitle>
              <Stethoscope className="h-6 w-6 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">
                {statsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  filteredStaff.filter((s: StaffMember) => s.role === 'doctor').length || hospitalStats?.activeDoctors || 0
                )}
              </div>
              <div className="flex space-x-4 mt-2 text-xs">
                <span className="text-green-600">{filteredStaff.filter((s: StaffMember) => s.role === 'doctor' && s.isActive).length} Active</span>
                <span className="text-blue-600">Across all branches</span>
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-yellow-500 cursor-pointer hover:bg-yellow-50"
            onClick={() => navigate({ to: '/admin/financial' })}
          >
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

          <Card 
            className="bg-white shadow-sm hover:shadow-lg transition-shadow border-l-4 border-l-cyan-500 cursor-pointer hover:bg-cyan-50"
            onClick={() => navigate({ to: '/admin/analytics' })}
          >
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


        

        {/* Quick Actions Section */}
        <div className="mb-8">
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
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-blue-50 hover:border-blue-200 transition-colors" onClick={() => navigate({ to: '/admin/staff' })}>
                  <UserPlus className="w-6 h-6 mb-2 text-blue-600" />
                  <span className="text-sm font-medium">Add Staff</span>
                    </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-green-50 hover:border-green-200 transition-colors" onClick={() => navigate({ to: '/admin/add-branch' })}>
                  <Building2 className="w-6 h-6 mb-2 text-green-600" />
                  <span className="text-sm font-medium">Add Branch</span>
                    </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition-colors" onClick={() => navigate({ to: '/admin/analytics' })}>
                  <BarChart3 className="w-6 h-6 mb-2 text-purple-600" />
                  <span className="text-sm font-medium">View Reports</span>
                    </Button>
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center hover:bg-orange-50 hover:border-orange-200 transition-colors" onClick={() => navigate({ to: '/admin/settings' })}>
                  <Settings className="w-6 h-6 mb-2 text-orange-600" />
                  <span className="text-sm font-medium">System Config</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          
        
      </div>
      
      {/* Send Message Modal */}
      {isMessageModalOpen && messageRecipient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Send Message</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsMessageModalOpen(false);
                  setMessageRecipient(null);
                  setMessageText('');
                }}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Recipient Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Sending to:</h4>
                {messageRecipient.type === 'branch' ? (
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {(messageRecipient.data as BranchData).branchName}
                      </p>
                      <p className="text-sm text-gray-600">Branch • All staff members</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={`text-white ${
                        (messageRecipient.data as StaffMember).role === 'doctor' ? 'bg-blue-500' :
                        (messageRecipient.data as StaffMember).role === 'nurse' ? 'bg-green-500' :
                        (messageRecipient.data as StaffMember).role === 'receptionist' ? 'bg-purple-500' :
                        (messageRecipient.data as StaffMember).role === 'sub_admin' ? 'bg-orange-500' :
                        (messageRecipient.data as StaffMember).role === 'patient' ? 'bg-indigo-500' : 'bg-gray-500'
                      }`}>
                        {(messageRecipient.data as StaffMember).firstName[0]}{(messageRecipient.data as StaffMember).lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900">
                        {(messageRecipient.data as StaffMember).firstName} {(messageRecipient.data as StaffMember).lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {(messageRecipient.data as StaffMember).role.replace('_', ' ')} • {(messageRecipient.data as StaffMember).email}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message here..."
                  className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isSendingMessage}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {messageText.length}/1000 characters
                </p>
              </div>

              {/* Message Type Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">Message Type:</p>
                    {messageRecipient.type === 'branch' ? (
                      <p>This message will be sent to all staff members in the branch.</p>
                    ) : (
                      <p>This message will be sent directly to the staff member.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMessageModalOpen(false);
                  setMessageRecipient(null);
                  setMessageText('');
                }}
                disabled={isSendingMessage}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={sendMessage}
                disabled={!messageText.trim() || isSendingMessage}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isSendingMessage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff View Details Modal */}
      {isStaffViewModalOpen && staffToView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Staff Member Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsStaffViewModalOpen(false);
                  setStaffToView(null);
                }}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                      {staffToView.firstName} {staffToView.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded border">{staffToView.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <div className="bg-gray-50 p-2 rounded border">
                      <Badge className={getRoleColor(staffToView.role)}>
                        {staffToView.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <div className="bg-gray-50 p-2 rounded border">
                      <Badge className={getStatusColor(staffToView.isActive)}>
                        {staffToView.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                  {staffToView.phoneNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <p className="text-gray-900 bg-gray-50 p-2 rounded border">{staffToView.phoneNumber}</p>
                    </div>
                  )}
                  {staffToView.specialization && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <p className="text-gray-900 bg-gray-50 p-2 rounded border">{staffToView.specialization}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Branch Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Branch</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                      {staffToView.branchId?.branchName || 'Not Assigned'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                      {staffToView.department || 'General'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Activity Information */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Activity Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Login</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                      {staffToView.lastLogin ? formatDate(staffToView.lastLogin) : 'Never'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Since</label>
                    <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                      {formatDate(staffToView.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStaffViewModalOpen(false);
                  setStaffToView(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsStaffViewModalOpen(false);
                  setStaffToView(null);
                  setStaffToEdit(staffToView);
                  setIsStaffEditModalOpen(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Edit Modal */}
      {isStaffEditModalOpen && staffToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Staff Member</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsStaffEditModalOpen(false);
                  setStaffToEdit(null);
                }}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <Input
                    value={staffToEdit.firstName}
                    onChange={(e) => setStaffToEdit({...staffToEdit, firstName: e.target.value})}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <Input
                    value={staffToEdit.lastName}
                    onChange={(e) => setStaffToEdit({...staffToEdit, lastName: e.target.value})}
                    placeholder="Last name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={staffToEdit.email}
                    onChange={(e) => setStaffToEdit({...staffToEdit, email: e.target.value})}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    value={staffToEdit.phoneNumber || ''}
                    onChange={(e) => setStaffToEdit({...staffToEdit, phoneNumber: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <Select 
                    value={staffToEdit.role} 
                    onValueChange={(value) => setStaffToEdit({...staffToEdit, role: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sub_admin">Sub-Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="patient">Patient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <Input
                    value={staffToEdit.specialization || ''}
                    onChange={(e) => setStaffToEdit({...staffToEdit, specialization: e.target.value})}
                    placeholder="Specialization"
                  />
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={staffToEdit.isActive}
                  onChange={(e) => setStaffToEdit({...staffToEdit, isActive: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Staff member is active
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStaffEditModalOpen(false);
                  setStaffToEdit(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement update staff mutation
                  console.log('Update staff:', staffToEdit);
                  setIsStaffEditModalOpen(false);
                  setStaffToEdit(null);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Update Staff Member
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Delete Confirmation Modal */}
      {isStaffDeleteModalOpen && staffToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Staff Member</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{staffToDelete.firstName} {staffToDelete.lastName}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently remove the staff member and all associated data.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsStaffDeleteModalOpen(false);
                  setStaffToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteStaff}
                disabled={deleteStaffMutation.isPending}
                className="flex-1"
              >
                {deleteStaffMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Staff Member'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Staff Activity Modal */}
      {isActivityModalOpen && staffForActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Staff Activity</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsActivityModalOpen(false);
                  setStaffForActivity(null);
                }}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Staff Info Header */}
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className={`text-white ${
                    staffForActivity.role === 'doctor' ? 'bg-blue-500' :
                    staffForActivity.role === 'nurse' ? 'bg-green-500' :
                    staffForActivity.role === 'receptionist' ? 'bg-purple-500' :
                    staffForActivity.role === 'sub_admin' ? 'bg-orange-500' :
                    staffForActivity.role === 'patient' ? 'bg-indigo-500' : 'bg-gray-500'
                  }`}>
                    {staffForActivity.firstName[0]}{staffForActivity.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold text-gray-900">
                    {staffForActivity.firstName} {staffForActivity.lastName}
                  </h4>
                  <p className="text-sm text-gray-600">{staffForActivity.email}</p>
                  <Badge className={getRoleColor(staffForActivity.role)}>
                    {staffForActivity.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>

              {/* Activity Timeline */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Recent Activity</h4>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Last Login</p>
                      <p className="text-xs text-gray-600">
                        {staffForActivity.lastLogin ? formatDate(staffForActivity.lastLogin) : 'Never logged in'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Account Created</p>
                      <p className="text-xs text-gray-600">{formatDate(staffForActivity.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Branch Assignment</p>
                      <p className="text-xs text-gray-600">
                        {staffForActivity.branchId?.branchName || 'Not assigned to any branch'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 bg-orange-50 rounded-lg">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">Account Status</p>
                      <p className="text-xs text-gray-600">
                        {staffForActivity.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Quick Statistics</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-4 rounded border text-center">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-gray-600">Appointments</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border text-center">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-gray-600">Patients</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border text-center">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-gray-600">Reports</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded border text-center">
                    <div className="text-2xl font-bold text-emerald-600">0</div>
                    <div className="text-sm text-gray-600">Actions</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsActivityModalOpen(false);
                  setStaffForActivity(null);
                }}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsActivityModalOpen(false);
                  setStaffForActivity(null);
                  setStaffToEdit(staffForActivity);
                  setIsStaffEditModalOpen(true);
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && branchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Branch</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete <strong>{branchToDelete.branchName}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently remove the branch and all associated data.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setBranchToDelete(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDeleteBranch}
                disabled={deleteBranchMutation.isPending}
                className="flex-1"
              >
                {deleteBranchMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Deleting...
                  </>
                ) : (
                  'Delete Branch'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Branch Modal */}
      {isEditModalOpen && branchToEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Branch</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setBranchToEdit(null);
                }}
              >
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                  <Input
                    value={branchToEdit.branchName}
                    onChange={(e) => setBranchToEdit({...branchToEdit, branchName: e.target.value})}
                    placeholder="Branch name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
                  <Select 
                    value={branchToEdit.branchType || 'sub'} 
                    onValueChange={(value) => setBranchToEdit({...branchToEdit, branchType: value as 'main' | 'sub'})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="main">Main Branch</SelectItem>
                      <SelectItem value="sub">Sub Branch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input
                    type="email"
                    value={branchToEdit.email}
                    onChange={(e) => setBranchToEdit({...branchToEdit, email: e.target.value})}
                    placeholder="branch@hospital.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input
                    value={branchToEdit.phoneNumber}
                    onChange={(e) => setBranchToEdit({...branchToEdit, phoneNumber: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input
                    value={branchToEdit.city}
                    onChange={(e) => setBranchToEdit({...branchToEdit, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <Input
                    value={branchToEdit.state}
                    onChange={(e) => setBranchToEdit({...branchToEdit, state: e.target.value})}
                    placeholder="State"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <Input
                  value={branchToEdit.addressLine1}
                  onChange={(e) => setBranchToEdit({...branchToEdit, addressLine1: e.target.value})}
                  placeholder="Street address"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={branchToEdit.isActive}
                  onChange={(e) => setBranchToEdit({...branchToEdit, isActive: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Branch is active
                </label>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setBranchToEdit(null);
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (branchToEdit) {
                    updateBranchMutation.mutate(branchToEdit);
                  }
                }}
                disabled={updateBranchMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {updateBranchMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  'Update Branch'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Branch Details Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Branch Details</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchBranch()}
                  className="flex items-center space-x-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setBranchToView(null);
                  }}
                >
                  <XCircle className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {singleBranchLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading branch details...</p>
              </div>
            ) : singleBranchData ? (
              <>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.branchName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Branch Type</label>
                        <div className="bg-gray-50 p-2 rounded border">
                          <Badge variant="outline" className="capitalize">
                            {singleBranchData.branchType || 'sub'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.phoneNumber}</p>
                      </div>
                      {singleBranchData.alternatePhone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Alternate Phone</label>
                          <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.alternatePhone}</p>
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <div className="bg-gray-50 p-2 rounded border">
                          <Badge variant={singleBranchData.isActive ? "default" : "secondary"}>
                            {singleBranchData.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Location</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.city}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.state}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.country}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                        <p className="text-gray-900 bg-gray-50 p-2 rounded border">{singleBranchData.postalCode}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <p className="text-gray-900 bg-gray-50 p-2 rounded border">
                        {singleBranchData.addressLine1}
                        {singleBranchData.addressLine2 && `, ${singleBranchData.addressLine2}`}
                      </p>
                    </div>
                    {singleBranchData.googleMapLink && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Google Map Link</label>
                        <a 
                          href={singleBranchData.googleMapLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline bg-gray-50 p-2 rounded border block"
                        >
                          {singleBranchData.googleMapLink}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Branch Manager */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Branch Manager</h4>
                    <div className="bg-gray-50 p-4 rounded border">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold">
                            {singleBranchData.subAdminId?.firstName?.[0]}{singleBranchData.subAdminId?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {singleBranchData.subAdminId?.firstName} {singleBranchData.subAdminId?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{singleBranchData.subAdminId?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div>
                    <h4 className="text-md font-semibold text-gray-900 mb-3 border-b pb-2">Branch Statistics</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded border text-center">
                        <div className="text-2xl font-bold text-blue-600">{singleBranchData.stats?.totalPatients || 0}</div>
                        <div className="text-sm text-gray-600">Patients</div>
                      </div>
                      <div className="bg-green-50 p-4 rounded border text-center">
                        <div className="text-2xl font-bold text-green-600">{singleBranchData.stats?.totalDoctors || 0}</div>
                        <div className="text-sm text-gray-600">Doctors</div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded border text-center">
                        <div className="text-2xl font-bold text-purple-600">{singleBranchData.stats?.totalAppointments || 0}</div>
                        <div className="text-sm text-gray-600">Appointments</div>
                      </div>
                      <div className="bg-emerald-50 p-4 rounded border text-center">
                        <div className="text-2xl font-bold text-emerald-600">
                          ₹{(singleBranchData.stats?.totalRevenue || 0).toLocaleString('en-IN')}
                        </div>
                        <div className="text-sm text-gray-600">Revenue</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setBranchToView(null);
                    }}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsViewModalOpen(false);
                      setBranchToView(null);
                      setBranchToEdit(singleBranchData);
                      setIsEditModalOpen(true);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Edit Branch
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Branch Not Found</h3>
                <p className="text-gray-600">The branch details could not be loaded.</p>
              </div>
            )}
          </div>
        </div>
      )}

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