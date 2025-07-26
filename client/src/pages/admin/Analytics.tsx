import React, { useState, useEffect } from 'react';
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
  Eye,
  EyeOff,
  Settings,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { authService } from '@/lib/auth';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
  RadialLinearScale
} from 'chart.js';
import { Line, Bar, Doughnut, Radar, PolarArea } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  ChartTooltip,
  Legend,
  Filler,
  RadialLinearScale
);

// Add type definitions near the top of the file
type PaymentMethod = {
  method: string;
  amount: number;
  percentage: number;
  transactions: number;
};

type PatientDemographic = {
  ageGroup: string;
  count: number;
  percentage: number;
};

// Add these type definitions near your other types
type MonthlyTrend = {
  month: string;
  revenue: number;
  patients: number;
  appointments: number;
  expenses: number;
};

type RevenueForecast = {
  month: string;
  revenue: number;
};

type PatientForecast = {
  period: string;
  currentYear: number;
  nextYear: number;
};

// Update the AnalyticsData interface
interface AnalyticsData {
  overview: {
    totalRevenue: number;
    revenueGrowth: number;
    totalPatients: number;
    patientGrowth: number;
    totalAppointments: number;
    appointmentGrowth: number;
    averageWaitTime: number;
    patientSatisfaction: number;
    totalDoctors: number;
    totalDepartments: number;
    averageAppointmentDuration: number;
    cancellationRate: number;
  };
  revenueChart: {
    labels: string[];
    data: number[];
  };
  patientChart: {
    labels: string[];
    data: number[];
  };
  departmentPerformance: {
    name: string;
    revenue: number;
    patients: number;
    satisfaction: number;
    growth: number;
    appointments: number;
    doctors: number;
  }[];
  topDoctors: {
    name: string;
    specialty: string;
    patients: number;
    revenue: number;
    rating: number;
    appointments: number;
    department: string;
  }[];
  operationalMetrics: {
    equipmentUtilization: number;
    equipmentUtilizationGrowth: number;
    staffEfficiency: number;
    emergencyResponseTime: number;
    averageLengthOfStay: number;
    readmissionRate: number;
  };
  financialHealth: {
    profitMargin: number;
    operatingRatio: number;
    growthRate: number;
    roi: number;
  };
  paymentMethods: PaymentMethod[];
  monthlyTrends: {
    month: string;
    revenue: number;
    patients: number;
    appointments: number;
    expenses: number;
  }[];
  patientDemographics: PatientDemographic[];
  appointmentStatus: {
    status: string;
    count: number;
    percentage: number;
  }[];
  revenueForecast: {
    month: string;
    revenue: number;
  }[];
  patientForecast: {
    period: string;
    currentYear: number;
    nextYear: number;
  }[];
  forecastInsights: {
    revenueGrowth: number;
    patientGrowth: number;
    efficiencyGain: number;
  };
}

