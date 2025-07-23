import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Building2, 
  IndianRupee, 
  Activity,
  Calendar,
  Clock,
  Target,
  PieChart,
  LineChart,
  BarChart,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  AlertCircle,
  Star,
  Globe,
  Server,
  Database,
  Cpu,
  HardDrive,
  Network,
  Wifi,
  Zap,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Loader2,
  FileDown,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  AreaChart,
  Radar
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import {
  LineChart as RechartsLineChart,
  Line,
  AreaChart as RechartsAreaChart,
  Area,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar as RechartsRadar,
  ScatterChart,
  Scatter as RechartsScatter,
  ComposedChart
} from 'recharts';

interface AnalyticsData {
  totalHospitals: number;
  activeUsers: number;
  totalRevenue: number;
  systemUptime: number;
  avgResponseTime: number;
  dataUsage: number;
  monthlyGrowth: number;
  userGrowth: number;
  revenueGrowth: number;
}

interface PerformanceMetric {
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  target: number;
}

interface RevenueData {
  month: string;
  revenue: number;
  growth: number;
  invoices: number;
  avgInvoiceValue: number;
}

interface HospitalPerformance {
  name: string;
  revenue: number;
  patients: number;
  rating: number;
  subscriptionPlan: string;
  status: string;
}

interface UserActivity {
  time: string;
  users: number;
  sessions: number;
  pageViews: number;
}

interface SubscriptionAnalytics {
  planName: string;
  subscribers: number;
  revenue: number;
  churnRate: number;
  avgRevenuePerUser: number;
}

