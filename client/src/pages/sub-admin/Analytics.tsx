import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  LineChart, 
  PieChart, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Users,
  IndianRupee,
  Activity,
  Target,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle,
  Stethoscope,
  Heart,
  Building2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { authService } from '@/lib/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut, Radar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  RadialLinearScale,
  Filler
);

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalPatients: number;
    patientGrowth: number;
    totalAppointments: number;
    appointmentGrowth: number;
    averageWaitTime: number;
    patientSatisfaction: string;
  };
  departmentPerformance: {
    name: string;
    revenue: number;
    patients: number;
    satisfaction: number;
    growth: number;
    activeStaff: number;
  }[];
  topDoctors: {
    name: string;
    specialty: string;
    patients: number;
    revenue: number;
    rating: string;
  }[];
  operationalMetrics: {
    bedOccupancy: number;
    equipmentUtilization: number;
    staffEfficiency: number;
    emergencyResponseTime: string;
  };
  revenueTimeSeries: {
    date: string;
    revenue: number;
    appointments: number;
    patients: number;
  }[];
  recentActivities: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    value: number;
  }[];
  departmentDistribution: {
    name: string;
    value: number;
    revenue: number;
  }[];
}

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const user = authService.getStoredUser();
  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch real analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['branch-analytics', user?.branchId, selectedPeriod, selectedDepartment],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/${user?.branchId}/analytics?period=${selectedPeriod}&department=${selectedDepartment}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics data');
      return response.json() as AnalyticsData;
    }
  });

  const exportReport = async (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`);
    // Implementation would go here
  };

  // Chart configuration options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
      },
    },
  };

  const MetricCard = ({ title, value, change, icon: Icon, format = 'number' }: {
    title: string;
    value: number | string;
    change: number;
    icon: React.ElementType;
    format?: 'number' | 'currency' | 'percentage' | 'time' | 'rating';
  }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center space-x-2">
              <p className="text-2xl font-bold text-gray-900">
                {format === 'currency' && '₹'}
                {format === 'percentage' && value}{format === 'percentage' && '%'}
                {format === 'number' && typeof value === 'number' && value.toLocaleString()}
                {format === 'number' && typeof value === 'string' && value}
                {format === 'time' && `${value} min`}
                {format === 'rating' && `${value}/5`}
              </p>
              <div className={`flex items-center space-x-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{Math.abs(change)}%</span>
              </div>
            </div>
          </div>
          <Icon className="w-8 h-8 text-blue-500" />
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-500" />
          <span className="ml-2 text-red-600">Failed to load analytics data</span>
        </div>
      </div>
    );
  }

  // Prepare chart data from real analytics
  const revenueChartData = {
    labels: analyticsData.revenueTimeSeries?.map(item => 
      new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analyticsData.revenueTimeSeries?.map(item => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Appointments',
        data: analyticsData.revenueTimeSeries?.map(item => item.appointments) || [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: false,
        tension: 0.4,
        yAxisID: 'y1',
      }
    ],
  };

  const departmentBarData = {
    labels: analyticsData.departmentPerformance?.map(dept => dept.name) || [],
    datasets: [
      {
        label: 'Revenue (₹)',
        data: analyticsData.departmentPerformance?.map(dept => dept.revenue) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
      {
        label: 'Patients',
        data: analyticsData.departmentPerformance?.map(dept => dept.patients) || [],
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        yAxisID: 'y1',
      }
    ],
  };

  const departmentPieData = {
    labels: analyticsData.departmentDistribution?.map(dept => dept.name) || [],
    datasets: [
      {
        data: analyticsData.departmentDistribution?.map(dept => dept.value) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 101, 101, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(245, 101, 101)',
          'rgb(251, 191, 36)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const operationalRadarData = {
    labels: ['Bed Occupancy', 'Equipment Utilization', 'Staff Efficiency', 'Response Time Score'],
    datasets: [
      {
        label: 'Current Performance',
        data: [
          analyticsData.operationalMetrics?.bedOccupancy || 0,
          analyticsData.operationalMetrics?.equipmentUtilization || 0,
          analyticsData.operationalMetrics?.staffEfficiency || 0,
          100 - parseFloat(analyticsData.operationalMetrics?.emergencyResponseTime || '10') * 10 // Convert response time to performance score
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(59, 130, 246)',
      },
    ],
  };

  const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive performance insights with authentic data</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 3 months</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => exportReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="operational">Operations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Total Revenue"
              value={analyticsData.overview.totalRevenue}
              change={analyticsData.overview.revenueGrowth}
              icon={IndianRupee}
              format="currency"
            />
            <MetricCard
              title="Total Patients"
              value={analyticsData.overview.totalPatients}
              change={analyticsData.overview.patientGrowth}
              icon={Users}
            />
            <MetricCard
              title="Appointments"
              value={analyticsData.overview.totalAppointments}
              change={analyticsData.overview.appointmentGrowth}
              icon={Calendar}
            />
            <MetricCard
              title="Patient Satisfaction"
              value={analyticsData.overview.patientSatisfaction}
              change={5.2}
              icon={Heart}
              format="rating"
            />
          </div>

          {/* Advanced Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue & Appointments Trend">
              <div className="h-80">
                <Line data={revenueChartData} options={chartOptions} />
              </div>
            </ChartCard>

            <ChartCard title="Department Distribution">
              <div className="h-80">
                <Pie data={departmentPieData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </ChartCard>
          </div>

          {/* Operational Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Average Wait Time</p>
                    <p className="text-xl font-bold text-gray-900">{analyticsData.overview.averageWaitTime} min</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
                <Progress value={Math.max(0, 100 - analyticsData.overview.averageWaitTime * 2)} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bed Occupancy</p>
                    <p className="text-xl font-bold text-gray-900">{analyticsData.operationalMetrics.bedOccupancy}%</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
                <Progress value={analyticsData.operationalMetrics.bedOccupancy} className="mt-3" />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Staff Efficiency</p>
                    <p className="text-xl font-bold text-gray-900">{analyticsData.operationalMetrics.staffEfficiency}%</p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={analyticsData.operationalMetrics.staffEfficiency} className="mt-3" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Department Performance">
              <div className="h-80">
                <Bar data={departmentBarData} options={chartOptions} />
              </div>
            </ChartCard>

            <ChartCard title="Department Performance Radar">
              <div className="h-80">
                <Radar data={operationalRadarData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </ChartCard>
          </div>

          {/* Department Performance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Department Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Revenue</th>
                      <th className="text-left p-2">Patients</th>
                      <th className="text-left p-2">Staff</th>
                      <th className="text-left p-2">Satisfaction</th>
                      <th className="text-left p-2">Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.departmentPerformance?.map((dept, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{dept.name}</td>
                        <td className="p-2">₹{dept.revenue.toLocaleString()}</td>
                        <td className="p-2">{dept.patients}</td>
                        <td className="p-2">{dept.activeStaff}</td>
                        <td className="p-2">{dept.satisfaction}%</td>
                        <td className="p-2">
                          <Badge variant={dept.growth > 0 ? "default" : "destructive"}>
                            {dept.growth > 0 ? '+' : ''}{dept.growth}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Staff</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topDoctors?.map((doctor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{doctor.name}</h3>
                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{doctor.patients} patients</p>
                      <p className="text-sm text-gray-600">₹{doctor.revenue.toLocaleString()}</p>
                      <Badge>{doctor.rating} ⭐</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Bed Occupancy</p>
                    <p className="text-2xl font-bold">{analyticsData.operationalMetrics.bedOccupancy}%</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Equipment Utilization</p>
                    <p className="text-2xl font-bold">{analyticsData.operationalMetrics.equipmentUtilization}%</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Staff Efficiency</p>
                    <p className="text-2xl font-bold">{analyticsData.operationalMetrics.staffEfficiency}%</p>
                  </div>
                  <Activity className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Response Time</p>
                    <p className="text-2xl font-bold">{analyticsData.operationalMetrics.emergencyResponseTime}m</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.recentActivities?.slice(0, 5).map((activity, index) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">₹{activity.value}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;