const Analytics: React.FC = () => {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue');
  const [showRawData, setShowRawData] = useState<boolean>(false);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');
  const user = authService.getStoredUser();

  const API_URL = import.meta.env.VITE_API_URL;

  // Fetch analytics data
  const { data: analyticsData, isLoading, refetch, error } = useQuery({
    queryKey: ['admin', 'analytics', user?.hospitalId, dateRange, selectedBranch],
    queryFn: async () => {
      const params = new URLSearchParams({
        hospitalId: user?.hospitalId || '',
        branch: selectedBranch,
        ...(dateRange?.from && { from: dateRange.from.toISOString() }),
        ...(dateRange?.to && { to: dateRange.to.toISOString() }),
      });
      
      const response = await fetch(`${API_URL}/api/analytics?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Fetch branches
  const { data: branches } = useQuery({
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

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        padding: 12
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 11
          }
        }
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 11
          }
        }
      }
    }
  };

  // Revenue chart data
  const revenueChartData = {
    labels: analyticsData?.revenueChart?.labels || [],
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData?.revenueChart?.data || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 3,
        fill: chartType === 'area',
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  // Patient volume chart data
  const patientChartData = {
    labels: analyticsData?.patientChart?.labels || [],
    datasets: [
      {
        label: 'Patients',
        data: analyticsData?.patientChart?.data || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        borderRadius: 6,
        borderSkipped: false,
      }
    ]
  };

  // Department performance chart
  const departmentChartData = {
    labels: analyticsData?.departmentPerformance?.map((dept: any) => dept.name) || [],
    datasets: [
      {
        label: 'Revenue',
        data: analyticsData?.departmentPerformance?.map((dept: any) => dept.revenue) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Patients',
        data: analyticsData?.departmentPerformance?.map((dept: any) => dept.patients) || [],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  // Payment methods doughnut chart
  const paymentMethodsData = {
    labels: analyticsData?.paymentMethods?.map((pm: any) => pm.method) || [],
    datasets: [
      {
        data: analyticsData?.paymentMethods?.map((pm: any) => pm.amount) || [],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(168, 85, 247)',
        ],
        borderWidth: 2,
        hoverOffset: 4
      }
    ]
  };

  // Patient demographics radar chart
  const demographicsData = {
    labels: analyticsData?.patientDemographics?.map((demo: any) => demo.ageGroup) || [],
    datasets: [
      {
        label: 'Patient Distribution',
        data: analyticsData?.patientDemographics?.map((demo: any) => demo.count) || [],
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 6
      }
    ]
  };

  // Appointment status polar area chart
  const appointmentStatusData = {
    labels: analyticsData?.appointmentStatus?.map((status: any) => status.status) || [],
    datasets: [
      {
        data: analyticsData?.appointmentStatus?.map((status: any) => status.count) || [],
        backgroundColor: [
          'rgba(34, 197, 94, 0.6)',
          'rgba(251, 191, 36, 0.6)',
          'rgba(239, 68, 68, 0.6)',
          'rgba(107, 114, 128, 0.6)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 2
      }
    ]
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await fetch(`${API_URL}/api/analytics/export`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          hospitalId: user?.hospitalId,
          format,
          dateRange,
          branch: selectedBranch
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-report-${Date.now()}.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Update MetricCard currency display
  const MetricCard = ({ title, value, change, icon: Icon, format = 'number', subtitle, trend }: any) => (
    <Card className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
          {title}
          {subtitle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">{subtitle}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </CardTitle>
        <Icon className="h-4 w-4 text-blue-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {format === 'currency' ? `₹${value?.toLocaleString()}` : 
           format === 'percentage' ? `${value}%` :
           format === 'time' ? `${value}min` : 
           format === 'number' ? value?.toLocaleString() : value}
        </div>
        <div className="flex items-center space-x-1 text-xs mt-1">
          {change > 0 ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : change < 0 ? (
            <TrendingDown className="h-3 w-3 text-red-500" />
          ) : (
            <div className="h-3 w-3 text-gray-400" />
          )}
          <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500'}>
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-gray-500">vs last period</span>
        </div>
        {trend && (
          <div className="mt-2 text-xs text-gray-500">
            {trend}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const ChartCard = ({ title, children, subtitle, actions }: any) => (
    <Card className="bg-white shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-gray-900">{title}</CardTitle>
          {subtitle && <CardDescription className="text-sm text-gray-600">{subtitle}</CardDescription>}
        </div>
        {actions && (
          <div className="flex items-center space-x-2">
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analytics data</p>
          <Button onClick={() => refetch()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="text-gray-600 mt-1">Advanced insights and performance metrics</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select branch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches?.map((branch: any) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                className="w-64"
              />
              
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                {showRawData ? 'Hide' : 'Show'} Data
              </Button>
              
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => exportReport('pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" onClick={() => exportReport('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="operational">Operational</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Revenue"
                value={analyticsData?.overview?.totalRevenue}
                change={analyticsData?.overview?.revenueGrowth}
                icon={IndianRupee}
                format="currency"
                subtitle="Total revenue generated this period"
                trend="Steady growth trend"
              />
              <MetricCard
                title="Total Patients"
                value={analyticsData?.overview?.totalPatients}
                change={analyticsData?.overview?.patientGrowth}
                icon={Users}
                subtitle="Number of unique patients"
                trend="Increasing patient base"
              />
              <MetricCard
                title="Total Appointments"
                value={analyticsData?.overview?.totalAppointments}
                change={analyticsData?.overview?.appointmentGrowth}
                icon={Calendar}
                subtitle="Scheduled appointments"
                trend="High booking rate"
              />
              <MetricCard
                title="Patient Satisfaction"
                value={analyticsData?.overview?.patientSatisfaction}
                change={5.2}
                icon={CheckCircle}
                format="percentage"
                subtitle="Average satisfaction score"
                trend="Above industry average"
              />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard 
                title="Revenue Trends" 
                subtitle="Monthly revenue performance"
                actions={
                  <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">Line</SelectItem>
                      <SelectItem value="bar">Bar</SelectItem>
                      <SelectItem value="area">Area</SelectItem>
                    </SelectContent>
                  </Select>
                }
              >
                {chartType === 'line' || chartType === 'area' ? (
                  <Line data={revenueChartData} options={chartOptions} />
                ) : (
                  <Bar data={revenueChartData} options={chartOptions} />
                )}
              </ChartCard>
              
              <ChartCard title="Patient Volume" subtitle="Patient registration trends">
                <Bar data={patientChartData} options={chartOptions} />
              </ChartCard>
            </div>

            {/* Department Performance */}
            <ChartCard title="Department Performance" subtitle="Revenue and patient metrics by department">
              <Bar data={departmentChartData} options={chartOptions} />
            </ChartCard>

            {/* Raw Data Display */}
            {showRawData && (
              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Raw Analytics Data</CardTitle>
                  <CardDescription>Complete dataset for analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-xs">
                    {JSON.stringify(analyticsData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ChartCard title="Payment Methods" subtitle="Revenue distribution by payment type">
                <Doughnut 
                  data={{
                    labels: analyticsData?.paymentMethods?.map((pm: PaymentMethod) => pm.method),
                    datasets: [{
                      data: analyticsData?.paymentMethods?.map((pm: PaymentMethod) => pm.amount),
                      backgroundColor: [
                        'rgba(59, 130, 246, 0.8)',
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(251, 191, 36, 0.8)'
                      ],
                      borderWidth: 2
                    }]
                  }} 
                  options={chartOptions} 
                />
              </ChartCard>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Financial Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Profit Margin</span>
                      <Badge variant="default">
                        {analyticsData?.financialHealth?.profitMargin || 0}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Operating Ratio</span>
                      <Badge variant="default">0.82</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Growth Rate</span>
                      <Badge variant="default">+12.3%</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ROI</span>
                      <Badge variant="default">24.7%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900">Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Consultations</span>
                      <span className="font-medium">$45,670</span>
                    </div>
                    <Progress value={65} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Procedures</span>
                      <span className="font-medium">$23,450</span>
                    </div>
                    <Progress value={45} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Diagnostics</span>
                      <span className="font-medium">$12,890</span>
                    </div>
                    <Progress value={25} className="h-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Pharmacy</span>
                      <span className="font-medium">$8,750</span>
                    </div>
                    <Progress value={15} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="operational" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title="Equipment Utilization"
                value={analyticsData?.operationalMetrics?.equipmentUtilization}
                change={analyticsData?.operationalMetrics?.equipmentUtilizationGrowth}
                icon={Target}
                format="percentage"
              />
              <MetricCard
                title="Staff Efficiency"
                value={analyticsData?.operationalMetrics?.staffEfficiency}
                change={8.1}
                icon={Users}
                format="percentage"
                subtitle="Staff productivity score"
              />
              <MetricCard
                title="Avg. Wait Time"
                value={analyticsData?.overview?.averageWaitTime}
                change={-15.3}
                icon={Clock}
                format="time"
                subtitle="Average patient wait time"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Patient Demographics" subtitle="Age distribution of patients">
                <Radar 
                  data={{
                    labels: analyticsData?.patientDemographics?.map((d: PatientDemographic) => d.ageGroup),
                    datasets: [{
                      data: analyticsData?.patientDemographics?.map((d: PatientDemographic) => d.count),
                      backgroundColor: 'rgba(59, 130, 246, 0.2)'
                    }]
                  }} 
                  options={chartOptions} 
                />
              </ChartCard>

              <ChartCard title="Appointment Status" subtitle="Distribution of appointment outcomes">
                <PolarArea data={appointmentStatusData} options={chartOptions} />
              </ChartCard>
            </div>

           
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <ChartCard title="Top Performing Doctors" subtitle="Revenue and patient metrics by doctor">
              <Bar 
                data={{
                  labels: analyticsData?.topDoctors?.map((doctor: any) => doctor.name) || [],
                  datasets: [
                    {
                      label: 'Revenue',
                      data: analyticsData?.topDoctors?.map((doctor: any) => doctor.revenue) || [],
                      backgroundColor: 'rgba(59, 130, 246, 0.8)',
                      borderColor: 'rgb(59, 130, 246)',
                      borderWidth: 2,
                      borderRadius: 6,
                    },
                    {
                      label: 'Patients',
                      data: analyticsData?.topDoctors?.map((doctor: any) => doctor.patients) || [],
                      backgroundColor: 'rgba(34, 197, 94, 0.8)',
                      borderColor: 'rgb(34, 197, 94)',
                      borderWidth: 2,
                      borderRadius: 6,
                    }
                  ]
                }} 
                options={chartOptions} 
              />
            </ChartCard>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Doctor Performance Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData?.topDoctors?.map((doctor: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{doctor.name}</h4>
                        <p className="text-sm text-gray-600">{doctor.specialty} • {doctor.department}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{doctor.patients} patients</p>
                          <p className="text-sm text-gray-600">${doctor.revenue?.toLocaleString()}</p>
                        </div>
                        <Badge variant="default">
                          ⭐ {doctor.rating}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard title="Revenue Forecasting" subtitle="Predictive analysis based on historical data">
                <Line 
                  data={{
                    labels: analyticsData?.monthlyTrends?.map((trend: MonthlyTrend) => trend.month) || [],
                    datasets: [
                      {
                        label: 'Historical Revenue',
                        data: analyticsData?.monthlyTrends?.map((trend: MonthlyTrend) => trend.revenue) || [],
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 3,
                        fill: false,
                        tension: 0.4
                      },
                      {
                        label: 'Forecasted Revenue',
                        data: analyticsData?.revenueForecast?.map((forecast: RevenueForecast) => forecast.revenue) || [],
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 3,
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.4
                      }
                    ]
                  }} 
                  options={chartOptions} 
                />
              </ChartCard>

              <ChartCard title="Patient Growth Projection" subtitle="Expected patient volume trends">
                <Bar 
                  data={{
                    labels: analyticsData?.patientForecast?.map((forecast: PatientForecast) => forecast.period) || [],
                    datasets: [
                      {
                        label: 'Current Year',
                        data: analyticsData?.patientForecast?.map((forecast: PatientForecast) => forecast.currentYear) || [],
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 2,
                        borderRadius: 6,
                      },
                      {
                        label: 'Next Year (Projected)',
                        data: analyticsData?.patientForecast?.map((forecast: PatientForecast) => forecast.nextYear) || [],
                        backgroundColor: 'rgba(34, 197, 94, 0.8)',
                        borderColor: 'rgb(34, 197, 94)',
                        borderWidth: 2,
                        borderRadius: 6,
                      }
                    ]
                  }} 
                  options={chartOptions} 
                />
              </ChartCard>
            </div>

            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Forecasting Insights</CardTitle>
                <CardDescription>AI-powered predictions and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Revenue Growth</h4>
                    <p className="text-2xl font-bold text-blue-600">
                      {analyticsData?.forecastInsights?.revenueGrowth || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Expected next quarter</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Patient Growth</h4>
                    <p className="text-2xl font-bold text-green-600">
                      {analyticsData?.forecastInsights?.patientGrowth || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Expected next quarter</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <h4 className="font-medium text-gray-900">Efficiency Gain</h4>
                    <p className="text-2xl font-bold text-purple-600">
                      {analyticsData?.forecastInsights?.efficiencyGain || 0}%
                    </p>
                    <p className="text-sm text-gray-600">Expected next quarter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics; 