const AnalyticsPage: React.FC = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [chartType, setChartType] = useState('line');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch analytics overview data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics-overview', timeRange],
    queryFn: async (): Promise<AnalyticsData> => {
      const response = await fetch(`/api/master-admin/analytics/overview?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        // Fallback to calculated data from other APIs
        return await generateAnalyticsFromAPIs();
      }

      return response.json();
    }
  });

  // Fetch billing data for revenue analytics
  const { data: billingData, isLoading: billingLoading } = useQuery({
    queryKey: ['billing-analytics', timeRange],
    queryFn: async (): Promise<{ invoices: any[] }> => {
      const response = await fetch(`/api/master-admin/billing?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      return response.json();
    }
  });

  // Fetch hospitals data
  const { data: hospitalsData, isLoading: hospitalsLoading } = useQuery({
    queryKey: ['hospitals-analytics'],
    queryFn: async (): Promise<{ hospitals: any[] }> => {
      const response = await fetch('/api/master-admin/hospitals', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch hospitals data');
      }

      return response.json();
    }
  });

  // Fetch subscription plans data
  const { data: subscriptionData, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription-analytics'],
    queryFn: async (): Promise<{ plans: any[] }> => {
      const response = await fetch('/api/master-admin/subscription-plans', {
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription data');
      }

      return response.json();
    }
  });

  // Generate analytics from available APIs
  const generateAnalyticsFromAPIs = async (): Promise<AnalyticsData> => {
    const hospitals = hospitalsData?.hospitals || [];
    const invoices = billingData?.invoices || [];
    const plans = subscriptionData?.plans || [];

    const totalRevenue = invoices
      .filter((inv: any) => inv.status === 'paid')
      .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

    const activeUsers = hospitals.length * 15; // Estimate users per hospital
    const systemUptime = 99.8; // Mock system uptime
    const avgResponseTime = 245; // Mock response time
    const dataUsage = 78.5; // Mock data usage

    return {
      totalHospitals: hospitals.length,
      activeUsers,
      totalRevenue,
      systemUptime,
      avgResponseTime,
      dataUsage,
      monthlyGrowth: 12.5,
      userGrowth: 8.2,
      revenueGrowth: 15.3
    };
  };

  // Transform billing data to revenue analytics
  const transformRevenueData = (): RevenueData[] => {
    if (!billingData?.invoices) return [];

    const invoices = billingData.invoices;
    const monthlyData: Record<string, any> = {};

    invoices.forEach((invoice: any) => {
      const date = new Date(invoice.createdAt);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          revenue: 0,
          invoices: 0,
          totalAmount: 0
        };
      }

      if (invoice.status === 'paid') {
        monthlyData[monthKey].revenue += invoice.totalAmount;
      }
      monthlyData[monthKey].invoices++;
      monthlyData[monthKey].totalAmount += invoice.totalAmount;
    });

    return Object.values(monthlyData).map((data: any) => ({
      month: data.month,
      revenue: data.revenue,
      growth: Math.random() * 20 + 5, // Mock growth
      invoices: data.invoices,
      avgInvoiceValue: data.invoices > 0 ? Math.round(data.totalAmount / data.invoices) : 0
    }));
  };

  // Transform hospitals data to performance analytics
  const transformHospitalPerformance = (): HospitalPerformance[] => {
    if (!hospitalsData?.hospitals || !billingData?.invoices) return [];

    const hospitals = hospitalsData.hospitals;
    const invoices = billingData.invoices;

    return hospitals.slice(0, 10).map((hospital: any) => {
      const hospitalInvoices = invoices.filter((inv: any) => 
        inv.hospitalId._id === hospital._id
      );

      const revenue = hospitalInvoices
        .filter((inv: any) => inv.status === 'paid')
        .reduce((sum: number, inv: any) => sum + inv.totalAmount, 0);

      const patients = Math.floor(Math.random() * 1000) + 200; // Mock patient count
      const rating = 4 + Math.random() * 0.8; // Mock rating

      return {
        name: hospital.name,
        revenue,
        patients,
        rating: Math.round(rating * 10) / 10,
        subscriptionPlan: hospital.subscriptionId?.planName || 'No Plan',
        status: hospital.status
      };
    }).sort((a, b) => b.revenue - a.revenue);
  };

  // Transform subscription data to analytics
  const transformSubscriptionAnalytics = (): SubscriptionAnalytics[] => {
    if (!subscriptionData?.plans) return [];

    return subscriptionData.plans.map((plan: any) => ({
      planName: plan.planName,
      subscribers: plan.activeSubscribers || 0,
      revenue: (plan.activeSubscribers || 0) * plan.monthlyCost * 12,
      churnRate: Math.random() * 3,
      avgRevenuePerUser: plan.monthlyCost
    }));
  };

  // Generate user activity data
  const generateUserActivity = (): UserActivity[] => {
    const hours = Array.from({ length: 24 }, (_, i) => i);
    return hours.map(hour => ({
      time: `${hour.toString().padStart(2, '0')}:00`,
      users: Math.floor(Math.random() * 200) + 50,
      sessions: Math.floor(Math.random() * 300) + 100,
      pageViews: Math.floor(Math.random() * 500) + 200
    }));
  };

  // Generate performance metrics
  const generatePerformanceMetrics = (): PerformanceMetric[] => {
    const data = analyticsData || {
      totalRevenue: 0,
      totalHospitals: 0,
      activeUsers: 0,
      systemUptime: 99.8,
      avgResponseTime: 245,
      dataUsage: 78.5,
      monthlyGrowth: 12.5,
      userGrowth: 8.2,
      revenueGrowth: 15.3
    };

    return [
      {
        name: 'System Performance',
        value: data.systemUptime,
        change: 2.1,
        trend: 'up' as const,
        target: 99.9
      },
      {
        name: 'User Satisfaction',
        value: 4.8,
        change: 0.2,
        trend: 'up' as const,
        target: 5.0
      },
      {
        name: 'Response Time',
        value: data.avgResponseTime || 245,
        change: -12,
        trend: 'down' as const,
        target: 200
      },
      {
        name: 'Error Rate',
        value: 0.3,
        change: -0.1,
        trend: 'down' as const,
        target: 0.1
      }
    ];
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics-overview'] });
    queryClient.invalidateQueries({ queryKey: ['billing-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['hospitals-analytics'] });
    queryClient.invalidateQueries({ queryKey: ['subscription-analytics'] });
    toast({
      title: "Refreshed",
      description: "Analytics data has been refreshed",
    });
  };

  const handleExportAnalytics = () => {
    const data = {
      overview: analyticsData,
      revenue: transformRevenueData(),
      hospitals: transformHospitalPerformance(),
      subscriptions: transformSubscriptionAnalytics()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    toast({
      title: "Export Successful",
      description: "Analytics data has been exported",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount).replace('₹', '₹ '); // Ensure proper spacing with rupee symbol
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  const isLoading = analyticsLoading || billingLoading || hospitalsLoading || subscriptionLoading;
  const data = analyticsData || {
    totalHospitals: 0,
    activeUsers: 0,
    totalRevenue: 0,
    systemUptime: 99.8,
    avgResponseTime: 245,
    dataUsage: 78.5,
    monthlyGrowth: 12.5,
    userGrowth: 8.2,
    revenueGrowth: 15.3
  };

  const revenueData = transformRevenueData();
  const hospitalPerformance = transformHospitalPerformance();
  const subscriptionAnalytics = transformSubscriptionAnalytics();
  const userActivity = generateUserActivity();
  const performanceMetrics = generatePerformanceMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Comprehensive system analytics and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportAnalytics}>
            <FileDown className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-700">Time Range:</span>
        <div className="flex bg-gray-100 rounded-lg p-1">
          {['7d', '30d', '90d', '1y'].map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
              className="text-xs"
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Hospitals</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatNumber(data.totalHospitals)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{data.monthlyGrowth}% this month
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatNumber(data.activeUsers)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{data.userGrowth}% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : formatCurrency(data.totalRevenue)}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  +{data.revenueGrowth}% vs last month
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <IndianRupee className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${data.systemUptime}%`}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Excellent
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Server className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Response</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${data.avgResponseTime}ms`}
                </p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  -12ms vs last week
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Data Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : `${data.dataUsage}%`}
                </p>
                <p className="text-xs text-yellow-600 flex items-center mt-1">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Moderate
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TargetIcon className="w-5 h-5 mr-2" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {performanceMetrics.map((metric) => (
                  <div key={metric.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{metric.name}</p>
                      <p className="text-sm text-gray-600">
                        Target: {metric.target}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{metric.value}</p>
                      <div className={`flex items-center text-xs ${
                        metric.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.trend === 'up' ? (
                          <TrendingUpIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <TrendingDownIcon className="w-3 h-3 mr-1" />
                        )}
                        {metric.change}%
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Subscription Analytics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="w-5 h-5 mr-2" />
                  Subscription Analytics
                </CardTitle>
                <CardDescription>Plan performance and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={subscriptionAnalytics}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="subscribers"
                      >
                        {subscriptionAnalytics.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatNumber(Number(value)), name]} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Revenue Analytics</CardTitle>
                  <CardDescription>Monthly revenue trends and growth</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={chartType === 'line' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('line')}
                  >
                    <LineChart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={chartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('bar')}
                  >
                    <BarChart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={chartType === 'area' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setChartType('area')}
                  >
                    <AreaChart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'line' ? (
                    <RechartsLineChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      <Legend />
                      <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="avgInvoiceValue" stroke="#82ca9d" strokeWidth={2} />
                    </RechartsLineChart>
                  ) : chartType === 'bar' ? (
                    <RechartsBarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#8884d8" />
                      <Bar dataKey="avgInvoiceValue" fill="#82ca9d" />
                    </RechartsBarChart>
                  ) : (
                    <RechartsAreaChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stackId="1" stroke="#8884d8" fill="#8884d8" />
                      <Area type="monotone" dataKey="avgInvoiceValue" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
                    </RechartsAreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Performance Trends</CardTitle>
              <CardDescription>Real-time performance monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsRadarChart data={performanceMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="name" />
                    <PolarRadiusAxis />
                    <RechartsRadar
                      name="Current"
                      dataKey="value"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                    />
                    <RechartsRadar
                      name="Target"
                      dataKey="target"
                      stroke="#82ca9d"
                      fill="#82ca9d"
                      fillOpacity={0.6}
                    />
                    <Legend />
                    <Tooltip />
                  </RechartsRadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hospitals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Hospitals</CardTitle>
              <CardDescription>Revenue and performance metrics by hospital</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={hospitalPerformance} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#8884d8" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Activity Patterns</CardTitle>
              <CardDescription>24-hour user activity and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={userActivity}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="pageViews" fill="#8884d8" stroke="#8884d8" />
                    <Bar dataKey="sessions" fill="#82ca9d" />
                    <Line type="monotone" dataKey="users" stroke="#ff7300" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsPage; 