import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon,
  Download,
  FileSpreadsheet,
  Filter,
  Calendar,
  Clock,
  Shield,
  Activity,
  TrendingUp,
  CheckCircle,
  XCircle,
  Settings,
  Star,
  BarChart3,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import HospitalForm from './HospitalForm';
import HospitalDetails from './HospitalDetails';

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
  subscriptionStatus: 'active' | 'inactive' | 'not_assigned';
}

// Transform API hospital data to form structure
const transformHospitalForForm = (hospital: Hospital) => {
  // Parse the address string to extract components
  const addressParts = hospital.address.split(', ');
  const addressLine1 = addressParts[0] || '';
  const addressLine2 = addressParts[1] || '';
  const city = addressParts[2] || '';
  const state = addressParts[3] || '';
  const countryAndPin = addressParts[4] || '';
  const [country, pinCode] = countryAndPin.split(' - ');

  return {
    ...hospital,
    primaryPhone: hospital.phoneNumber,
    secondaryPhone: '', // Not available in API response
    addressLine1,
    addressLine2,
    city,
    state,
    country: country || 'India',
    pinCode: pinCode || '',
    adminFullName: `${hospital.adminId.firstName} ${hospital.adminId.lastName}`,
    adminEmail: hospital.adminId.email,
    adminPhone: '', // Not available in API response
    adminUsername: '', // Not available in API response
    opdStartTime: hospital.settings.workingHours.start,
    opdEndTime: hospital.settings.workingHours.end,
    appointmentSlot: hospital.settings.appointmentDuration,
    workingDays: hospital.settings.workingDays,
    // Add other missing fields with defaults
    hospitalCode: '',
    registrationNumber: '',
    hospitalType: '',
    planType: '',
    trialDays: 30,
    monthlyCost: 0,
    billingStartDate: new Date().toISOString().split('T')[0],
    paymentMode: '',
    gstTaxId: '',
    invoicingEmail: '',
    autoInvoiceEmail: false,
    stripeId: '',
    currency: 'INR',
    defaultLanguage: 'English',
    initialServices: [],
    branchesAllowed: 1,
    isUnlimited: false,
    enable2FA: false,
    googleMapsLink: ''
  };
};

