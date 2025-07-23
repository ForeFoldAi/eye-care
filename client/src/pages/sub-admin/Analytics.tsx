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
  };
  departmentPerformance: {
    name: string;
    revenue: number;
    patients: number;
    satisfaction: number;
    growth: number;
  }[];
  topDoctors: {
    name: string;
    specialty: string;
    patients: number;
    revenue: number;
    rating: number;
  }[];
  operationalMetrics: {
    bedOccupancy: number;
    equipmentUtilization: number;
    staffEfficiency: number;
    emergencyResponseTime: number;
  };
}

const Analytics: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<string>('30');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const user = authService.getStoredUser();

  // Mock data for demonstration
  const analyticsData: AnalyticsData = {
    overview: {
      totalRevenue: 485200,
      revenueGrowth: 12.5,
      totalPatients: 1247,
      patientGrowth: 8.3,
      totalAppointments: 2156,
      appointmentGrowth: 15.7,
      averageWaitTime: 18,
      patientSatisfaction: 4.6
    },
    departmentPerformance: [
      { name: 'Cardiology', revenue: 125000, patients: 285, satisfaction: 4.8, growth: 15.2 },
      { name: 'Orthopedics', revenue: 98000, patients: 220, satisfaction: 4.5, growth: 8.7 },
      { name: 'Pediatrics', revenue: 75000, patients: 340, satisfaction: 4.9, growth: 12.3 },
      { name: 'Emergency', revenue: 187200, patients: 402, satisfaction: 4.2, growth: 6.8 }
    ],
    topDoctors: [
      { name: 'Dr. Sarah Wilson', specialty: 'Cardiology', patients: 156, revenue: 62400, rating: 4.9 },
      { name: 'Dr. Michael Chen', specialty: 'Orthopedics', patients: 134, revenue: 53600, rating: 4.8 },
      { name: 'Dr. Emily Brown', specialty: 'Pediatrics', patients: 189, revenue: 45360, rating: 4.7 },
      { name: 'Dr. James Taylor', specialty: 'Emergency', patients: 201, revenue: 48240, rating: 4.6 }
    ],
    operationalMetrics: {
      bedOccupancy: 78,
      equipmentUtilization: 85,
      staffEfficiency: 92,
      emergencyResponseTime: 8.5
    }
  };

  const exportReport = async (format: 'pdf' | 'excel') => {
    console.log(`Exporting report as ${format}`);
    // Implementation would go here
  };

  const MetricCard = ({ title, value, change, icon: Icon, format = 'number' }: {
    title: string;
    value: number;
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
                {format === 'number' && value.toLocaleString()}
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
          <h1 className="text-3xl font-bold text-gray-900">Branch Analytics</h1>
          <p className="text-gray-600 mt-1">Performance insights and metrics for your branch</p>
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
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button>
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Revenue Trend">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Revenue chart would be displayed here</p>
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Patient Flow">
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <LineChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Patient flow chart would be displayed here</p>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Quick Stats */}
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
                <Progress value={25} className="mt-3" />
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
                  <Target className="w-8 h-8 text-green-500" />
                </div>
                <Progress value={analyticsData.operationalMetrics.staffEfficiency} className="mt-3" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
              <CardDescription>Compare performance across different departments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.departmentPerformance.map((dept, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full bg-blue-${500 + index * 100}`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{dept.name}</p>
                        <p className="text-sm text-gray-600">{dept.patients} patients</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{dept.revenue.toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Growth:</span>
                        <Badge variant={dept.growth > 10 ? 'default' : 'secondary'}>
                          {dept.growth}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="staff" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Doctors</CardTitle>
              <CardDescription>Based on patient volume and revenue generation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topDoctors.map((doctor, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Stethoscope className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{doctor.name}</p>
                        <p className="text-sm text-gray-600">{doctor.specialty}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{doctor.revenue.toLocaleString()}</p>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">{doctor.patients} patients</span>
                        <Badge variant="outline">{doctor.rating}/5 ⭐</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operational Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Equipment Utilization</span>
                  <span className="font-medium">{analyticsData.operationalMetrics.equipmentUtilization}%</span>
                </div>
                <Progress value={analyticsData.operationalMetrics.equipmentUtilization} />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Emergency Response Time</span>
                  <span className="font-medium">{analyticsData.operationalMetrics.emergencyResponseTime} min</span>
                </div>
                <Progress value={60} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { action: 'New patient registered', time: '2 min ago', type: 'success' },
                    { action: 'Appointment completed', time: '5 min ago', type: 'info' },
                    { action: 'Equipment maintenance', time: '1 hour ago', type: 'warning' },
                    { action: 'Staff shift change', time: '2 hours ago', type: 'info' }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-400' :
                        activity.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-900">{activity.action}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics; 