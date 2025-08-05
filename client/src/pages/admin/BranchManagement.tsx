import React from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Building2, 
  Plus, 
  MapPin, 
  Phone, 
  Mail, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  Users,
  Activity,
  TrendingUp,
  CheckCircle,
  Star,
  Globe,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { authService, type User as AuthUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface BranchData {
  _id: string;
  branchName: string;
  branchType?: 'main' | 'sub';
  branchCode?: string;
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
  
  // Operational Settings
  workingDays?: string[];
  workingHoursStart?: string;
  workingHoursEnd?: string;
  timezone?: string;
  workingDaySettings?: {
    [day: string]: {
      isWorking: boolean;
      dayType: 'full' | 'half';
      startTime?: string;
      endTime?: string;
    };
  };
  
  // Bank Details
  bankName?: string;
  accountNumber?: string;
  accountHolderName?: string;
  ifscCode?: string;
  bankBranchCode?: string;
  
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
    totalStaff?: number;
  };
  departments?: Array<{
    _id: string;
    name: string;
    doctorCount: number;
  }>;
  services?: Array<{
    _id: string;
    name: string;
    description: string;
  }>;
  specializations?: Array<{
    name: string;
    doctorCount: number;
  }>;
}

interface HospitalInfo {
  _id: string;
  name: string;
  address: string;
  phoneNumber: string;
  email: string;
  website?: string;
  description?: string;
  isActive: boolean;
  settings?: {
    workingHours?: {
      start: string;
      end: string;
    };
    workingDays?: string[];
  };
}

const API_URL = import.meta.env.VITE_API_URL;

const BranchManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = authService.getStoredUser();
  const queryClient = useQueryClient();

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

  // Fetch hospital info
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

  // Fetch departments for the hospital
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

  // Fetch services for the hospital
  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['admin', 'services', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/services/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Fetch doctor specializations for the hospital
  const { data: specializations, isLoading: specializationsLoading } = useQuery({
    queryKey: ['admin', 'specializations', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/doctors/specializations/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch specializations');
      }
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // State for modals
  const [isMessageModalOpen, setIsMessageModalOpen] = React.useState(false);
  const [messageRecipient, setMessageRecipient] = React.useState<BranchData | null>(null);
  const [messageText, setMessageText] = React.useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [branchToDelete, setBranchToDelete] = React.useState<BranchData | null>(null);
  
  // Additional state for new modals
  const [selectedBranch, setSelectedBranch] = React.useState<BranchData | null>(null);
  const [showBranchDetails, setShowBranchDetails] = React.useState(false);
  const [showStaffManagement, setShowStaffManagement] = React.useState(false);
  const [showBranchSettings, setShowBranchSettings] = React.useState(false);
  const [showEditBranch, setShowEditBranch] = React.useState(false);
  
  // Form states for edit branch
  const [editFormData, setEditFormData] = React.useState({
    // Basic Information
    branchName: '',
    branchCode: '',
    email: '',
    phoneNumber: '',
    alternatePhone: '',
    
    // Location Details
    country: 'IN',
    state: '',
    city: '',
    addressLine1: '',
    addressLine2: '',
    postalCode: '',
    googleMapLink: '',
    
    // Operational Settings
    workingDays: [] as string[],
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    timezone: 'IST',
    workingDaySettings: {
      Monday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Tuesday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Wednesday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Thursday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Friday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Saturday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' },
      Sunday: { isWorking: false, dayType: 'full', startTime: '09:00', endTime: '18:00' }
    },
    
    // Bank Details
    bankName: '',
    accountNumber: '',
    accountHolderName: '',
    ifscCode: '',
    bankBranchCode: '',
    
    // Status
    isActive: true
  });
  
  // Staff management state
  const [staffList, setStaffList] = React.useState<any[]>([]);
  const [showAddStaff, setShowAddStaff] = React.useState(false);
  const [showEditStaff, setShowEditStaff] = React.useState(false);
  const [selectedStaff, setSelectedStaff] = React.useState<any>(null);
  const [newStaffData, setNewStaffData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'doctor',
    specialization: '',
    phoneNumber: '',
    department: ''
  });
  const [editStaffData, setEditStaffData] = React.useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'doctor',
    specialization: '',
    phoneNumber: '',
    department: '',
    isActive: true
  });
  
  // Settings state
  const [settingsData, setSettingsData] = React.useState({
    workingHoursStart: '09:00',
    workingHoursEnd: '18:00',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    maxDailyAppointments: 50,
    isActive: true
  });

  // Handler functions
  const handleViewDetails = (branch: BranchData) => {
    // Show branch details in a modal instead of navigation
    setSelectedBranch(branch);
    setShowBranchDetails(true);
  };

  const handleManageStaff = (branch: BranchData) => {
    // Show staff management modal
    setSelectedBranch(branch);
    setShowStaffManagement(true);
  };

  

  const handleEditBranch = (branch: BranchData) => {
    // Show edit branch modal
    setSelectedBranch(branch);
    setShowEditBranch(true);
  };

  const handleDeleteBranch = (branch: BranchData) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteBranch = async () => {
    if (!branchToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/branches/${branchToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Branch Deleted",
          description: `${branchToDelete.branchName} has been successfully deleted.`,
        });
        setIsDeleteModalOpen(false);
        setBranchToDelete(null);
        // Refetch branches
        window.location.reload();
      } else {
        throw new Error('Failed to delete branch');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete branch. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMessage = (type: 'branch' | 'staff', data: BranchData | any) => {
    if (type === 'branch') {
      setMessageRecipient(data);
      setIsMessageModalOpen(true);
    }
  };

  const sendMessage = async () => {
    if (!messageRecipient || !messageText.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify({
          recipientId: messageRecipient.subAdminId._id,
          message: messageText,
          type: 'admin_message',
        }),
      });

      if (response.ok) {
        toast({
          title: "Message Sent",
          description: "Your message has been sent successfully.",
        });
        setIsMessageModalOpen(false);
        setMessageRecipient(null);
        setMessageText('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Mutations
  const updateBranchMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/branches/${selectedBranch?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update branch');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Branch updated successfully" });
      queryClient.invalidateQueries({ queryKey: ['admin', 'branches'] });
      setShowEditBranch(false);
      setSelectedBranch(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update branch", variant: "destructive" });
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/branches/${selectedBranch?._id}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Settings updated successfully" });
      setShowBranchSettings(false);
      setSelectedBranch(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    }
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`${API_URL}/api/branches/${selectedBranch?._id}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to add staff');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Staff member added successfully" });
      setShowAddStaff(false);
      setNewStaffData({ firstName: '', lastName: '', email: '', role: 'doctor', specialization: '', phoneNumber: '', department: '' });
      // Refresh staff list
      fetchStaffList();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add staff member", variant: "destructive" });
    }
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: any }) => {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update staff');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Staff member updated successfully" });
      setShowEditStaff(false);
      setSelectedStaff(null);
      // Refresh staff list
      fetchStaffList();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update staff member", variant: "destructive" });
    }
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete staff');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Staff member removed successfully" });
      setSelectedStaff(null);
      // Refresh staff list
      fetchStaffList();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to remove staff member", variant: "destructive" });
    }
  });

  // Fetch staff list for selected branch
  const fetchStaffList = async () => {
    if (!selectedBranch) return;
    try {
      // First try to fetch from branch-specific endpoint
      const response = await fetch(`${API_URL}/api/branches/${selectedBranch._id}/staff`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      } else {
        // Fallback: fetch all doctors and filter by branch
        const doctorsResponse = await fetch(`${API_URL}/api/doctor-availability/doctors/list`, {
          headers: { 'Authorization': `Bearer ${authService.getToken()}` }
        });
        
        if (doctorsResponse.ok) {
          const doctorsData = await doctorsResponse.json();
          // Filter doctors by branch (assuming branchId is stored in doctor data)
          const branchDoctors = doctorsData.filter((doctor: any) => 
            doctor.branchId === selectedBranch._id || doctor.hospitalId === selectedBranch.hospitalId
          );
          setStaffList(branchDoctors);
        }
      }
    } catch (error) {
      console.error('Failed to fetch staff:', error);
      // Set empty array to prevent undefined errors
      setStaffList([]);
    }
  };

  // Handle edit branch form submission
  const handleEditBranchSubmit = () => {
    updateBranchMutation.mutate(editFormData);
  };

  // Handle settings form submission
  const handleSettingsSubmit = () => {
    updateSettingsMutation.mutate(settingsData);
  };

  // Handle add staff form submission
  const handleAddStaffSubmit = () => {
    addStaffMutation.mutate(newStaffData);
  };

  // Handle edit staff
  const handleEditStaff = (staff: any) => {
    setSelectedStaff(staff);
    setEditStaffData({
      firstName: staff.firstName || '',
      lastName: staff.lastName || '',
      email: staff.email || '',
      role: staff.role || 'doctor',
      specialization: staff.specialization || '',
      phoneNumber: staff.phoneNumber || '',
      department: staff.department || '',
      isActive: staff.isActive !== false
    });
    setShowEditStaff(true);
  };

  // Handle delete staff
  const handleDeleteStaff = (staff: any) => {
    setSelectedStaff(staff);
    // You can add a confirmation modal here if needed
    deleteStaffMutation.mutate(staff._id);
  };

  // Handle edit staff form submission
  const handleEditStaffSubmit = () => {
    updateStaffMutation.mutate({ id: selectedStaff._id, data: editStaffData });
  };

  // Initialize form data when branch is selected
  React.useEffect(() => {
    if (selectedBranch && showEditBranch) {
      setEditFormData({
        // Basic Information
        branchName: selectedBranch.branchName,
        branchCode: selectedBranch.branchCode || '',
        email: selectedBranch.email,
        phoneNumber: selectedBranch.phoneNumber,
        alternatePhone: selectedBranch.alternatePhone || '',
        
        // Location Details
        country: selectedBranch.country || 'IN',
        state: selectedBranch.state,
        city: selectedBranch.city,
        addressLine1: selectedBranch.addressLine1,
        addressLine2: selectedBranch.addressLine2 || '',
        postalCode: selectedBranch.postalCode || '',
        googleMapLink: selectedBranch.googleMapLink || '',
        
        // Operational Settings
        workingDays: selectedBranch.workingDays || [],
        workingHoursStart: selectedBranch.workingHoursStart || '09:00',
        workingHoursEnd: selectedBranch.workingHoursEnd || '18:00',
        timezone: selectedBranch.timezone || 'IST',
        workingDaySettings: {
          Monday: { 
            isWorking: selectedBranch.workingDaySettings?.Monday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Monday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Monday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Monday?.endTime || '18:00' 
          },
          Tuesday: { 
            isWorking: selectedBranch.workingDaySettings?.Tuesday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Tuesday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Tuesday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Tuesday?.endTime || '18:00' 
          },
          Wednesday: { 
            isWorking: selectedBranch.workingDaySettings?.Wednesday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Wednesday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Wednesday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Wednesday?.endTime || '18:00' 
          },
          Thursday: { 
            isWorking: selectedBranch.workingDaySettings?.Thursday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Thursday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Thursday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Thursday?.endTime || '18:00' 
          },
          Friday: { 
            isWorking: selectedBranch.workingDaySettings?.Friday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Friday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Friday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Friday?.endTime || '18:00' 
          },
          Saturday: { 
            isWorking: selectedBranch.workingDaySettings?.Saturday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Saturday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Saturday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Saturday?.endTime || '18:00' 
          },
          Sunday: { 
            isWorking: selectedBranch.workingDaySettings?.Sunday?.isWorking || false, 
            dayType: selectedBranch.workingDaySettings?.Sunday?.dayType || 'full', 
            startTime: selectedBranch.workingDaySettings?.Sunday?.startTime || '09:00', 
            endTime: selectedBranch.workingDaySettings?.Sunday?.endTime || '18:00' 
          }
        },
        
        // Bank Details
        bankName: selectedBranch.bankName || '',
        accountNumber: selectedBranch.accountNumber || '',
        accountHolderName: selectedBranch.accountHolderName || '',
        ifscCode: selectedBranch.ifscCode || '',
        bankBranchCode: selectedBranch.bankBranchCode || '',
        
        // Status
        isActive: selectedBranch.isActive
      });
    }
  }, [selectedBranch, showEditBranch]);

  // Fetch staff when staff management modal opens
  React.useEffect(() => {
    if (showStaffManagement && selectedBranch) {
      fetchStaffList();
    }
  }, [showStaffManagement, selectedBranch]);

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Branch Management</h1>
          <p className="text-gray-600 mt-2">
            Manage all branches for {hospitalInfo?.name || 'your hospital'}
          </p>
        </div>

        {/* Branch Management Card */}
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
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Branch Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {branches?.map((branch: BranchData) => (
                      <TableRow key={branch._id} className="hover:bg-gray-50">
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900">{branch.branchName}</p>
                            <p className="text-sm text-gray-500">{branch.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {branch.branchType || 'sub'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm text-gray-900 flex items-center">
                              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                              {branch.city}, {branch.state}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {branch.addressLine1}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm text-gray-900 flex items-center">
                              <Phone className="w-3 h-3 mr-1" />
                              {branch.phoneNumber}
                            </p>
                            {branch.alternatePhone && (
                              <p className="text-xs text-gray-500">
                                Alt: {branch.alternatePhone}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {branch.subAdminId?.firstName} {branch.subAdminId?.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{branch.subAdminId?.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={branch.isActive ? "default" : "secondary"}>
                            {branch.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(branch)}>
                                <Eye className="mr-2 h-4 w-4" />
                                Branch Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleManageStaff(branch)}>
                                <Users className="mr-2 h-4 w-4" />
                                Branch Team
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem onClick={() => handleSendMessage('branch', branch)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEditBranch(branch)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Branch
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDeleteBranch(branch)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Branch
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
                ×
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Send message to: <strong>{messageRecipient.branchName}</strong>
              </p>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Enter your message..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none"
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsMessageModalOpen(false);
                  setMessageRecipient(null);
                  setMessageText('');
                }}
              >
                Cancel
              </Button>
              <Button onClick={sendMessage} disabled={!messageText.trim()}>
                Send Message
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && branchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Confirm Delete</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setBranchToDelete(null);
                }}
              >
                ×
              </Button>
            </div>
            <div className="mb-4">
              <p className="text-gray-600">
                Are you sure you want to delete <strong>{branchToDelete.branchName}</strong>? 
                This action cannot be undone.
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setBranchToDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={confirmDeleteBranch}
              >
                Delete Branch
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Details Modal */}
      <Dialog open={showBranchDetails} onOpenChange={setShowBranchDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Branch Details</DialogTitle>
            <DialogDescription>Comprehensive information about {selectedBranch?.branchName}</DialogDescription>
          </DialogHeader>
          
          {selectedBranch && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Branch Name</Label>
                      <p className="text-gray-900">{selectedBranch.branchName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-gray-900">{selectedBranch.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Phone</Label>
                      <p className="text-gray-900">{selectedBranch.phoneNumber}</p>
                    </div>
                    {selectedBranch.alternatePhone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Alternate Phone</Label>
                        <p className="text-gray-900">{selectedBranch.alternatePhone}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Location</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Address</Label>
                      <p className="text-gray-900">
                        {selectedBranch.addressLine1}
                        {selectedBranch.addressLine2 && <br />}
                        {selectedBranch.addressLine2}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">City, State</Label>
                      <p className="text-gray-900">{selectedBranch.city}, {selectedBranch.state}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Country</Label>
                      <p className="text-gray-900">{selectedBranch.country}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Postal Code</Label>
                      <p className="text-gray-900">{selectedBranch.postalCode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Manager */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Manager</h3>
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {selectedBranch.subAdminId?.firstName?.[0]}{selectedBranch.subAdminId?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedBranch.subAdminId?.firstName} {selectedBranch.subAdminId?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedBranch.subAdminId?.email}</p>
                    <Badge variant="outline" className="mt-1">Branch Manager</Badge>
                  </div>
                </div>
              </div>

              {/* Statistics */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-gray-600">Total Doctors</p>
                        <p className="text-2xl font-bold text-green-600">{selectedBranch.stats?.totalDoctors || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Other Staff</p>
                        <p className="text-2xl font-bold text-blue-600">{selectedBranch.stats?.totalStaff || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Branch Services */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Services</h3>
                <div className="space-y-4">
                  {/* Medical Departments */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Medical Departments</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {departmentsLoading ? (
                        <div className="col-span-full text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading departments...</p>
                        </div>
                      ) : departments && departments.length > 0 ? (
                        departments.map((dept: any) => (
                          <div key={dept._id} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{dept.doctorCount || 0} doctors</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No departments configured</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Specialized Services */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Specialized Services</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {servicesLoading ? (
                        <div className="col-span-full text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading services...</p>
                        </div>
                      ) : services && services.length > 0 ? (
                        services.map((service: any) => (
                          <div key={service._id} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">{service.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{service.description}</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No specialized services configured</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Doctor Specializations */}
                  <div>
                    <h4 className="text-md font-medium text-gray-800 mb-3">Doctor Specializations</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {specializationsLoading ? (
                        <div className="col-span-full text-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-500">Loading specializations...</p>
                        </div>
                      ) : specializations && specializations.length > 0 ? (
                        specializations.map((spec: any) => (
                          <div key={spec.name} className="bg-gray-50 p-3 rounded-lg border">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-900">{spec.name}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">{spec.doctorCount || 0} specialists</p>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full text-center py-4 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No specializations available</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Staff Management Modal */}
      <Dialog open={showStaffManagement} onOpenChange={setShowStaffManagement}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Branch Team Management</DialogTitle>
            <DialogDescription>Manage Team members for {selectedBranch?.branchName}</DialogDescription>
          </DialogHeader>
          
                      <div className="space-y-6">
           

              {/* Staff List */}
              <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Specialization</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffList.map((staff: any) => (
                    <TableRow key={staff._id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                              {staff.firstName?.[0]}{staff.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-gray-900">{staff.firstName} {staff.lastName}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{staff.role}</Badge>
                      </TableCell>
                      <TableCell>{staff.specialization || 'N/A'}</TableCell>
                      <TableCell>{staff.email}</TableCell>
                      <TableCell>
                        <Badge variant={staff.isActive ? "default" : "secondary"}>
                          {staff.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteStaff(staff)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Staff Modal */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Add Staff Member</DialogTitle>
            <DialogDescription>Add a new staff member to {selectedBranch?.branchName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={newStaffData.firstName}
                  onChange={(e) => setNewStaffData({...newStaffData, firstName: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={newStaffData.lastName}
                  onChange={(e) => setNewStaffData({...newStaffData, lastName: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newStaffData.email}
                  onChange={(e) => setNewStaffData({...newStaffData, email: e.target.value})}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  value={newStaffData.phoneNumber}
                  onChange={(e) => setNewStaffData({...newStaffData, phoneNumber: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={newStaffData.role} onValueChange={(value) => setNewStaffData({...newStaffData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select value={newStaffData.department} onValueChange={(value) => setNewStaffData({...newStaffData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="specialization">Specialization</Label>
              <Input
                id="specialization"
                value={newStaffData.specialization}
                onChange={(e) => setNewStaffData({...newStaffData, specialization: e.target.value})}
                placeholder="Cardiology, Pediatrics, etc."
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowAddStaff(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaffSubmit} disabled={addStaffMutation.isPending}>
              {addStaffMutation.isPending ? 'Adding...' : 'Add Staff Member'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Branch Settings Modal */}
     

      {/* Edit Staff Modal */}
      <Dialog open={showEditStaff} onOpenChange={setShowEditStaff}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Team Member</DialogTitle>
            <DialogDescription>Update information for {selectedStaff?.firstName} {selectedStaff?.lastName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editFirstName">First Name</Label>
                <Input
                  id="editFirstName"
                  value={editStaffData.firstName}
                  onChange={(e) => setEditStaffData({...editStaffData, firstName: e.target.value})}
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="editLastName">Last Name</Label>
                <Input
                  id="editLastName"
                  value={editStaffData.lastName}
                  onChange={(e) => setEditStaffData({...editStaffData, lastName: e.target.value})}
                  placeholder="Doe"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editEmail">Email</Label>
                <Input
                  id="editEmail"
                  type="email"
                  value={editStaffData.email}
                  onChange={(e) => setEditStaffData({...editStaffData, email: e.target.value})}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div>
                <Label htmlFor="editPhoneNumber">Phone Number</Label>
                <Input
                  id="editPhoneNumber"
                  value={editStaffData.phoneNumber}
                  onChange={(e) => setEditStaffData({...editStaffData, phoneNumber: e.target.value})}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editRole">Role</Label>
                <Select value={editStaffData.role} onValueChange={(value) => setEditStaffData({...editStaffData, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="doctor">Doctor</SelectItem>
                    <SelectItem value="nurse">Nurse</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editDepartment">Department</Label>
                <Select value={editStaffData.department} onValueChange={(value) => setEditStaffData({...editStaffData, department: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments?.map((dept: any) => (
                      <SelectItem key={dept._id} value={dept._id}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="editSpecialization">Specialization</Label>
              <Input
                id="editSpecialization"
                value={editStaffData.specialization}
                onChange={(e) => setEditStaffData({...editStaffData, specialization: e.target.value})}
                placeholder="Cardiology, Pediatrics, etc."
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={editStaffData.isActive}
                onCheckedChange={(checked) => setEditStaffData({...editStaffData, isActive: checked})}
              />
              <Label>Active Status</Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditStaff(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditStaffSubmit} disabled={updateStaffMutation.isPending}>
              {updateStaffMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Branch Modal */}
      <Dialog open={showEditBranch} onOpenChange={setShowEditBranch}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Branch</DialogTitle>
            <DialogDescription>Update information for {selectedBranch?.branchName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editBranchName">Branch Name</Label>
                  <Input
                    id="editBranchName"
                    value={editFormData.branchName}
                    onChange={(e) => setEditFormData({...editFormData, branchName: e.target.value})}
                    placeholder="Branch Name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editBranchCode">Branch Code</Label>
                  <Input
                    id="editBranchCode"
                    value={editFormData.branchCode}
                    onChange={(e) => setEditFormData({...editFormData, branchCode: e.target.value})}
                    placeholder="Optional unique identifier"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editEmail">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    placeholder="branch@example.com"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editPhone">Phone Number</Label>
                  <Input
                    id="editPhone"
                    value={editFormData.phoneNumber}
                    onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editAlternatePhone">Alternate Phone</Label>
                  <Input
                    id="editAlternatePhone"
                    value={editFormData.alternatePhone}
                    onChange={(e) => setEditFormData({...editFormData, alternatePhone: e.target.value})}
                    placeholder="+1 (555) 987-6543"
                  />
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editCountry">Country</Label>
                  <Select value={editFormData.country} onValueChange={(value) => setEditFormData({...editFormData, country: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="editState">State</Label>
                  <Input
                    id="editState"
                    value={editFormData.state}
                    onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                    placeholder="State"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editCity">City</Label>
                  <Input
                    id="editCity"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    placeholder="City"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="editAddress1">Address Line 1</Label>
                  <Input
                    id="editAddress1"
                    value={editFormData.addressLine1}
                    onChange={(e) => setEditFormData({...editFormData, addressLine1: e.target.value})}
                    placeholder="Street address, building info"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editAddress2">Address Line 2</Label>
                  <Input
                    id="editAddress2"
                    value={editFormData.addressLine2}
                    onChange={(e) => setEditFormData({...editFormData, addressLine2: e.target.value})}
                    placeholder="Landmark, optional details"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="editPostalCode">ZIP / Postal Code</Label>
                  <Input
                    id="editPostalCode"
                    value={editFormData.postalCode}
                    onChange={(e) => setEditFormData({...editFormData, postalCode: e.target.value})}
                    placeholder="e.g., 90210"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editGoogleMapLink">Google Map Link / GPS</Label>
                  <Input
                    id="editGoogleMapLink"
                    value={editFormData.googleMapLink}
                    onChange={(e) => setEditFormData({...editFormData, googleMapLink: e.target.value})}
                    placeholder="https://maps.google.com/..."
                  />
                </div>
              </div>
            </div>

            {/* Operational Settings */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Operational Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editWorkingHoursStart">Working Hours Start</Label>
                  <Input
                    id="editWorkingHoursStart"
                    type="time"
                    value={editFormData.workingHoursStart}
                    onChange={(e) => setEditFormData({...editFormData, workingHoursStart: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editWorkingHoursEnd">Working Hours End</Label>
                  <Input
                    id="editWorkingHoursEnd"
                    type="time"
                    value={editFormData.workingHoursEnd}
                    onChange={(e) => setEditFormData({...editFormData, workingHoursEnd: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="editTimezone">Timezone</Label>
                  <Select value={editFormData.timezone} onValueChange={(value) => setEditFormData({...editFormData, timezone: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IST">Indian Standard Time (IST)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="EST">Eastern Time (EST)</SelectItem>
                      <SelectItem value="PST">Pacific Time (PST)</SelectItem>
                      <SelectItem value="CST">Central Time (CST)</SelectItem>
                      <SelectItem value="MST">Mountain Time (MST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editBankName">Bank Name</Label>
                  <Input
                    id="editBankName"
                    value={editFormData.bankName}
                    onChange={(e) => setEditFormData({...editFormData, bankName: e.target.value})}
                    placeholder="e.g., State Bank of India"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editAccountNumber">Account Number</Label>
                  <Input
                    id="editAccountNumber"
                    value={editFormData.accountNumber}
                    onChange={(e) => setEditFormData({...editFormData, accountNumber: e.target.value})}
                    placeholder="Enter account number"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editAccountHolderName">Account Holder Name</Label>
                  <Input
                    id="editAccountHolderName"
                    value={editFormData.accountHolderName}
                    onChange={(e) => setEditFormData({...editFormData, accountHolderName: e.target.value})}
                    placeholder="Account holder's full name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editIfscCode">IFSC Code</Label>
                  <Input
                    id="editIfscCode"
                    value={editFormData.ifscCode}
                    onChange={(e) => setEditFormData({...editFormData, ifscCode: e.target.value})}
                    placeholder="e.g., SBIN0001234"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editBankBranchCode">Bank Branch Code</Label>
                  <Input
                    id="editBankBranchCode"
                    value={editFormData.bankBranchCode}
                    onChange={(e) => setEditFormData({...editFormData, bankBranchCode: e.target.value})}
                    placeholder="Optional branch code"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={editFormData.isActive}
                  onCheckedChange={(checked) => setEditFormData({...editFormData, isActive: checked})}
                />
                <Label>Branch Active</Label>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setShowEditBranch(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditBranchSubmit} disabled={updateBranchMutation.isPending}>
              {updateBranchMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BranchManagement; 