const Hospitals: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'not_assigned'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<Hospital | null>(null);
  const [viewingHospital, setViewingHospital] = useState<Hospital | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const API_URL = import.meta.env.VITE_API_URL;

  // Export functionality
  const exportToCSV = () => {
    if (!filteredHospitals.length) {
      toast({
        title: 'No data to export',
        description: 'There are no hospitals to export.',
        variant: 'destructive',
      });
      return;
    }

    const headers = [
      'Hospital Name',
      'Description',
      'Address',
      'Phone Number',
      'Email',
      'Website',
      'Subscription Status',
      'Plan Name',
      'Plan Type',
      'Monthly Cost',
      'Next Billing Date',
      'Admin Name',
      'Admin Email',
      'Created Date',
      'Working Hours',
      'Working Days',
      'Max Appointments/Day',
      'Appointment Duration'
    ];

    const csvData = filteredHospitals.map((hospital: Hospital) => [
      hospital.name,
      hospital.description || '',
      hospital.address,
      hospital.phoneNumber,
      hospital.email,
      hospital.website || '',
      hospital.subscriptionStatus === 'active' ? 'Active' : 
      hospital.subscriptionStatus === 'inactive' ? 'Inactive' : 'Not Assigned',
      hospital.subscription?.planName || 'N/A',
      hospital.subscription?.planType || 'N/A',
      hospital.subscription ? `${hospital.subscription.currency} ${hospital.subscription.monthlyCost}` : 'N/A',
      hospital.subscription?.nextBillingDate ? new Date(hospital.subscription.nextBillingDate).toLocaleDateString() : 'N/A',
      `${hospital.adminId.firstName} ${hospital.adminId.lastName}`,
      hospital.adminId.email,
      new Date(hospital.createdAt).toLocaleDateString(),
      `${hospital.settings.workingHours.start} - ${hospital.settings.workingHours.end}`,
      hospital.settings.workingDays.join(', '),
      hospital.settings.maxAppointmentsPerDay,
      `${hospital.settings.appointmentDuration} minutes`
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map((field: string) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hospitals_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredHospitals.length} hospitals to CSV`,
    });
  };

  const exportToExcel = () => {
    if (!filteredHospitals.length) {
      toast({
        title: 'No data to export',
        description: 'There are no hospitals to export.',
        variant: 'destructive',
      });
      return;
    }

    // For Excel export, we'll create a more structured CSV that Excel can open
    const headers = [
      'Hospital Name',
      'Description', 
      'Address',
      'Phone Number',
      'Email',
      'Website',
      'Subscription Status',
      'Plan Name',
      'Plan Type',
      'Monthly Cost',
      'Next Billing Date',
      'Admin Name',
      'Admin Email',
      'Created Date',
      'Working Hours',
      'Working Days',
      'Max Appointments/Day',
      'Appointment Duration (minutes)'
    ];

    const excelData = filteredHospitals.map((hospital: Hospital) => [
      hospital.name,
      hospital.description || '',
      hospital.address,
      hospital.phoneNumber,
      hospital.email,
      hospital.website || '',
      hospital.subscriptionStatus === 'active' ? 'Active' : 
      hospital.subscriptionStatus === 'inactive' ? 'Inactive' : 'Not Assigned',
      hospital.subscription?.planName || 'N/A',
      hospital.subscription?.planType || 'N/A',
      hospital.subscription ? `${hospital.subscription.currency} ${hospital.subscription.monthlyCost}` : 'N/A',
      hospital.subscription?.nextBillingDate ? new Date(hospital.subscription.nextBillingDate).toLocaleDateString() : 'N/A',
      `${hospital.adminId.firstName} ${hospital.adminId.lastName}`,
      hospital.adminId.email,
      new Date(hospital.createdAt).toLocaleDateString(),
      `${hospital.settings.workingHours.start} - ${hospital.settings.workingHours.end}`,
      hospital.settings.workingDays.join(', '),
      hospital.settings.maxAppointmentsPerDay,
      hospital.settings.appointmentDuration
    ]);

    const csvContent = [headers, ...excelData]
      .map(row => row.map((field: string) => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `hospitals_export_${new Date().toISOString().split('T')[0]}.xls`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export Successful',
      description: `Exported ${filteredHospitals.length} hospitals to Excel`,
    });
  };

  // Fetch hospitals
  const { data: hospitals, isLoading, error, refetch } = useQuery({
    queryKey: ['master-admin', 'hospitals'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/master-admin/hospitals`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch hospitals');
      const data = await response.json();
      return data.hospitals || data; // Handle both response formats
    }
  });

  // Delete hospital mutation
  const deleteMutation = useMutation({
    mutationFn: async (hospitalId: string) => {
      const response = await fetch(`${API_URL}/api/hospitals/${hospitalId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete hospital');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'hospitals'] });
      toast({
        title: 'Success',
        description: 'Hospital deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Filter hospitals
  const filteredHospitals = hospitals?.filter((hospital: Hospital) => {
    const matchesSearch = hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hospital.address.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && hospital.subscriptionStatus === 'active') ||
                         (statusFilter === 'inactive' && hospital.subscriptionStatus === 'inactive') ||
                         (statusFilter === 'not_assigned' && hospital.subscriptionStatus === 'not_assigned');
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Helper functions for status display
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return "default";
      case 'inactive':
        return "destructive";
      case 'not_assigned':
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusText = (status: string) => {
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Hospitals</h2>
            <p className="text-gray-600 mb-4">Failed to load hospital data. Please try again.</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate statistics
  const totalHospitals = hospitals?.length || 0;
  const activeHospitals = hospitals?.filter((h: Hospital) => h.subscriptionStatus === 'active').length || 0;
  const inactiveHospitals = hospitals?.filter((h: Hospital) => h.subscriptionStatus === 'inactive').length || 0;
  const notAssignedHospitals = hospitals?.filter((h: Hospital) => h.subscriptionStatus === 'not_assigned').length || 0;
  const recentlyAdded = hospitals?.filter((h: Hospital) => {
    const createdDate = new Date(h.createdAt);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdDate > thirtyDaysAgo;
  }).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Client Hospitals</h1>
                <p className="text-gray-600">Manage all organizations in your ecosystem</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Refresh
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportToCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportToExcel}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Hospital
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-gray-900">{totalHospitals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{activeHospitals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Inactive</p>
                  <p className="text-2xl font-bold text-gray-900">{inactiveHospitals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Not Assigned</p>
                  <p className="text-2xl font-bold text-gray-900">{notAssignedHospitals}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent</p>
                  <p className="text-2xl font-bold text-gray-900">{recentlyAdded}</p>
                  <p className="text-xs text-gray-500">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search hospitals..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Hospitals</SelectItem>
                    <SelectItem value="active">Active Subscriptions</SelectItem>
                    <SelectItem value="inactive">Inactive Subscriptions</SelectItem>
                    <SelectItem value="not_assigned">Not Assigned</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="rounded-md"
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="rounded-md"
                  >
                    <TableIcon className="w-4 h-4 mr-2" />
                    Table
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading hospitals...</p>
            </CardContent>
          </Card>
        ) : filteredHospitals.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Building2 className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No hospitals found</h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first hospital'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Button 
                  onClick={() => setIsAddModalOpen(true)} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hospital
                </Button>
              )}
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHospitals.map((hospital: Hospital) => (
              <Card key={hospital._id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{hospital.name}</CardTitle>
                      <CardDescription>{hospital.description || 'No description'}</CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setViewingHospital(hospital)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingHospital(hospital)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Hospital</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{hospital.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(hospital._id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      hospital.subscriptionStatus === 'active' ? "default" : 
                      hospital.subscriptionStatus === 'inactive' ? "destructive" : 
                      "secondary"
                    }>
                      {hospital.subscriptionStatus === 'active' ? 'Active' : 
                       hospital.subscriptionStatus === 'inactive' ? 'Inactive' : 
                       'Not Assigned'}
                    </Badge>
                    {hospital.subscription && (
                      <Badge variant="outline">
                        {hospital.subscription.planName}
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="w-4 h-4 mr-3" />
                    <span className="text-sm truncate">{hospital.address}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="w-4 h-4 mr-3" />
                    <span className="text-sm">{hospital.phoneNumber}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="w-4 h-4 mr-3" />
                    <span className="text-sm truncate">{hospital.email}</span>
                  </div>
                  {hospital.website && (
                    <div className="flex items-center text-gray-600">
                      <Globe className="w-4 h-4 mr-3" />
                      <span className="text-sm truncate">{hospital.website}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Admin: {hospital.adminId.firstName} {hospital.adminId.lastName}</span>
                      <span>Created: {new Date(hospital.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setViewingHospital(hospital)}
                      className="flex-1"
                    >
                      View Details
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingHospital(hospital)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hospital</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Subscription Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHospitals.map((hospital: Hospital) => (
                      <TableRow key={hospital._id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium">{hospital.name}</div>
                              <div className="text-sm text-gray-500">{hospital.description || 'No description'}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="max-w-xs truncate" title={hospital.address}>
                              {hospital.address}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="text-sm">{hospital.phoneNumber}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span className="text-sm text-gray-600 truncate">{hospital.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {hospital.adminId.firstName} {hospital.adminId.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{hospital.adminId.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col space-y-1">
                            <Badge variant={getStatusVariant(hospital.subscriptionStatus)}>
                              {getStatusText(hospital.subscriptionStatus)}
                            </Badge>
                            {hospital.subscription && (
                              <span className="text-xs text-gray-500">
                                {hospital.subscription.planName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {new Date(hospital.createdAt).toLocaleDateString()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setViewingHospital(hospital)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditingHospital(hospital)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Hospital</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{hospital.name}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(hospital._id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Hospital Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>Add New Hospital</span>
            </DialogTitle>
            <DialogDescription>
              Add a new hospital to the system
            </DialogDescription>
          </DialogHeader>
          <HospitalForm 
            onSuccess={() => {
              setIsAddModalOpen(false);
              queryClient.invalidateQueries({ queryKey: ['master-admin', 'hospitals'] });
            }}
            onCancel={() => setIsAddModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Hospital Modal */}
      {editingHospital && (
        <Dialog open={!!editingHospital} onOpenChange={() => setEditingHospital(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Hospital</DialogTitle>
              <DialogDescription>
                Update hospital information and settings
              </DialogDescription>
            </DialogHeader>
            <HospitalForm 
              hospital={transformHospitalForForm(editingHospital)}
              onSuccess={() => {
                setEditingHospital(null);
                queryClient.invalidateQueries({ queryKey: ['master-admin', 'hospitals'] });
              }}
              onCancel={() => setEditingHospital(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Hospital Details Modal */}
      {viewingHospital && (
        <Dialog open={!!viewingHospital} onOpenChange={() => setViewingHospital(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Hospital Details</DialogTitle>
              <DialogDescription>
                Comprehensive view of hospital information and statistics
              </DialogDescription>
            </DialogHeader>
            <HospitalDetails 
              hospital={viewingHospital}
              onClose={() => setViewingHospital(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Hospitals; 