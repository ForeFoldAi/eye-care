import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Settings,
  Download,
  Upload,
  AlertTriangle,
  AlertCircle,
  Star,
  Award,
  TrendingUp,
  Building2,
  Plus,
  Save,
  X,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { useForm } from 'react-hook-form';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber?: string;
  role: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist' | 'nurse';
  department?: string;
  specialization?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profilePhotoUrl?: string;
  branchId?: {
    _id: string;
    branchName: string;
  };
  hospitalId?: {
    _id: string;
    name: string;
  };
  createdBy?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  permissions?: string[];
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  emergencyContact?: string;
  employeeId?: string;
  joiningDate?: string;
  shiftTiming?: 'morning' | 'evening' | 'night' | 'other';
  highestQualification?: string;
  medicalLicenseNumber?: string;
  yearsOfExperience?: number;
  certifications?: string;
  previousHospitals?: string;
  currentAddress?: string;
  permanentAddress?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

interface StaffFormData {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phoneNumber: string;
  role: string;
  department: string;
  specialization: string;
  branchId: string;
  isActive: boolean;
  gender: string;
  emergencyContact: string;
  employeeId: string;
  joiningDate: string;
  shiftTiming: string;
  highestQualification: string;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  certifications: string;
  currentAddress: string;
  city: string;
  state: string;
  zipCode: string;
}

const StaffManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPermissionsDialog, setShowPermissionsDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const user = authService.getStoredUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const API_URL = import.meta.env.VITE_API_URL;

  // Form for adding/editing staff
  const form = useForm<StaffFormData>({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      phoneNumber: '',
      role: 'doctor',
      department: '',
      specialization: '',
      branchId: '',
      isActive: true,
      gender: 'male',
      emergencyContact: '',
      employeeId: '',
      joiningDate: '',
      shiftTiming: 'morning',
      highestQualification: '',
      medicalLicenseNumber: '',
      yearsOfExperience: 0,
      certifications: '',
      currentAddress: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  // Fetch staff members - ALL BRANCHES
  const { data: staffMembers = [], isLoading: staffLoading, error: staffError } = useQuery({
    queryKey: ['admin', 'staff', user?.hospitalId, searchTerm, selectedRole, selectedDepartment, selectedBranch],
    queryFn: async () => {
      console.log('Fetching staff for hospital:', user?.hospitalId);
      console.log('User role:', user?.role);
      console.log('User branch:', user?.branchId);
      
      // Use hospital-level staff endpoint to get staff from all branches
      const endpoint = `${API_URL}/api/users/staff/${user?.hospitalId}`;
      console.log('Using hospital-level endpoint:', endpoint);
      
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole !== 'all' && { role: selectedRole }),
        ...(selectedDepartment !== 'all' && { department: selectedDepartment }),
        ...(selectedBranch !== 'all' && { branch: selectedBranch }),
      });
      
      const response = await fetch(`${endpoint}?${params}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch staff members: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Staff API Response (All branches):', data);
      console.log('Total staff fetched across all branches:', data.length);
      
      // Log each staff member with their details
      data.forEach((staff: any, index: number) => {
        console.log(`Staff ${index + 1}:`, {
          name: `${staff.firstName} ${staff.lastName}`,
          role: staff.role,
          branch: staff.branchId?.branchName || 'No branch',
          department: staff.department || 'No department',
          isActive: staff.isActive
        });
      });
      
      return data;
    },
    enabled: !!user?.hospitalId
  });

  // Fetch branches
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

  // Fetch departments
  const { data: departments, isLoading: departmentsLoading } = useQuery({
    queryKey: ['admin', 'departments', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/departments/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Add staff mutation
  const addStaffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          hospitalId: user?.hospitalId,
          password: 'defaultPassword123', // This should be changed by user on first login
          createdBy: user?.id
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add staff member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: 'Success',
        description: 'Staff member added successfully',
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

  // Update staff mutation
  const updateStaffMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<StaffFormData> }) => {
      const response = await fetch(`${API_URL}/api/users/${data.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data.updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update staff member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setShowEditDialog(false);
      setSelectedStaff(null);
      form.reset();
      toast({
        title: 'Success',
        description: 'Staff member updated successfully',
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

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete staff member');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] });
      setShowDeleteConfirm(false);
      setSelectedStaff(null);
      toast({
        title: 'Success',
        description: 'Staff member deleted successfully',
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

  // Toggle staff status
  const toggleStaffStatus = (id: string, isActive: boolean) => {
    updateStaffMutation.mutate({ id, updates: { isActive } });
  };

  // Handle form submission
  const handleSubmit = (data: StaffFormData) => {
    if (showAddDialog) {
      addStaffMutation.mutate(data);
    } else if (showEditDialog && selectedStaff) {
      updateStaffMutation.mutate({ id: selectedStaff._id, updates: data });
    }
  };

  // Handle edit
  const handleEdit = (staff: StaffMember) => {
    setSelectedStaff(staff);
    form.reset({
      firstName: staff.firstName,
      lastName: staff.lastName,
      email: staff.email,
      username: staff.username,
      phoneNumber: staff.phoneNumber || '',
      role: staff.role,
      department: staff.department || '',
      specialization: staff.specialization || '',
      branchId: staff.branchId?._id || '',
      isActive: staff.isActive,
      gender: staff.gender || 'male',
      emergencyContact: staff.emergencyContact || '',
      employeeId: staff.employeeId || '',
      joiningDate: staff.joiningDate || '',
      shiftTiming: staff.shiftTiming || 'morning',
      highestQualification: staff.highestQualification || '',
      medicalLicenseNumber: staff.medicalLicenseNumber || '',
      yearsOfExperience: staff.yearsOfExperience || 0,
      certifications: staff.certifications || '',
      currentAddress: staff.currentAddress || '',
      city: staff.city || '',
      state: staff.state || '',
      zipCode: staff.zipCode || ''
    });
    setShowEditDialog(true);
  };

  // Handle delete
  const handleDelete = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowDeleteConfirm(true);
  };

  // Handle view details
  const handleViewDetails = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setShowViewDialog(true);
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'doctor': return 'bg-blue-100 text-blue-800';
      case 'nurse': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-red-100 text-red-800';
      case 'sub_admin': return 'bg-orange-100 text-orange-800';
      case 'master_admin': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  // Filter staff members
  const filteredStaff = staffMembers?.filter((staff: StaffMember) => {
    const matchesSearch = 
      staff.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || staff.role === selectedRole;
    const matchesDepartment = selectedDepartment === 'all' || staff.department === selectedDepartment;
    const matchesBranch = selectedBranch === 'all' || staff.branchId?._id === selectedBranch;
    
    return matchesSearch && matchesRole && matchesDepartment && matchesBranch;
  });

  // Calculate stats
  const totalStaff = staffMembers?.length || 0;
  const activeStaff = staffMembers?.filter((s: StaffMember) => s.isActive).length || 0;
  const doctors = staffMembers?.filter((s: StaffMember) => s.role === 'doctor').length || 0;
  const nurses = staffMembers?.filter((s: StaffMember) => s.role === 'nurse').length || 0;
  const receptionists = staffMembers?.filter((s: StaffMember) => s.role === 'receptionist').length || 0;

  // Staff Card Component
  const StaffCard = ({ staff }: { staff: StaffMember }) => (
    <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={staff.profilePhotoUrl} 
                alt={`${staff.firstName} ${staff.lastName}`}
              />
              <AvatarFallback className="bg-blue-500 text-white">
                {staff.firstName[0]}{staff.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-gray-900">
                {staff.firstName} {staff.lastName}
              </h3>
              <p className="text-sm text-gray-600">{staff.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getRoleColor(staff.role)}>
                  {staff.role.replace('_', ' ')}
                </Badge>
                <Badge className={getStatusColor(staff.isActive)}>
                  {staff.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(staff)}>
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(staff)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toggleStaffStatus(staff._id, !staff.isActive)}>
                {staff.isActive ? (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => handleDelete(staff)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{staff.phoneNumber || 'No phone'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">{staff.department || 'No department'}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              Joined {new Date(staff.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {staff.lastLogin ? `Last login ${new Date(staff.lastLogin).toLocaleDateString()}` : 'Never logged in'}
            </span>
          </div>
        </div>
        
        {staff.branchId && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-blue-400" />
              <span className="text-sm font-medium">Branch: {staff.branchId.branchName}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (staffLoading || branchesLoading || departmentsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading staff data...</p>
        </div>
      </div>
    );
  }

  // Error Display
  if (staffError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
                <div>
                  <h3 className="text-lg font-medium text-red-800">Error Loading Staff Data</h3>
                  <p className="text-sm text-red-700 mt-1">{staffError.message}</p>
                  <div className="mt-4 space-y-2 text-xs text-red-600">
                    <p>User Role: {user?.role}</p>
                    <p>User Hospital ID: {user?.hospitalId}</p>
                    <p>User Branch ID: {user?.branchId}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.reload()}
                    className="mt-3 border-red-300 text-red-700 hover:bg-red-100"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
              <p className="text-gray-600 mt-1">Manage your hospital staff and permissions</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button onClick={() => setShowAddDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Staff
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="staff">Staff Directory</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{totalStaff}</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Staff</p>
                      <p className="text-2xl font-bold text-gray-900">{activeStaff}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Doctors</p>
                      <p className="text-2xl font-bold text-gray-900">{doctors}</p>
                    </div>
                    <Award className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-white shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Nurses</p>
                      <p className="text-2xl font-bold text-gray-900">{nurses}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Breakdown */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Department Breakdown</CardTitle>
                <CardDescription>Staff distribution across departments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {departments?.map((dept: any) => (
                    <div key={dept._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{dept.name}</h4>
                        <p className="text-sm text-gray-600">{dept.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline">
                          {staffMembers?.filter((s: StaffMember) => s.department === dept.name).length || 0} staff
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="staff" className="space-y-6">
            {/* Filters */}
            <Card className="bg-white shadow-sm">
              <CardContent className="p-6">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search staff members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="sub_admin">Sub Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments?.map((dept: any) => (
                        <SelectItem key={dept._id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by branch" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Branches</SelectItem>
                      {branches?.map((branch: any) => (
                        <SelectItem key={branch._id} value={branch._id}>
                          {branch.branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Staff Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStaff?.map((staff: StaffMember) => (
                <StaffCard key={staff._id} staff={staff} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            {/* Performance Metrics Summary */}
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Staff productivity & recognition summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6 my-6">
                  <Card className="border">
                    <CardContent className="p-5">
                      <h4 className="text-sm text-gray-600">Average Attendance Rate</h4>
                      <div className="flex items-end">
                        <span className="text-3xl font-bold text-blue-900 mr-2">97%</span>
                        <TrendingUp className="text-green-500 w-6 h-6" />
                      </div>
                      <Progress value={97} className="mt-2" />
                    </CardContent>
                  </Card>
                  <Card className="border">
                    <CardContent className="p-5">
                      <h4 className="text-sm text-gray-600">Avg. Task Completion Rate</h4>
                      <div className="flex items-end">
                        <span className="text-3xl font-bold text-blue-900 mr-2">88%</span>
                        <TrendingUp className="text-green-500 w-6 h-6" />
                      </div>
                      <Progress value={88} className="mt-2 bg-green-100" />
                    </CardContent>
                  </Card>
                  <Card className="border">
                    <CardContent className="p-5">
                      <h4 className="text-sm text-gray-600">Monthly Recognitions</h4>
                      <div className="flex items-center">
                        <Star className="text-yellow-400 w-6 h-6 mr-2" />
                        <span className="text-2xl font-bold text-gray-700">14</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                {/* Top performer list (mock) */}
                <div>
                  <h4 className="text-lg font-semibold mb-4 ml-2">Top Performers</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredStaff?.slice(0, 3)?.map((s: StaffMember) => (
                      <Card key={s._id} className="border bg-indigo-50">
                        <CardContent className="p-4 flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={s.profilePhotoUrl} alt={s.firstName} />
                            <AvatarFallback>{s.firstName[0]}{s.lastName[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-semibold text-gray-900">{s.firstName} {s.lastName}</div>
                            <div className="text-xs text-gray-600 mb-1">{s.role.replace('_',' ')}</div>
                            <div className="flex space-x-2">
                              <Badge variant="outline" className="bg-green-100 text-green-600">Attendance: 99%</Badge>
                              <Badge variant="outline" className="bg-blue-100 text-blue-600">Tasks: 96%</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
                {/* Quick Activity Feed (demo) */}
                <div className="mt-6">
                  <h4 className="font-semibold mb-2 ml-2">Latest Staff Activity</h4>
                  <ul className="divide-y">
                    <li className="py-2 text-sm flex items-center"><CheckCircle className="text-green-500 w-4 h-4 mr-1" />Dr. Varma completed rounds - 2 hours ago.</li>
                    <li className="py-2 text-sm flex items-center"><Activity className="text-blue-500 w-4 h-4 mr-1" />Nurse Sharon clocked in on time.</li>
                    <li className="py-2 text-sm flex items-center"><Award className="text-yellow-500 w-4 h-4 mr-1" />Receptionist Preeti awarded for perfect attendance.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedules" className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Staff Schedules</CardTitle>
                <CardDescription>Manage work schedules and availability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex justify-between flex-wrap gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm">
                    <Calendar className="w-4 h-4 mr-1" />
                    Export Schedule
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Assign Shift
                  </Button>
                </div>
                {/* Schedules Table Mock */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Role</th>
                        <th className="px-3 py-2 text-left">Department</th>
                        <th className="px-3 py-2 text-left">Shift</th>
                        <th className="px-3 py-2 text-left">Day</th>
                        <th className="px-3 py-2 text-left">Timing</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff?.slice(0,9)?.map((s: StaffMember, idx:number)=> (
                        <tr key={s._id} className="border-b bg-white hover:bg-gray-50">
                          <td className="px-3 py-2">{s.firstName} {s.lastName}</td>
                          <td className="px-3 py-2 capitalize">{s.role.replace('_',' ')}</td>
                          <td className="px-3 py-2">{s.department || '-'}</td>
                          <td className="px-3 py-2 capitalize">{s.shiftTiming || ['morning','evening','night'][idx%3]}</td>
                          <td className="px-3 py-2">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][idx%7]}</td>
                          <td className="px-3 py-2">{['7am - 3pm','3pm - 11pm','11pm - 7am'][idx%3]}</td>
                          <td className={"px-3 py-2 " + (s.isActive ? 'text-green-600':'text-gray-400')}>{s.isActive?'Active':'Inactive'}</td>
                          <td className="px-3 py-2 ">
                            <Button size="icon" variant="ghost"><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-500" /></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Department Coverage Mock Overview */}
                  <div className="mt-8">
                    <h3 className="font-bold mb-4">Coverage by Department</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                      {departments?.map((dept: any) => (
                        <Card key={dept._id} className="p-4 border bg-blue-50">
                          <div className="font-semibold text-blue-900">{dept.name}</div>
                          <div className="text-sm text-gray-600">{dept.description}</div>
                          <div className="font-bold text-2xl text-blue-800 mt-2">
                            {filteredStaff?.filter((s:StaffMember)=>s.department === dept.name).length || 0} scheduled
                          </div>
                          <div className="text-xs text-gray-600 mt-1">Mostly {['Day','Evening','Night'][Math.floor(Math.random()*3)]} shift</div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Staff Dialog */}
      <Dialog open={showAddDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowAddDialog(false);
          setShowEditDialog(false);
          setSelectedStaff(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showAddDialog ? 'Add New Staff Member' : 'Edit Staff Member'}
            </DialogTitle>
            <DialogDescription>
              {showAddDialog ? 'Add a new staff member to your hospital' : 'Update staff member information'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name *</Label>
                <Input 
                  id="firstName" 
                  {...form.register('firstName', { required: 'First name is required' })}
                  placeholder="John"
                />
                {form.formState.errors.firstName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.firstName.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="lastName">Last Name *</Label>
                <Input 
                  id="lastName" 
                  {...form.register('lastName', { required: 'Last name is required' })}
                  placeholder="Doe"
                />
                {form.formState.errors.lastName && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input 
                  id="email" 
                  type="email" 
                  {...form.register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                  placeholder="john.doe@hospital.com"
                />
                {form.formState.errors.email && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username *</Label>
                <Input 
                  id="username" 
                  {...form.register('username', { required: 'Username is required' })}
                  placeholder="johndoe"
                />
                {form.formState.errors.username && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.username.message}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input 
                  id="phoneNumber" 
                  {...form.register('phoneNumber')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select value={form.watch('role')} onValueChange={(value) => form.setValue('role', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="sub_admin">Sub Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={form.watch('department')} onValueChange={(value) => form.setValue('department', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept._id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="branchId">Branch *</Label>
                <Select value={form.watch('branchId')} onValueChange={(value) => form.setValue('branchId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((branch: any) => (
                      <SelectItem key={branch._id} value={branch._id}>
                        {branch.branchName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="specialization">Specialization</Label>
                <Input 
                  id="specialization" 
                  {...form.register('specialization')}
                  placeholder="Cardiology, Neurology, etc."
                />
              </div>
              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input 
                  id="employeeId" 
                  {...form.register('employeeId')}
                  placeholder="EMP001"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="joiningDate">Joining Date</Label>
                <Input 
                  id="joiningDate" 
                  type="date"
                  {...form.register('joiningDate')}
                />
              </div>
              <div>
                <Label htmlFor="shiftTiming">Shift Timing</Label>
                <Select value={form.watch('shiftTiming')} onValueChange={(value) => form.setValue('shiftTiming', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="evening">Evening</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="highestQualification">Highest Qualification</Label>
                <Input 
                  id="highestQualification" 
                  {...form.register('highestQualification')}
                  placeholder="MBBS, MD, PhD, etc."
                />
              </div>
              <div>
                <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                <Input 
                  id="yearsOfExperience" 
                  type="number"
                  {...form.register('yearsOfExperience', { valueAsNumber: true })}
                  placeholder="5"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="currentAddress">Current Address</Label>
              <Textarea 
                id="currentAddress" 
                {...form.register('currentAddress')}
                placeholder="Enter current address"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  {...form.register('city')}
                  placeholder="City"
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  {...form.register('state')}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input 
                  id="zipCode" 
                  {...form.register('zipCode')}
                  placeholder="12345"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="isActive" 
                checked={form.watch('isActive')}
                onCheckedChange={(checked) => form.setValue('isActive', checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => {
                  setShowAddDialog(false);
                  setShowEditDialog(false);
                  setSelectedStaff(null);
                  form.reset();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" disabled={addStaffMutation.isPending || updateStaffMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {showAddDialog ? 'Add Staff' : 'Update Staff'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Staff Details Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Staff Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about {selectedStaff?.firstName} {selectedStaff?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStaff && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStaff.profilePhotoUrl} />
                  <AvatarFallback className="bg-blue-500 text-white text-lg">
                    {selectedStaff.firstName[0]}{selectedStaff.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedStaff.firstName} {selectedStaff.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedStaff.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge className={getRoleColor(selectedStaff.role)}>
                      {selectedStaff.role.replace('_', ' ')}
                    </Badge>
                    <Badge className={getStatusColor(selectedStaff.isActive)}>
                      {selectedStaff.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Username</Label>
                  <p className="text-gray-900">{selectedStaff.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <p className="text-gray-900">{selectedStaff.phoneNumber || 'No phone'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <p className="text-gray-900">{selectedStaff.department || 'No department'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Branch</Label>
                  <p className="text-gray-900">{selectedStaff.branchId?.branchName || 'No branch'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Specialization</Label>
                  <p className="text-gray-900">{selectedStaff.specialization || 'No specialization'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Employee ID</Label>
                  <p className="text-gray-900">{selectedStaff.employeeId || 'No ID'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Joining Date</Label>
                  <p className="text-gray-900">
                    {selectedStaff.joiningDate ? new Date(selectedStaff.joiningDate).toLocaleDateString() : 'Not specified'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created Date</Label>
                  <p className="text-gray-900">{new Date(selectedStaff.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Last Login</Label>
                  <p className="text-gray-900">
                    {selectedStaff.lastLogin ? new Date(selectedStaff.lastLogin).toLocaleDateString() : 'Never logged in'}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Created By</Label>
                  <p className="text-gray-900">
                    {selectedStaff.createdBy ? `${selectedStaff.createdBy.firstName} ${selectedStaff.createdBy.lastName}` : 'System'}
                  </p>
                </div>
              </div>

              {selectedStaff.currentAddress && (
                <div>
                  <Label className="text-sm font-medium text-gray-700">Address</Label>
                  <p className="text-gray-900">{selectedStaff.currentAddress}</p>
                  {selectedStaff.city && (
                    <p className="text-gray-600 text-sm">
                      {selectedStaff.city}, {selectedStaff.state} {selectedStaff.zipCode}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedStaff?.firstName} {selectedStaff?.lastName}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedStaff && deleteStaffMutation.mutate(selectedStaff._id)}
              disabled={deleteStaffMutation.isPending}
            >
              {deleteStaffMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement; 