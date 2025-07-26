import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { 
  Building2, 
  Users, 
  Activity, 
  TrendingUp, 
  Settings, 
  Database,
  Shield,
  BarChart3,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  Clock,
  
  Ticket,
  CreditCard,
  FileText,
  Bell,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Plus,
  Filter,
  Search,
  Download,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Star,
  Zap,
  Target,
  PieChart,
  LineChart,
  BarChart,
  TrendingDown,
  AlertCircle,
  Info,
  HelpCircle,
  ExternalLink,
  Lock,
  Unlock,
  Wifi,
  WifiOff,
  HardDrive,
  Cpu,
  Network,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Play,
  Pause,
  RotateCcw,
  IndianRupee,
  X,
  List,
  BarChart3 as BarChart3Icon,
  Download as DownloadIcon,
  Share2,
  Settings as SettingsIcon
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

interface SystemStats {
  totalHospitals: number;
  totalBranches: number;
  totalUsers: number;
  activeUsers: number;
  totalPatients: number;
  totalRevenue: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  openTickets: number;
  criticalTickets: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  timeRange: string;
}

interface HospitalPerformance {
  hospitalId: string;
  hospitalName: string;
  hospitalEmail: string;
  hospitalPhone: string;
  hospitalAddress: string;
  hospitalStatus: string;
  hospitalCreatedAt: string;
  
  // User metrics
  totalUsers: number;
  activeUsers: number;
  userEngagementRate: number;
  
  // Patient metrics
  totalPatients: number;
  newPatients: number;
  
  // Appointment metrics
  totalAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  appointmentCompletionRate: number;
  
  // Revenue metrics
  totalRevenue: number;
  totalPayments: number;
  avgRevenuePerPatient: number;
  
  // Performance metrics
  avgResponseTime: number;
  avgUptime: number;
  errorRate: number;
  apiCalls: number;
  failedApiCalls: number;
  apiSuccessRate: number;
  storageUsed: number;
  bandwidthUsed: number;
  
  // Calculated ranges for display
  maxResponseTime: number;
  minResponseTime: number;
  
  // Data points (for chart purposes)
  dataPoints: number;
}

interface PerformanceData {
  hospitals: HospitalPerformance[];
  systemSummary: {
    totalApiCalls: number;
    totalFailedCalls: number;
    avgResponseTime: number;
    avgUptime: number;
    totalStorageUsed: number;
    totalBandwidthUsed: number;
    maxResponseTime: number;
    minResponseTime: number;
  };
  timeRange: string;
}

interface RevenueData {
  _id: {
    year: number;
    month: number;
    day?: number;
  };
  totalRevenue: number;
  invoiceCount: number;
  avgInvoiceValue: number;
}

interface RevenueAnalytics {
  timeSeriesData: RevenueData[];
  summary: {
    totalRevenue: number;
    totalInvoices: number;
    avgInvoiceValue: number;
    maxInvoiceValue: number;
    minInvoiceValue: number;
  };
  byHospital: Array<{
    _id: string;
    hospitalName: string;
    totalRevenue: number;
    invoiceCount: number;
    avgInvoiceValue: number;
  }>;
  timeRange: string;
  period: string;
}

interface ActivityLogItem {
  id: string;
  type: string;
  title: string;
  description: string;
  time: string;
  icon: string;
  color: string;
  details?: any;
}

interface TopHospital {
  _id: string;
  name: string;
  patientCount: number;
  recentPatients: number;
  totalRevenue: number;
  growthPercentage: number;
  status: string;
}

const MasterAdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [expandedHospitals, setExpandedHospitals] = useState<Set<string>>(new Set());
  const [selectedActivity, setSelectedActivity] = useState<ActivityLogItem | null>(null);
  const [showActivityDetails, setShowActivityDetails] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch system statistics
  const { data: systemStats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['master-admin', 'system-stats', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/stats?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch system statistics');
      const data = await response.json();
      return data as SystemStats;
    }
  });

  // Fetch hospital performance data
  const { data: performanceData, isLoading: performanceLoading, refetch: refetchPerformance } = useQuery({
    queryKey: ['master-admin', 'hospital-performance', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/hospital-performance?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch performance data');
      const data = await response.json();
      return data as PerformanceData;
    }
  });

  // Fetch revenue analytics
  const { data: revenueData, isLoading: revenueLoading, refetch: refetchRevenue } = useQuery({
    queryKey: ['master-admin', 'revenue-analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/revenue-analytics?period=monthly&timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch revenue analytics');
      const data = await response.json();
      return data as RevenueAnalytics;
    }
  });

  // Fetch patient analytics
  const { data: patientAnalytics, isLoading: patientAnalyticsLoading, refetch: refetchPatientAnalytics } = useQuery({
    queryKey: ['master-admin', 'patient-analytics', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/patient-analytics?timeRange=${timeRange}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch patient analytics');
      const data = await response.json();
      return data;
    }
  });

  // Fetch system performance
  const { data: systemPerformance, isLoading: systemPerformanceLoading, refetch: refetchSystemPerformance } = useQuery({
    queryKey: ['master-admin', 'system-performance', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/system-performance?timeRange=24h`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch system performance');
      const data = await response.json();
      return data;
    }
  });

  // Fetch activity log
  const { data: activityLog, isLoading: activityLogLoading, refetch: refetchActivityLog } = useQuery({
    queryKey: ['master-admin', 'activity-log', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/activity-log?timeRange=${timeRange}&limit=20`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch activity log');
      const data = await response.json();
      return data;
    }
  });

  // Fetch top hospitals
  const { data: topHospitals, isLoading: topHospitalsLoading, refetch: refetchTopHospitals } = useQuery({
    queryKey: ['master-admin', 'top-hospitals', timeRange],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/top-hospitals?timeRange=${timeRange}&limit=5`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch top hospitals');
      const data = await response.json();
      return data as TopHospital[];
    }
  });

  // Combined refresh function
  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchStats(),
        refetchPerformance(),
        refetchRevenue(),
        refetchPatientAnalytics(),
        refetchSystemPerformance(),
        refetchActivityLog(),
        refetchTopHospitals()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Handle viewing activity details
  const handleViewActivityDetails = (activity: ActivityLogItem) => {
    setSelectedActivity(activity);
    setShowActivityDetails(true);
  };

  // Handle closing activity details
  const handleCloseActivityDetails = () => {
    setSelectedActivity(null);
    setShowActivityDetails(false);
  };

  const getSystemHealthColor = (health: string) => {
    switch (health) {
      case 'healthy': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSystemHealthIcon = (health: string) => {
    switch (health) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  // Helper function to get icon component
  const getActivityIcon = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Building2,
      Users,
      User: Users, // Map 'User' to 'Users' icon
      IndianRupee,
      Ticket,
      CreditCard
    };
    return iconMap[iconName] || Info;
  };

  // Helper function to format time
  const formatTimeAgo = (timeString: string) => {
    const time = new Date(timeString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  // Handler functions for dropdown menu actions
  const handleActivityActions = {
    viewAll: () => {
      toast({
        title: "View All Activities",
        description: "Navigating to analytics page...",
      });
      // Navigate to analytics page for detailed activity log
      navigate({ to: '/master-admin/analytics' });
    },
    exportData: () => {
      toast({
        title: "Export Data",
        description: "Preparing activity data for export...",
      });
      // Implement CSV/Excel export functionality
      // This would typically trigger a download
    },
    filterByType: () => {
      toast({
        title: "Filter Activities",
        description: "Opening filter options...",
      });
      // Show filter modal
    },
    refreshData: () => {
      toast({
        title: "Refreshing Data",
        description: "Updating activity data...",
      });
      handleRefresh();
    }
  };

  const handleHospitalActions = {
    viewAll: () => {
      toast({
        title: "View All Hospitals",
        description: "Navigating to hospitals list...",
      });
      // Navigate to hospitals list page
      navigate({ to: '/master-admin/hospitals' });
    },
    exportData: () => {
      toast({
        title: "Export Data",
        description: "Preparing hospital data for export...",
      });
      // Implement CSV/Excel export functionality
      // This would typically trigger a download
    },
    compareHospitals: () => {
      toast({
        title: "Compare Hospitals",
        description: "Opening hospital comparison view...",
      });
      // Show comparison modal
    },
    refreshData: () => {
      toast({
        title: "Refreshing Data",
        description: "Updating hospital data...",
      });
      handleRefresh();
    }
  };



  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, Admin</h1>
          <p className="text-gray-600 mt-1">Here's what's happening with your hospitals today</p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant="outline" className={`px-3 py-1 ${getSystemHealthColor(systemStats?.systemHealth || 'healthy')}`}>
            {getSystemHealthIcon(systemStats?.systemHealth || 'healthy')}
            <span className="ml-2">System {systemStats?.systemHealth || 'Healthy'}</span>
          </Badge>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">Total Hospitals</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Building2 className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">{formatNumber(systemStats?.totalHospitals || 0)}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">+12%</span>
              <span className="text-sm text-blue-600 ml-2">from last month</span>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              {systemStats?.activeSubscriptions || 0} active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700">System Revenue</CardTitle>
            <div className="p-2 bg-emerald-500 rounded-lg">
              <IndianRupee className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {formatCurrency(systemStats?.totalRevenue || 0)}
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">+15%</span>
              <span className="text-sm text-emerald-600 ml-2">from last month</span>
            </div>
            <p className="text-xs text-emerald-600 mt-2">
              Monthly recurring revenue
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700">Active Users</CardTitle>
            <div className="p-2 bg-purple-500 rounded-lg">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-900">{formatNumber(systemStats?.activeUsers || 0)}</div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-sm text-green-600 font-medium">+8%</span>
              <span className="text-sm text-purple-600 ml-2">from last week</span>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              {formatNumber(systemStats?.totalUsers || 0)} total registered users
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">Support Tickets</CardTitle>
            <div className="p-2 bg-orange-500 rounded-lg">
              <Ticket className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">{systemStats?.openTickets || 0}</div>
            <div className="flex items-center mt-2">
              <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-sm text-red-600 font-medium">{systemStats?.criticalTickets || 0}</span>
              <span className="text-sm text-orange-600 ml-2">critical</span>
            </div>
            <p className="text-xs text-orange-600 mt-2">
              Average response time: 2.3 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">Patient Registrations</CardTitle>
          </CardHeader>
          <CardContent>
            {patientAnalyticsLoading ? (
              <div className="flex items-center justify-center h-20">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatNumber(patientAnalytics?.totalPatients || 0)}
                    </div>
                    <p className="text-sm text-gray-600">Total patients</p>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${
                      (patientAnalytics?.growthPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {(patientAnalytics?.growthPercentage || 0) >= 0 ? '+' : ''}
                      {patientAnalytics?.growthPercentage || 0}%
                    </div>
                    <p className="text-xs text-gray-500">This month</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Progress 
                    value={patientAnalytics?.targetProgress || 0} 
                    className="h-2" 
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {patientAnalytics?.targetProgress || 0}% of monthly target ({patientAnalytics?.monthlyTarget || 0} patients)
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">System Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {systemPerformanceLoading ? (
              <div className="flex items-center justify-center h-20">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">API Response</span>
                  <span className="text-sm font-medium text-green-600">
                    {systemPerformance?.apiResponseTime || 245}ms
                  </span>
                </div>
                <Progress 
                  value={100 - ((systemPerformance?.apiResponseTime || 245) / 1000) * 100} 
                  className="h-2" 
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uptime</span>
                  <span className="text-sm font-medium text-green-600">
                    {systemPerformance?.systemUptime || 99.9}%
                  </span>
                </div>
                <Progress 
                  value={systemPerformance?.systemUptime || 99.9} 
                  className="h-2" 
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-sm font-medium text-blue-600">
                    {systemPerformance?.storageUsage || 67}%
                  </span>
                </div>
                <Progress 
                  value={systemPerformance?.storageUsage || 67} 
                  className="h-2" 
                />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <span className="text-sm font-medium text-green-600">
                    {systemPerformance?.successRate || 99.5}%
                  </span>
                </div>
                <Progress 
                  value={systemPerformance?.successRate || 99.5} 
                  className="h-2" 
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold text-gray-900">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate({ to: '/master-admin/hospitals' })}>
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate({ to: '/master-admin/subscriptions' })}>
                <CreditCard className="w-4 h-4 mr-2" />
                Manage Subscriptions
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => navigate({ to: '/master-admin/support' })}>
                <Ticket className="w-4 h-4 mr-2" />
                View Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recent Activity</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Activity Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleActivityActions.viewAll} className="cursor-pointer">
                        <List className="w-4 h-4 mr-2" />
                        View All Activities
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleActivityActions.refreshData} className="cursor-pointer">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityLogLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : activityLog?.activities && activityLog.activities.length > 0 ? (
                  <div className="space-y-4">
                    {activityLog.activities.slice(0, 5).map((activity: ActivityLogItem) => {
                      const IconComponent = getActivityIcon(activity.icon);
                      return (
                        <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={`p-2 rounded-lg ${activity.color}`}>
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-sm text-gray-600">{activity.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.time)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Performing Hospitals */}
            <Card className="bg-white shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Top Hospitals</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuLabel>Hospital Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleHospitalActions.viewAll} className="cursor-pointer">
                        <Building2 className="w-4 h-4 mr-2" />
                        View All Hospitals
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem onClick={handleHospitalActions.compareHospitals} className="cursor-pointer">
                        <BarChart3Icon className="w-4 h-4 mr-2" />
                        Compare Hospitals
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleHospitalActions.refreshData} className="cursor-pointer">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh Data
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {topHospitalsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                  </div>
                ) : topHospitals && topHospitals.length > 0 ? (
                  <div className="space-y-4">
                    {topHospitals.map((hospital, index) => (
                      <div key={hospital._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{hospital.name}</p>
                            <p className="text-xs text-gray-500">{formatNumber(hospital.recentPatients)} patients</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{formatCurrency(hospital.totalRevenue)}</p>
                          <div className="flex items-center text-xs">
                            {hospital.growthPercentage > 0 ? (
                              <ArrowUpRight className="w-3 h-3 text-green-600 mr-1" />
                            ) : (
                              <ArrowDownRight className="w-3 h-3 text-red-600 mr-1" />
                            )}
                            <span className={hospital.growthPercentage > 0 ? 'text-green-600' : 'text-red-600'}>
                              {Math.abs(hospital.growthPercentage)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No hospital data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* System Performance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Avg Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {performanceData?.systemSummary?.avgResponseTime?.toFixed(0) || 0}ms
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  {performanceData?.systemSummary?.minResponseTime?.toFixed(0) || 0}ms - {performanceData?.systemSummary?.maxResponseTime?.toFixed(0) || 0}ms
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">
                  {performanceData?.systemSummary?.avgUptime?.toFixed(1) || 0}%
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Last {performanceData?.timeRange || '30d'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">API Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {formatNumber(performanceData?.systemSummary?.totalApiCalls || 0)}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  {performanceData?.systemSummary?.totalFailedCalls || 0} failed
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Storage Used</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {formatBytes(performanceData?.systemSummary?.totalStorageUsed || 0)}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Across all hospitals
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Hospital Performance Details */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Hospital Performance Metrics</span>
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
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Detailed performance metrics by hospital for the last {performanceData?.timeRange || '30d'}</CardDescription>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : performanceData?.hospitals && performanceData.hospitals.length > 0 ? (
                <div className="space-y-6">
                  {performanceData.hospitals.map((hospital) => (
                    <div key={hospital.hospitalId} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      {/* Hospital Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{hospital.hospitalName}</h3>
                            <p className="text-sm text-gray-500">{hospital.hospitalEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={hospital.hospitalStatus === 'active' ? 'default' : 'secondary'}>
                            {hospital.hospitalStatus}
                          </Badge>
                          <Button variant="outline" size="sm" onClick={() => {
                            const newExpanded = new Set(expandedHospitals);
                            if (newExpanded.has(hospital.hospitalId)) {
                              newExpanded.delete(hospital.hospitalId);
                            } else {
                              newExpanded.add(hospital.hospitalId);
                            }
                            setExpandedHospitals(newExpanded);
                          }}>
                            {expandedHospitals.has(hospital.hospitalId) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Summary View (Always Visible) */}
                     

                      {/* Detailed Metrics (Only when expanded) */}
                      {expandedHospitals.has(hospital.hospitalId) && (
                        <>
                          {/* Performance Metrics Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                            {/* User Metrics */}
                            <div className="bg-blue-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-blue-700">Users</p>
                                  <p className="text-2xl font-bold text-blue-900">{formatNumber(hospital.totalUsers)}</p>
                                </div>
                                <Users className="w-8 h-8 text-blue-500" />
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-blue-600">Active: {formatNumber(hospital.activeUsers)}</span>
                                  <span className="text-blue-600">{hospital.userEngagementRate.toFixed(1)}%</span>
                                </div>
                                <Progress value={hospital.userEngagementRate} className="h-1 mt-1" />
                              </div>
                            </div>

                            {/* Patient Metrics */}
                            <div className="bg-green-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-green-700">Patients</p>
                                  <p className="text-2xl font-bold text-green-900">{formatNumber(hospital.totalPatients)}</p>
                                </div>
                                <Activity className="w-8 h-8 text-green-500" />
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-green-600">New: {formatNumber(hospital.newPatients)}</span>
                                  <span className="text-green-600">This period</span>
                                </div>
                              </div>
                            </div>

                            {/* Appointment Metrics */}
                            <div className="bg-purple-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-purple-700">Appointments</p>
                                  <p className="text-2xl font-bold text-purple-900">{formatNumber(hospital.totalAppointments)}</p>
                                </div>
                                <Calendar className="w-8 h-8 text-purple-500" />
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-purple-600">Completed: {formatNumber(hospital.completedAppointments)}</span>
                                  <span className="text-purple-600">{hospital.appointmentCompletionRate.toFixed(1)}%</span>
                                </div>
                                <Progress value={hospital.appointmentCompletionRate} className="h-1 mt-1" />
                              </div>
                            </div>

                            {/* Revenue Metrics */}
                            <div className="bg-orange-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium text-orange-700">Revenue</p>
                                  <p className="text-2xl font-bold text-orange-900">{formatCurrency(hospital.totalRevenue)}</p>
                                </div>
                                <IndianRupee className="w-8 h-8 text-orange-500" />
                              </div>
                              <div className="mt-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-orange-600">Per patient: {formatCurrency(hospital.avgRevenuePerPatient)}</span>
                                  <span className="text-orange-600">{formatNumber(hospital.totalPayments)} payments</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Technical Performance */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">API Response</span>
                                <span className="text-sm font-medium text-green-600">
                                  {hospital.avgResponseTime.toFixed(0)}ms
                          </span>
                              </div>
                              <Progress 
                                value={100 - (hospital.avgResponseTime / 1000) * 100} 
                                className="h-2" 
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Uptime</span>
                                <span className="text-sm font-medium text-green-600">
                                  {hospital.avgUptime.toFixed(1)}%
                          </span>
                              </div>
                              <Progress 
                                value={hospital.avgUptime} 
                                className="h-2" 
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">API Success</span>
                                <span className="text-sm font-medium text-green-600">
                                  {hospital.apiSuccessRate.toFixed(1)}%
                          </span>
                        </div>
                              <Progress 
                                value={hospital.apiSuccessRate} 
                                className="h-2" 
                              />
                      </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">Storage</span>
                                <span className="text-sm font-medium text-blue-600">
                                  {formatBytes(hospital.storageUsed)}
                                </span>
                        </div>
                              <Progress 
                                value={Math.min((hospital.storageUsed / (1024 * 1024 * 100)) * 100, 100)} 
                                className="h-2" 
                              />
                        </div>
                      </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No hospital data available</p>
                  <p className="text-sm text-gray-400 mt-1">Add hospitals to see performance metrics</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-emerald-700">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(revenueData?.summary?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-emerald-600 mt-1">
                  Last {revenueData?.timeRange || '6m'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">Total Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">
                  {formatNumber(revenueData?.summary?.totalInvoices || 0)}
                </div>
                <p className="text-xs text-blue-600 mt-1">
                  Paid invoices
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700">Avg Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">
                  {formatCurrency(revenueData?.summary?.avgInvoiceValue || 0)}
                </div>
                <p className="text-xs text-purple-600 mt-1">
                  Per invoice
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-orange-700">Max Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-900">
                  {formatCurrency(revenueData?.summary?.maxInvoiceValue || 0)}
                </div>
                <p className="text-xs text-orange-600 mt-1">
                  Highest single invoice
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by Hospital */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Revenue by Hospital</CardTitle>
              <CardDescription>Top revenue generating hospitals for the last {revenueData?.timeRange || '6m'}</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : revenueData?.byHospital && revenueData.byHospital.length > 0 ? (
                <div className="space-y-4">
                  {revenueData.byHospital.slice(0, 10).map((hospital) => (
                    <div key={hospital._id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{hospital.hospitalName}</h4>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <IndianRupee className="w-3 h-3 mr-1 text-green-600" />
                            {formatCurrency(hospital.totalRevenue)}
                          </span>
                          <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-1 text-blue-600" />
                            {formatNumber(hospital.invoiceCount)} invoices
                          </span>
                          <span className="flex items-center">
                            <BarChart3 className="w-3 h-3 mr-1 text-purple-600" />
                            Avg: {formatCurrency(hospital.avgInvoiceValue)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(hospital.totalRevenue)}
                        </div>
                        <div className="text-xs text-gray-500">Total Revenue</div>
                        <div className="text-xs text-gray-400">
                          {hospital.invoiceCount} invoices
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No revenue data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Revenue Trends Chart Placeholder */}
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
              <CardDescription>Monthly revenue trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Revenue chart will be displayed here</p>
                  <p className="text-sm text-gray-400">Interactive charts coming soon</p>
                  {revenueData?.timeSeriesData && revenueData.timeSeriesData.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">
                      {revenueData.timeSeriesData.length} data points available
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card className="bg-white shadow-sm border-0">
            <CardHeader>
              <CardTitle>System Activity Log</CardTitle>
              <CardDescription>Real-time system activities and events</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLogLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : activityLog?.activities && activityLog.activities.length > 0 ? (
                <div className="space-y-4">
                  {activityLog.activities.map((activity: ActivityLogItem) => {
                    const IconComponent = getActivityIcon(activity.icon);
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-lg ${activity.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatTimeAgo(activity.time)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewActivityDetails(activity)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No activity data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Activity Details Dialog */}
      {showActivityDetails && selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Activity Details</h3>
              <Button variant="ghost" size="sm" onClick={handleCloseActivityDetails}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${selectedActivity.color}`}>
                  {(() => {
                    const IconComponent = getActivityIcon(selectedActivity.icon);
                    return <IconComponent className="w-5 h-5" />;
                  })()}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{selectedActivity.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{selectedActivity.description}</p>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <span className="text-sm text-gray-600 ml-2 capitalize">{selectedActivity.type}</span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Time:</span>
                  <span className="text-sm text-gray-600 ml-2">{new Date(selectedActivity.time).toLocaleString()}</span>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-700">Time Ago:</span>
                  <span className="text-sm text-gray-600 ml-2">{formatTimeAgo(selectedActivity.time)}</span>
                </div>

                {selectedActivity.details && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Additional Details:</span>
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                      <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                        {JSON.stringify(selectedActivity.details, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button variant="outline" onClick={handleCloseActivityDetails}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MasterAdminDashboard; 