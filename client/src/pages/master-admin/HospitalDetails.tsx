import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Calendar,
  Clock,
  Settings,
  BarChart3,
  Activity,
  CheckCircle,
  X,
  ExternalLink,
  User,
  CalendarDays,
  IndianRupee,
  Stethoscope
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { authService } from '@/lib/auth';

interface Hospital {
  _id: string;
  name: string;
  description?: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  adminId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
  settings: {
    allowOnlineBooking: boolean;
    maxAppointmentsPerDay: number;
    appointmentDuration: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: string[];
  };
  subscriptionStatus?: 'active' | 'inactive' | 'not_assigned';
  subscription?: {
    _id: string;
    planName: string;
    planType: string;
    status: string;
    startDate: string;
    endDate: string;
    nextBillingDate: string;
    monthlyCost: number;
    currency: string;
  };
}

interface HospitalStats {
  totalBranches: number;
  totalPatients: number;
  totalAppointments: number;
  totalRevenue: number;
  totalDoctors: number;
  totalStaff: number;
  recentAppointments: Array<{
    _id: string;
    patientName: string;
    doctorName: string;
    datetime: string;
    status: string;
  }>;
}

interface HospitalDetailsProps {
  hospital: Hospital;
  onClose: () => void;
}

const workingDaysMap: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

const API_URL = import.meta.env.VITE_API_URL;

// Helper for badge variant and text
const getStatusVariant = (status?: string) => {
  switch (status) {
    case 'active':
      return 'default';
    case 'inactive':
      return 'destructive';
    case 'not_assigned':
      return 'secondary';
    default:
      return 'secondary';
  }
};
const getStatusText = (status?: string) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'inactive':
      return 'Inactive';
    case 'not_assigned':
      return 'Not Assigned';
    default:
      return 'Unknown';
  }
};

const HospitalDetails: React.FC<HospitalDetailsProps> = ({ hospital, onClose }) => {
  // Fetch hospital statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['hospital-stats', hospital._id],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/hospitals/${hospital._id}/stats`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch hospital statistics');
      return response.json();
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{hospital.name}</h2>
          <p className="text-gray-600 mt-1">
            Hospital ID: {hospital._id}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant={getStatusVariant(hospital.subscriptionStatus)}>
            {getStatusText(hospital.subscriptionStatus)}
          </Badge>
          {hospital.subscription && (
            <span className="text-xs text-gray-500 ml-2">
              {hospital.subscription.planName} ({hospital.subscription.planType})
            </span>
          )}
          <Button variant="outline" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Branches</CardTitle>
                <Building2 className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalBranches || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Total branches</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Patients</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalPatients || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Registered patients</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Appointments</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : stats?.totalAppointments || 0}
                </div>
                <p className="text-xs text-gray-600 mt-1">Total appointments</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                <IndianRupee className="h-4 w-4 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {statsLoading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                </div>
                <p className="text-xs text-gray-600 mt-1">Total revenue</p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="w-5 h-5 mr-2" />
                  Hospital Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{hospital.address}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{hospital.phoneNumber}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">{hospital.email}</span>
                </div>
                {hospital.website && (
                  <div className="flex items-center space-x-3">
                    <Globe className="w-4 h-4 text-gray-400" />
                    <a 
                      href={hospital.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline flex items-center"
                    >
                      {hospital.website}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Administrator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {hospital.adminId.firstName} {hospital.adminId.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{hospital.adminId.email}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Created by: {hospital.createdBy.firstName} {hospital.createdBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {formatDate(hospital.createdAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Information</CardTitle>
              <CardDescription>Complete client hospital details and metadata</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Basic Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hospital Name:</span>
                        <span className="font-medium">{hospital.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status:</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusVariant(hospital.subscriptionStatus)}>
                            {getStatusText(hospital.subscriptionStatus)}
                          </Badge>
                          {hospital.subscription && (
                            <span className="text-xs text-gray-500">
                              {hospital.subscription.planName} ({hospital.subscription.planType})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created:</span>
                        <span className="font-medium">{formatDate(hospital.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Last Updated:</span>
                        <span className="font-medium">{formatDate(hospital.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {hospital.description && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-sm text-gray-600">{hospital.description}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-right max-w-xs">{hospital.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{hospital.phoneNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{hospital.email}</span>
                      </div>
                      {hospital.website && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Website:</span>
                          <a 
                            href={hospital.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Visit Site
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Administration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admin Name:</span>
                        <span className="font-medium">
                          {hospital.adminId.firstName} {hospital.adminId.lastName}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Admin Email:</span>
                        <span className="font-medium">{hospital.adminId.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Created By:</span>
                        <span className="font-medium">
                          {hospital.createdBy.firstName} {hospital.createdBy.lastName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Client Hospital Settings
              </CardTitle>
              <CardDescription>Current configuration and preferences for this client</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Booking Settings</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Online Booking</p>
                          <p className="text-xs text-gray-600">Allow patients to book online</p>
                        </div>
                        <Badge variant={hospital.settings.allowOnlineBooking ? "default" : "secondary"}>
                          {hospital.settings.allowOnlineBooking ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Max Appointments/Day</p>
                          <p className="text-xs text-gray-600">Daily appointment limit</p>
                        </div>
                        <span className="font-medium">{hospital.settings.maxAppointmentsPerDay}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Appointment Duration</p>
                          <p className="text-xs text-gray-600">Default slot duration</p>
                        </div>
                        <span className="font-medium">{hospital.settings.appointmentDuration} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Working Hours</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">Daily Schedule</p>
                          <p className="text-xs text-gray-600">Operating hours</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">
                            {formatTime(hospital.settings.workingHours.start)} - {formatTime(hospital.settings.workingHours.end)}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="font-medium text-sm mb-2">Working Days</p>
                        <div className="flex flex-wrap gap-2">
                          {hospital.settings.workingDays.map((day) => (
                            <Badge key={day} variant="outline">
                              {workingDaysMap[day]}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Client Performance Analytics
              </CardTitle>
              <CardDescription>Client hospital performance metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading analytics...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <Building2 className="w-8 h-8 text-blue-600 mr-3" />
                        <div>
                          <p className="text-2xl font-bold text-blue-900">{stats?.totalBranches || 0}</p>
                          <p className="text-sm text-blue-700">Branches</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <Users className="w-8 h-8 text-green-600 mr-3" />
                        <div>
                          <p className="text-2xl font-bold text-green-900">{stats?.totalPatients || 0}</p>
                          <p className="text-sm text-green-700">Patients</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-8 h-8 text-purple-600 mr-3" />
                        <div>
                          <p className="text-2xl font-bold text-purple-900">{stats?.totalAppointments || 0}</p>
                          <p className="text-sm text-purple-700">Appointments</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-emerald-50 rounded-lg">
                      <div className="flex items-center">
                        <IndianRupee className="w-8 h-8 text-emerald-600 mr-3" />
                        <div>
                          <p className="text-2xl font-bold text-emerald-900">
                            {formatCurrency(stats?.totalRevenue || 0)}
                          </p>
                          <p className="text-sm text-emerald-700">Revenue</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center py-8 text-gray-500">
                    <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p>Detailed analytics and charts will be implemented here</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HospitalDetails; 