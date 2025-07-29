import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users as UsersIcon, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Shield,
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  X,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Hospital,
  Stethoscope,
  UserCheck,
  AlertCircle,
  Lock,
  Briefcase,
  GraduationCap,
  FileText,
  Clock,
  Activity,
  Download,
  Settings,
  Key,
  CheckSquare,
  Square,
  Save,
  MessageSquare
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  DialogTrigger,
  DialogFooter
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
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

// User interface
interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'master_admin' | 'admin' | 'sub_admin' | 'doctor' | 'receptionist';
  phoneNumber?: string;
  address?: string;
  specialization?: string;
  hospitalId?: {
    _id: string;
    name: string;
    logo?: string;
  };
  branchId?: {
    _id: string;
    branchName: string;
  };
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  permissions?: string[];
  department?: string;
  employeeId?: string;
  emergencyContact?: string;
  joiningDate?: string;
  shiftTiming?: 'morning' | 'evening' | 'night' | 'other';
  yearsOfExperience?: number;
  medicalLicenseNumber?: string;
  certifications?: string[];
  profilePhotoUrl?: string;
}

// Hospital group interface
interface HospitalGroup {
  hospitalId: string;
  hospitalName: string;
  hospitalLogo?: string;
  users: User[];
  stats: {
    total: number;
    admins: number;
    doctors: number;
    receptionists: number;
    subAdmins: number;
    activeUsers: number;
    inactiveUsers: number;
  };
  departments: {
    [key: string]: number;
  };
  branches: {
    [key: string]: number;
  };
}

// Form schemas
const addUserSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist']),
  hospitalId: z.string().optional(),
  branchId: z.string().optional(),
  department: z.string().optional(),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  employeeId: z.string().optional(),
  emergencyContact: z.string().optional(),
  joiningDate: z.string().optional(),
  shiftTiming: z.enum(['morning', 'evening', 'night', 'other']).optional(),
  yearsOfExperience: z.number().optional(),
  medicalLicenseNumber: z.string().optional(),
  certifications: z.array(z.string()).optional(),
  highestQualification: z.string().optional(),
});

const editUserSchema = addUserSchema.partial();

type AddUserFormData = z.infer<typeof addUserSchema>;
type EditUserFormData = z.infer<typeof editUserSchema>;

const API_URL = import.meta.env.VITE_API_URL;

const Users: React.FC = () => {
  const [expandedHospitals, setExpandedHospitals] = useState<Set<string>>(new Set());
  const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set());
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Advanced filter states
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [experienceFilter, setExperienceFilter] = useState('all');
  const [shiftFilter, setShiftFilter] = useState('all');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showHospitalMessageModal, setShowHospitalMessageModal] = useState(false);
  const [showBranchMessageModal, setShowBranchMessageModal] = useState(false);
  const [showHospitalProfileModal, setShowHospitalProfileModal] = useState(false);
  const [selectedHospitalForAction, setSelectedHospitalForAction] = useState<HospitalGroup | null>(null);
  const [selectedBranchForAction, setSelectedBranchForAction] = useState<{ branchName: string; branchId: string; users: User[] } | null>(null);
  const [hospitalMessageText, setHospitalMessageText] = useState('');
  const [branchMessageText, setBranchMessageText] = useState('');
  const [showMasterAdminMessageModal, setShowMasterAdminMessageModal] = useState(false);
  const [showHospitalAdminMessageModal, setShowHospitalAdminMessageModal] = useState(false);
  const [selectedMasterAdmins, setSelectedMasterAdmins] = useState<User[]>([]);
  const [selectedHospitalAdmins, setSelectedHospitalAdmins] = useState<User[]>([]);
  const [masterAdminMessageText, setMasterAdminMessageText] = useState('');
  const [hospitalAdminMessageText, setHospitalAdminMessageText] = useState('');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Forms
  const addUserForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'doctor',
      hospitalId: '',
      branchId: '',
      department: '',
      phoneNumber: '',
      address: '',
      specialization: '',
      employeeId: '',
      emergencyContact: '',
      joiningDate: '',
      shiftTiming: 'morning',
      yearsOfExperience: 0,
      medicalLicenseNumber: '',
      certifications: [],
      highestQualification: '',
    }
  });

  const editUserForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  // Fetch users
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Delete user mutation
  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`${API_URL}/api/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete user');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
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

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (data: AddUserFormData) => {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      addUserForm.reset();
      setIsAddModalOpen(false);
      toast({
        title: 'Success',
        description: 'User created successfully',
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

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async (data: EditUserFormData) => {
      if (!editingUser) throw new Error('No user to update');
      
      const response = await fetch(`${API_URL}/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditingUser(null);
      toast({
        title: 'Success',
        description: 'User updated successfully',
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

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ userId, message }: { userId: string; message: string }) => {
      const response = await fetch(`${API_URL}/api/notifications/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ userId, message })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Message Sent",
        description: "Message has been sent successfully to the user.",
        variant: "default",
      });
      setShowMessageModal(false);
      setMessageText('');
      setSelectedUserForAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  });

  // Send hospital message mutation
  const sendHospitalMessageMutation = useMutation({
    mutationFn: async ({ hospitalId, message }: { hospitalId: string; message: string }) => {
      const response = await fetch(`${API_URL}/api/notifications/send-hospital-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ hospitalId, message })
      });
      if (!response.ok) throw new Error('Failed to send hospital message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hospital Message Sent",
        description: "Message has been sent successfully to all users in the hospital.",
        variant: "default",
      });
      setShowHospitalMessageModal(false);
      setHospitalMessageText('');
      setSelectedHospitalForAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send hospital message",
        variant: "destructive",
      });
    }
  });

  // Send branch message mutation
  const sendBranchMessageMutation = useMutation({
    mutationFn: async ({ branchId, message }: { branchId: string; message: string }) => {
      const response = await fetch(`${API_URL}/api/notifications/send-branch-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ branchId, message })
      });
      if (!response.ok) throw new Error('Failed to send branch message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Branch Message Sent",
        description: "Message has been sent successfully to all users in the branch.",
        variant: "default",
      });
      setShowBranchMessageModal(false);
      setBranchMessageText('');
      setSelectedBranchForAction(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send branch message",
        variant: "destructive",
      });
    }
  });

  // Send master admin message mutation
  const sendMasterAdminMessageMutation = useMutation({
    mutationFn: async ({ userIds, message }: { userIds: string[]; message: string }) => {
      const response = await fetch(`${API_URL}/api/notifications/send-bulk-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ userIds, message })
      });
      if (!response.ok) throw new Error('Failed to send master admin message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Master Admin Message Sent",
        description: "Message has been sent successfully to all master administrators.",
        variant: "default",
      });
      setShowMasterAdminMessageModal(false);
      setMasterAdminMessageText('');
      setSelectedMasterAdmins([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send master admin message",
        variant: "destructive",
      });
    }
  });

  // Send hospital admin message mutation
  const sendHospitalAdminMessageMutation = useMutation({
    mutationFn: async ({ userIds, message }: { userIds: string[]; message: string }) => {
      const response = await fetch(`${API_URL}/api/notifications/send-bulk-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ userIds, message })
      });
      if (!response.ok) throw new Error('Failed to send hospital admin message');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Hospital Admin Message Sent",
        description: "Message has been sent successfully to all hospital administrators.",
        variant: "default",
      });
      setShowHospitalAdminMessageModal(false);
      setHospitalAdminMessageText('');
      setSelectedHospitalAdmins([]);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send hospital admin message",
        variant: "destructive",
      });
    }
  });

  // Form handlers
  const onSubmitAddUser = (data: AddUserFormData) => {
    addUserMutation.mutate(data);
  };

  const onSubmitEditUser = (data: EditUserFormData) => {
    updateUserMutation.mutate(data);
  };

  // Handle message submission
  const handleMessageSubmit = () => {
    if (!selectedUserForAction || !messageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendMessageMutation.mutate({
      userId: selectedUserForAction._id,
      message: messageText.trim()
    });
  };

  // Close message modal
  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageText('');
    setSelectedUserForAction(null);
  };

  // Handle hospital message submission
  const handleHospitalMessageSubmit = () => {
    if (!selectedHospitalForAction || !hospitalMessageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendHospitalMessageMutation.mutate({
      hospitalId: selectedHospitalForAction.hospitalId,
      message: hospitalMessageText.trim()
    });
  };

  // Close hospital message modal
  const handleCloseHospitalMessageModal = () => {
    setShowHospitalMessageModal(false);
    setHospitalMessageText('');
    setSelectedHospitalForAction(null);
  };

  // Handle branch message submission
  const handleBranchMessageSubmit = () => {
    if (!selectedBranchForAction || !branchMessageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendBranchMessageMutation.mutate({
      branchId: selectedBranchForAction.branchId,
      message: branchMessageText.trim()
    });
  };

  // Close branch message modal
  const handleCloseBranchMessageModal = () => {
    setShowBranchMessageModal(false);
    setBranchMessageText('');
    setSelectedBranchForAction(null);
  };

  // Handle master admin message submission
  const handleMasterAdminMessageSubmit = () => {
    if (!selectedMasterAdmins.length || !masterAdminMessageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendMasterAdminMessageMutation.mutate({
      userIds: selectedMasterAdmins.map(user => user._id),
      message: masterAdminMessageText.trim()
    });
  };

  // Close master admin message modal
  const handleCloseMasterAdminMessageModal = () => {
    setShowMasterAdminMessageModal(false);
    setMasterAdminMessageText('');
    setSelectedMasterAdmins([]);
  };

  // Handle hospital admin message submission
  const handleHospitalAdminMessageSubmit = () => {
    if (!selectedHospitalAdmins.length || !hospitalAdminMessageText.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      });
      return;
    }

    sendHospitalAdminMessageMutation.mutate({
      userIds: selectedHospitalAdmins.map(user => user._id),
      message: hospitalAdminMessageText.trim()
    });
  };

  // Close hospital admin message modal
  const handleCloseHospitalAdminMessageModal = () => {
    setShowHospitalAdminMessageModal(false);
    setHospitalAdminMessageText('');
    setSelectedHospitalAdmins([]);
  };

  // Action handlers
  const handleSendMessage = (user: User) => {
    setSelectedUserForAction(user);
    setShowMessageModal(true);
  };

  const handleViewSchedule = (user: User) => {
    toast({
      title: 'View Schedule',
      description: `Schedule for ${user.firstName} ${user.lastName} will be implemented soon.`,
    });
  };

  const handleViewActivityLog = (user: User) => {
    toast({
      title: 'View Activity Log',
      description: `Activity log for ${user.firstName} ${user.lastName} will be implemented soon.`,
    });
  };

  const handleManagePermissions = (user: User) => {
      toast({
      title: 'Manage Permissions',
      description: `Permission management for ${user.firstName} ${user.lastName} will be implemented soon.`,
      });
  };

  // Hospital and Branch action handlers
  const handleViewHospitalProfile = (hospital: HospitalGroup) => {
    setSelectedHospitalForAction(hospital);
    setShowHospitalProfileModal(true);
  };

  const handleSendHospitalMessage = (hospital: HospitalGroup) => {
    setSelectedHospitalForAction(hospital);
    setShowHospitalMessageModal(true);
  };

  const handleDeleteHospital = (hospital: HospitalGroup) => {
    toast({
      title: 'Delete Hospital',
      description: `Delete hospital ${hospital.hospitalName} will be implemented soon.`,
    });
  };

  const handleViewBranchProfile = (branch: { branchName: string; branchId: string; users: User[] }) => {
    toast({
      title: 'View Branch Profile',
      description: `Branch profile for ${branch.branchName} will be implemented soon.`,
    });
  };

  const handleSendBranchMessage = (branch: { branchName: string; branchId: string; users: User[] }) => {
    setSelectedBranchForAction(branch);
    setShowBranchMessageModal(true);
  };

  const handleDeleteBranch = (branch: { branchName: string; branchId: string; users: User[] }) => {
    toast({
      title: 'Delete Branch',
      description: `Delete branch ${branch.branchName} will be implemented soon.`,
    });
  };

  // Master Admin and Hospital Admin action handlers
  const handleViewMasterAdminProfile = (user: User) => {
    setViewingUser(user);
  };

  const handleSendMasterAdminMessage = (masterAdmins: User[]) => {
    setSelectedMasterAdmins(masterAdmins);
    setShowMasterAdminMessageModal(true);
  };

  const handleDeleteMasterAdmin = (user: User) => {
    toast({
      title: 'Delete Master Admin',
      description: `Delete master admin ${user.firstName} ${user.lastName} will be implemented soon.`,
    });
  };

  const handleViewHospitalAdminProfile = (user: User) => {
    setViewingUser(user);
  };

  const handleSendHospitalAdminMessage = (hospitalAdmins: User[]) => {
    setSelectedHospitalAdmins(hospitalAdmins);
    setShowHospitalAdminMessageModal(true);
  };

  const handleDeleteHospitalAdmin = (user: User) => {
    toast({
      title: 'Delete Hospital Admin',
      description: `Delete hospital admin ${user.firstName} ${user.lastName} will be implemented soon.`,
    });
  };

  // Get unique values for filter options
  const uniqueHospitals = Array.from(new Set(users?.map((user: User) => user.hospitalId?.name).filter(Boolean) || [])) as string[];
  const uniqueDepartments = Array.from(new Set(users?.map((user: User) => user.department).filter(Boolean) || [])) as string[];
  const uniqueBranches = Array.from(new Set(users?.map((user: User) => user.branchId?.branchName).filter(Boolean) || [])) as string[];

  // Helper function to check date range
  const isInDateRange = (dateString: string, range: string) => {
    if (range === 'all') return true;
    
    const date = new Date(dateString);
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return date >= startOfDay;
      case 'week':
        const weekAgo = new Date(startOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);
        return date >= weekAgo;
      case 'month':
        const monthAgo = new Date(startOfDay.getTime() - 30 * 24 * 60 * 60 * 1000);
        return date >= monthAgo;
      case 'year':
        const yearAgo = new Date(startOfDay.getTime() - 365 * 24 * 60 * 60 * 1000);
        return date >= yearAgo;
      default:
        return true;
    }
  };

  // Filter and sort users
  const filteredUsers = users?.filter((user: User) => {
    // Basic search filter
    const matchesSearch =
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.hospitalId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.branchId?.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.specialization?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

    // Role filter
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.isActive) ||
      (statusFilter === 'inactive' && !user.isActive);

    // Hospital filter
    const matchesHospital = hospitalFilter === 'all' || 
      user.hospitalId?.name === hospitalFilter;

    // Department filter
    const matchesDepartment = departmentFilter === 'all' || 
      user.department === departmentFilter;

    // Branch filter
    const matchesBranch = branchFilter === 'all' || 
      user.branchId?.branchName === branchFilter;

    // Date range filter (for joining date)
    const matchesDateRange = dateRangeFilter === 'all' || 
      (user.joiningDate && isInDateRange(user.joiningDate, dateRangeFilter));

    // Experience filter
    const matchesExperience = experienceFilter === 'all' || 
      (user.yearsOfExperience !== undefined && 
       ((experienceFilter === '0-2' && user.yearsOfExperience >= 0 && user.yearsOfExperience <= 2) ||
        (experienceFilter === '3-5' && user.yearsOfExperience >= 3 && user.yearsOfExperience <= 5) ||
        (experienceFilter === '6-10' && user.yearsOfExperience >= 6 && user.yearsOfExperience <= 10) ||
        (experienceFilter === '10+' && user.yearsOfExperience > 10)));

    // Shift filter
    const matchesShift = shiftFilter === 'all' || user.shiftTiming === shiftFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesHospital && 
           matchesDepartment && matchesBranch && matchesDateRange && 
           matchesExperience && matchesShift;
  }) || [];

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue: any, bValue: any;

    switch (sortBy) {
      case 'name':
        aValue = `${a.firstName} ${a.lastName}`;
        bValue = `${b.firstName} ${b.lastName}`;
        break;
      case 'role':
        aValue = a.role;
        bValue = b.role;
        break;
      case 'status':
        aValue = a.isActive;
        bValue = b.isActive;
        break;
      case 'department':
        aValue = a.department || '';
        bValue = b.department || '';
        break;
      case 'hospital':
        aValue = a.hospitalId?.name || '';
        bValue = b.hospitalId?.name || '';
        break;
      default:
        aValue = a.firstName;
        bValue = b.firstName;
    }

    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue);
    } else {
      return bValue.localeCompare(aValue);
    }
  });

  // Group users by hospital
  const groupUsersByHospital = (users: User[]): HospitalGroup[] => {
    const hospitalMap = new Map<string, HospitalGroup>();
    
    // Add master admin users to a special "System" group
    const masterAdmins = users.filter(user => user.role === 'master_admin');
    
    if (masterAdmins.length > 0) {
      hospitalMap.set('system', {
        hospitalId: 'system',
        hospitalName: 'System Administration',
        users: masterAdmins,
        stats: {
          total: masterAdmins.length,
          admins: masterAdmins.length,
          doctors: 0,
          receptionists: 0,
          subAdmins: 0,
          activeUsers: masterAdmins.filter(u => u.isActive).length,
          inactiveUsers: masterAdmins.filter(u => !u.isActive).length
        },
        departments: {},
        branches: {}
      });
    }

    // Group other users by hospital
    users.forEach(user => {
      if (user.role === 'master_admin') return;
      
      const hospitalId = user.hospitalId?._id || 'unassigned';
      const hospitalName = user.hospitalId?.name || 'Unassigned Users';
      
      if (!hospitalMap.has(hospitalId)) {
        hospitalMap.set(hospitalId, {
          hospitalId,
          hospitalName,
          hospitalLogo: user.hospitalId?.logo,
          users: [],
          stats: { 
          total: 0, 
          admins: 0, 
          doctors: 0, 
          receptionists: 0, 
          subAdmins: 0,
          activeUsers: 0,
          inactiveUsers: 0
        },
        departments: {},
        branches: {}
        });
      }
      
      const group = hospitalMap.get(hospitalId)!;
      group.users.push(user);
      group.stats.total++;
      
      if (user.isActive) {
        group.stats.activeUsers++;
      } else {
        group.stats.inactiveUsers++;
      }
      
      switch (user.role) {
        case 'admin':
          group.stats.admins++;
          break;
        case 'sub_admin':
          group.stats.subAdmins++;
          break;
        case 'doctor':
          group.stats.doctors++;
          break;
        case 'receptionist':
          group.stats.receptionists++;
          break;
      }
      
      if (user.department) {
        group.departments[user.department] = (group.departments[user.department] || 0) + 1;
      }
      
      if (user.branchId?.branchName) {
        group.branches[user.branchId.branchName] = (group.branches[user.branchId.branchName] || 0) + 1;
      }
    });
    
    return Array.from(hospitalMap.values()).sort((a, b) => {
      if (a.hospitalId === 'system') return -1;
      if (b.hospitalId === 'system') return 1;
      if (a.hospitalId === 'unassigned') return 1;
      if (b.hospitalId === 'unassigned') return -1;
      return a.hospitalName.localeCompare(b.hospitalName);
    });
  };

  // Group users by branch
  const groupUsersByBranch = (users: User[]) => {
    const branchMap = new Map<string, { branchName: string; branchId: string; users: User[] }>();
    
    const unassignedUsers = users.filter(user => !user.branchId?.branchName);
    if (unassignedUsers.length > 0) {
      branchMap.set('unassigned', {
        branchName: 'Unassigned Branch',
        branchId: 'unassigned',
        users: unassignedUsers
      });
    }
    
    users.forEach(user => {
      if (user.branchId?.branchName) {
        const branchName = user.branchId.branchName;
        const branchId = user.branchId._id;
        if (!branchMap.has(branchId)) {
          branchMap.set(branchId, {
            branchName,
            branchId,
            users: []
          });
        }
        branchMap.get(branchId)!.users.push(user);
      }
    });
    
    return Array.from(branchMap.values()).sort((a, b) => {
      if (a.branchName === 'Unassigned Branch') return 1;
      if (b.branchName === 'Unassigned Branch') return -1;
      return a.branchName.localeCompare(b.branchName);
    });
  };

  // Helper functions
  const getBranchStats = (users: User[]) => {
    return {
      total: users.length,
      doctors: users.filter(u => u.role === 'doctor').length,
      receptionists: users.filter(u => u.role === 'receptionist').length,
      admins: users.filter(u => u.role === 'admin').length,
      subAdmins: users.filter(u => u.role === 'sub_admin').length,
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'master_admin': return 'bg-red-100 text-red-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'sub_admin': return 'bg-purple-100 text-purple-800';
      case 'doctor': return 'bg-green-100 text-green-800';
      case 'receptionist': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'master_admin': return <Shield className="w-4 h-4" />;
      case 'admin': return <Building2 className="w-4 h-4" />;
      case 'sub_admin': return <User className="w-4 h-4" />;
      case 'doctor': return <Stethoscope className="w-4 h-4" />;
      case 'receptionist': return <UserCheck className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  const sortUsers = (users: User[]) => {
    return users.sort((a, b) => {
      if (a.isActive !== b.isActive) return b.isActive ? 1 : -1;
      return a.firstName.localeCompare(b.firstName);
    });
  };

  const toggleHospitalExpansion = (hospitalId: string) => {
    const newExpanded = new Set(expandedHospitals);
    if (newExpanded.has(hospitalId)) {
      newExpanded.delete(hospitalId);
    } else {
      newExpanded.add(hospitalId);
    }
    setExpandedHospitals(newExpanded);
  };

  const toggleBranchExpansion = (branchId: string) => {
    const newExpanded = new Set(expandedBranches);
    if (newExpanded.has(branchId)) {
      newExpanded.delete(branchId);
    } else {
      newExpanded.add(branchId);
    }
    setExpandedBranches(newExpanded);
  };

  const toggleRoleExpansion = (roleKey: string) => {
    const newExpanded = new Set(expandedRoles);
    if (newExpanded.has(roleKey)) {
      newExpanded.delete(roleKey);
    } else {
      newExpanded.add(roleKey);
    }
    setExpandedRoles(newExpanded);
  };

    const renderUserCard = (user: User) => (
    <Card key={user._id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
              {user.profilePhotoUrl ? (
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200">
                  <img 
                    src={user.profilePhotoUrl} 
                    alt={`${user.firstName} ${user.lastName} profile`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm hidden">
                    {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </div>
              )}
              <div>
                <div className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
              <div className="flex items-center space-x-2 mt-1">
              <Badge className={`${getRoleColor(user.role)} border`}>
                {getRoleIcon(user.role)}
                <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
              </Badge>
              <Badge className={`${getStatusColor(user.isActive)} border`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>User Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setViewingUser(user)}>
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setEditingUser(user)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit User
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleSendMessage(user)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </DropdownMenuItem>
              {user.role === 'doctor' && (
                <>
              <DropdownMenuItem onClick={() => handleViewSchedule(user)}>
                <Calendar className="w-4 h-4 mr-2" />
                View Schedule
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewActivityLog(user)}>
                <Activity className="w-4 h-4 mr-2" />
                View Activity Log
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleManagePermissions(user)}>
                <Key className="w-4 h-4 mr-2" />
                Manage Permissions
              </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete User
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{user.firstName} {user.lastName}"? This action cannot be undone and will remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate(user._id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete User
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Users</h2>
            <p className="text-gray-600 mb-4">Failed to load user data. Please try again.</p>
            <Button onClick={() => refetch()} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hospitalGroups = groupUsersByHospital(users || []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Users</h1>
              <p className="text-gray-600 mt-1">Manage all users across Forefold's client hospitals</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* View Mode Toggle */}
              <div className="flex border rounded-md">
              <Button 
                  variant={viewMode === 'hierarchy' ? 'default' : 'ghost'}
                size="sm"
                  onClick={() => setViewMode('hierarchy')}
                  className="rounded-r-none"
              >
                  Hierarchy
              </Button>
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="rounded-l-none"
                >
                  Table
                </Button>
              </div>

                <Button
                  variant="outline"
                  size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
                </Button>

                        <Button 
                onClick={() => setIsAddModalOpen(true)}
                          className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add User
                        </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-4">

          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              {/* Basic Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name, email, hospital, department, branch, specialization, or employee ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="master_admin">Master Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="sub_admin">Sub Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full md:w-48">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-2"
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Advanced Filters
                </Button>
              </div>

              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {/* Hospital Filter */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Hospital</Label>
                      <Select value={hospitalFilter} onValueChange={setHospitalFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Hospitals" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Hospitals</SelectItem>
                          {uniqueHospitals.map((hospital: string) => (
                            <SelectItem key={hospital} value={hospital}>
                              {hospital}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Department Filter */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Department</Label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {uniqueDepartments.map((department: string) => (
                            <SelectItem key={department} value={department}>
                              {department}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Branch Filter */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Branch</Label>
                      <Select value={branchFilter} onValueChange={setBranchFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Branches" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Branches</SelectItem>
                          {uniqueBranches.map((branch: string) => (
                            <SelectItem key={branch} value={branch}>
                              {branch}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Joining Date</Label>
                      <Select value={dateRangeFilter} onValueChange={(value: any) => setDateRangeFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">This Week</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                          <SelectItem value="year">This Year</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Experience Filter */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Experience</Label>
                      <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Experience" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Experience</SelectItem>
                          <SelectItem value="0-2">0-2 years</SelectItem>
                          <SelectItem value="3-5">3-5 years</SelectItem>
                          <SelectItem value="6-10">6-10 years</SelectItem>
                          <SelectItem value="10+">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Shift Filter */}
                    <div>
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">Shift</Label>
                      <Select value={shiftFilter} onValueChange={setShiftFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Shifts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Shifts</SelectItem>
                          <SelectItem value="morning">Morning</SelectItem>
                          <SelectItem value="evening">Evening</SelectItem>
                          <SelectItem value="night">Night</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Clear Filters Button */}
                  <div className="flex justify-end mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm('');
                        setRoleFilter('all');
                        setStatusFilter('all');
                        setHospitalFilter('all');
                        setDepartmentFilter('all');
                        setBranchFilter('all');
                        setDateRangeFilter('all');
                        setExperienceFilter('all');
                        setShiftFilter('all');
                      }}
                      className="flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              )}

              {/* Active Filters Summary */}
              {(searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || 
                hospitalFilter !== 'all' || departmentFilter !== 'all' || 
                branchFilter !== 'all' || dateRangeFilter !== 'all' || 
                experienceFilter !== 'all' || shiftFilter !== 'all') && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Active Filters:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Search: "{searchTerm}"
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setSearchTerm('')}
                        />
                      </Badge>
                    )}
                    {roleFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Role: {roleFilter.replace('_', ' ')}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setRoleFilter('all')}
                        />
                      </Badge>
                    )}
                    {statusFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Status: {statusFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setStatusFilter('all')}
                        />
                      </Badge>
                    )}
                    {hospitalFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Hospital: {hospitalFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setHospitalFilter('all')}
                        />
                      </Badge>
                    )}
                    {departmentFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Department: {departmentFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setDepartmentFilter('all')}
                        />
                      </Badge>
                    )}
                    {branchFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Branch: {branchFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setBranchFilter('all')}
                        />
                      </Badge>
                    )}
                    {dateRangeFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Date: {dateRangeFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setDateRangeFilter('all')}
                        />
                      </Badge>
                    )}
                    {experienceFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Experience: {experienceFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setExperienceFilter('all')}
                        />
                      </Badge>
                    )}
                    {shiftFilter !== 'all' && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        Shift: {shiftFilter}
                        <X 
                          className="w-3 h-3 cursor-pointer" 
                          onClick={() => setShiftFilter('all')}
                        />
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        {/* Results Count */}
        {!isLoading && (
          <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                Showing {filteredUsers.length} of {users?.length || 0} users
              </span>
            </div>
            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const csvContent = [
                      ['Name', 'Email', 'Role', 'Hospital', 'Department', 'Branch', 'Status', 'Joining Date'],
                      ...filteredUsers.map(user => [
                        `${user.firstName} ${user.lastName}`,
                        user.email,
                        user.role.replace('_', ' '),
                        user.hospitalId?.name || 'N/A',
                        user.department || 'N/A',
                        user.branchId?.branchName || 'N/A',
                        user.isActive ? 'Active' : 'Inactive',
                        user.joiningDate || 'N/A'
                      ])
                    ].map(row => row.join(',')).join('\n');
                    
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading users...</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card className="bg-white shadow-sm">
            <CardContent className="p-8 text-center">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all' || 
                 hospitalFilter !== 'all' || departmentFilter !== 'all' || 
                 branchFilter !== 'all' || dateRangeFilter !== 'all' || 
                 experienceFilter !== 'all' || shiftFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first user'
                }
              </p>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && 
               hospitalFilter === 'all' && departmentFilter === 'all' && 
               branchFilter === 'all' && dateRangeFilter === 'all' && 
               experienceFilter === 'all' && shiftFilter === 'all' && (
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add User
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'hierarchy' ? (
                <>
                  {/* Header with controls */}
                  <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Hospital Management System</h2>
                      <p className="text-gray-600">Organization hierarchy</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExpandedHospitals(new Set(hospitalGroups.map(g => g.hospitalId)));
                          setExpandedBranches(new Set());
                          setExpandedRoles(new Set());
                        }}
                      >
                        <ChevronDown className="w-4 h-4 mr-2" />
                        Expand All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setExpandedHospitals(new Set());
                          setExpandedBranches(new Set());
                          setExpandedRoles(new Set());
                        }}
                      >
                        <ChevronRight className="w-4 h-4 mr-2" />
                        Collapse All
                      </Button>
                            </div>
                            </div>

                  {/* Master Administrators - Root Level */}
                  <div className="bg-white rounded-lg border border-gray-200">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-red-500 bg-red-50"
                      onClick={() => toggleRoleExpansion('master-admins')}
                    >
                                            <div className="flex items-center space-x-3">
                                     <div className="p-2 bg-red-100 rounded-lg">
                                       <img 
                                         src="/logo.png" 
                                         alt="Master Admin Logo" 
                                         className="w-5 h-5 object-contain"
                                         onError={(e) => {
                                           // Fallback to icon if logo fails to load
                                           const target = e.target as HTMLImageElement;
                                           target.style.display = 'none';
                                           target.nextElementSibling?.classList.remove('hidden');
                                         }}
                                       />
                                       <Shield className="w-5 h-5 text-red-600 hidden" />
                                     </div>
                                     <div>
                          <h3 className="font-semibold text-gray-900">Master Administrators</h3>
                          <p className="text-sm text-gray-600">System-wide administrators with full access</p>
                                     </div>
                      </div>
                                            <div className="flex items-center space-x-3">
                                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
                          {users?.filter((u: User) => u.role === 'master_admin').length || 0}
                                    </Badge>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Master Admin Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleSendMasterAdminMessage(users?.filter((u: User) => u.role === 'master_admin') || [])}>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Send Message to All
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => {
                                          const masterAdmins = users?.filter((u: User) => u.role === 'master_admin') || [];
                                          if (masterAdmins.length > 0) {
                                            handleViewMasterAdminProfile(masterAdmins[0]);
                                          }
                                        }}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          View Sample Profile
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                        {expandedRoles.has('master-admins') ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                                  </div>
                               </div>
                    <Collapsible open={expandedRoles.has('master-admins')}>
                      <CollapsibleContent>
                        <div className="p-4 pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {users?.filter((u: User) => u.role === 'master_admin').map(renderUserCard)}
                               </div>
                             </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Hospitals - Level 1 */}
                  {hospitalGroups.filter(group => group.hospitalId !== 'system').map((group) => (
                    <div key={group.hospitalId} className="bg-white rounded-lg border border-gray-200">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-blue-500 bg-blue-50"
                        onClick={() => toggleHospitalExpansion(group.hospitalId)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            {group.hospitalLogo ? (
                              <img 
                                src={group.hospitalLogo} 
                                alt={`${group.hospitalName} logo`}
                                className="w-5 h-5 object-contain"
                                onError={(e) => {
                                  // Fallback to icon if image fails to load
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  target.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <Hospital className={group.hospitalLogo ? "w-5 h-5 text-blue-600 hidden" : "w-5 h-5 text-blue-600"} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{group.hospitalName}</h3>
                            <p className="text-sm text-gray-600">
                              {group.stats.total} users • {Object.keys(group.branches).length} branches
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                            Hospital
                          </Badge>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuLabel>Hospital Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleViewHospitalProfile(group)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Profile
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSendHospitalMessage(group)}>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Send Message
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Hospital</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{group.hospitalName}"? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                          <AlertDialogAction
                                        onClick={() => handleDeleteHospital(group)}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          
                            {expandedHospitals.has(group.hospitalId) ? (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                        </div>
                      </div>
                    
                    <Collapsible open={expandedHospitals.has(group.hospitalId)}>
                      <CollapsibleContent>
                          <div className="space-y-2 p-4 pt-0">
                            {/* Hospital Administrators - Level 2 */}
                              {group.stats.admins > 0 && (
                              <div className="ml-6 bg-white rounded-lg border border-gray-200">
                                <div
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-purple-500 bg-purple-50"
                                  onClick={() => toggleRoleExpansion(`hospital-${group.hospitalId}-admins`)}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                      <Shield className="w-4 h-4 text-purple-600" />
                                     </div>
                                     <div>
                                      <h4 className="font-medium text-gray-900">Hospital Administrators</h4>
                                      <p className="text-xs text-gray-600">Hospital-level management and oversight</p>
                                     </div>
                                  </div>
                                                                    <div className="flex items-center space-x-3">
                                    <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                                      {group.stats.admins}
                                    </Badge>
                                    
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                          <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuLabel>Hospital Admin Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleSendHospitalAdminMessage(group.users.filter(u => u.role === 'admin'))}>
                                          <MessageSquare className="w-4 h-4 mr-2" />
                                          Send Message to All
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => {
                                          const hospitalAdmins = group.users.filter(u => u.role === 'admin');
                                          if (hospitalAdmins.length > 0) {
                                            handleViewHospitalAdminProfile(hospitalAdmins[0]);
                                          }
                                        }}>
                                          <Eye className="w-4 h-4 mr-2" />
                                          View Sample Profile
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                    
                                    {expandedRoles.has(`hospital-${group.hospitalId}-admins`) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                    )}
                                  </div>
                                     </div>
                                <Collapsible open={expandedRoles.has(`hospital-${group.hospitalId}-admins`)}>
                                  <CollapsibleContent>
                                    <div className="p-3 pt-0">
                                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {group.users.filter(u => u.role === 'admin').map(renderUserCard)}
                                     </div>
                                  </div>
                                  </CollapsibleContent>
                                </Collapsible>
                                </div>
                              )}

                            {/* Branches - Level 2 */}
                            {groupUsersByBranch(group.users).map((branchGroup) => (
                              <div key={branchGroup.branchId} className="ml-6 bg-white rounded-lg border border-gray-200">
                                <div
                                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-green-500 bg-green-50"
                                  onClick={() => toggleBranchExpansion(branchGroup.branchId)}
                                >
                                                                                     <div className="flex items-center space-x-3">
                                             <div className="p-2 bg-green-100 rounded-lg">
                                               <MapPin className="w-4 h-4 text-green-600" />
                                             </div>
                                             <div>
                                      <h4 className="font-medium text-gray-900">{branchGroup.branchName}</h4>
                                               <p className="text-xs text-gray-600">
                                        {branchGroup.users.length} users • {getBranchStats(branchGroup.users).active} active
                                               </p>
                                             </div>
                                           </div>
                                          <div className="flex items-center space-x-3">
                                              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                      Branch
                                              </Badge>
                                              
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                  <DropdownMenuLabel>Branch Actions</DropdownMenuLabel>
                                                  <DropdownMenuItem onClick={() => handleViewBranchProfile(branchGroup)}>
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    View Profile
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => handleSendBranchMessage(branchGroup)}>
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    Send Message
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                      <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Delete
                                                      </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                      <AlertDialogHeader>
                                                        <AlertDialogTitle>Delete Branch</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                          Are you sure you want to delete "{branchGroup.branchName}"? This action cannot be undone.
                                                        </AlertDialogDescription>
                                                      </AlertDialogHeader>
                                                      <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction
                                                          onClick={() => handleDeleteBranch(branchGroup)}
                                                          className="bg-red-600 hover:bg-red-700"
                                                        >
                                                          Delete
                                                        </AlertDialogAction>
                                                      </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                  </AlertDialog>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                              
                                    {expandedBranches.has(branchGroup.branchId) ? (
                                      <ChevronDown className="w-4 h-4 text-gray-500" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4 text-gray-500" />
                                            )}
                                          </div>
                                        </div>
                                        
                                <Collapsible open={expandedBranches.has(branchGroup.branchId)}>
                                  <CollapsibleContent>
                                    <div className="space-y-2 p-3 pt-0">
                                      {/* Branch Administrators - Level 3 */}
                                      {(() => {
                                        const branchAdmins = branchGroup.users.filter(u => u.role === 'sub_admin');
                                        if (branchAdmins.length === 0) return null;

                                        return (
                                          <div className="ml-6 bg-white rounded-lg border border-gray-200">
                                            <div
                                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-orange-500 bg-orange-50"
                                              onClick={() => toggleRoleExpansion(`branch-${branchGroup.branchId}-admins`)}
                                            >
                                              <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-orange-100 rounded-lg">
                                                  <User className="w-4 h-4 text-orange-600" />
                                               </div>
                                                <div>
                                                  <h5 className="font-medium text-gray-900">Branch Administrators</h5>
                                                  <p className="text-xs text-gray-600">Branch-level management</p>
                                              </div>
                                            </div>
                                              <div className="flex items-center space-x-3">
                                                 <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                                                  {branchAdmins.length}
                                                 </Badge>
                                                {expandedRoles.has(`branch-${branchGroup.branchId}-admins`) ? (
                                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                                )}
                                               </div>
                                            </div>
                                            <Collapsible open={expandedRoles.has(`branch-${branchGroup.branchId}-admins`)}>
                                              <CollapsibleContent>
                                                <div className="p-3 pt-0">
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {branchAdmins.map(renderUserCard)}
                                              </div>
                                            </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          </div>
                                        );
                                      })()}

                                      {/* Doctors - Level 3 */}
                                      {(() => {
                                        const doctors = branchGroup.users.filter(u => u.role === 'doctor');
                                        if (doctors.length === 0) return null;

                                        return (
                                          <div className="ml-6 bg-white rounded-lg border border-gray-200">
                                            <div
                                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-emerald-500 bg-emerald-50"
                                              onClick={() => toggleRoleExpansion(`branch-${branchGroup.branchId}-doctors`)}
                                            >
                                              <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-emerald-100 rounded-lg">
                                                  <Stethoscope className="w-4 h-4 text-emerald-600" />
                                                </div>
                                                <div>
                                                  <h5 className="font-medium text-gray-900">Doctors</h5>
                                                  <p className="text-xs text-gray-600">Medical professionals</p>
                                                </div>
                                              </div>
                                              <div className="flex items-center space-x-3">
                                                <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                                                  {doctors.length}
                                                </Badge>
                                                {expandedRoles.has(`branch-${branchGroup.branchId}-doctors`) ? (
                                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                          )}
                                        </div>
                                      </div>
                                            <Collapsible open={expandedRoles.has(`branch-${branchGroup.branchId}-doctors`)}>
                                              <CollapsibleContent>
                                                <div className="p-3 pt-0">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {doctors.map(renderUserCard)}
                                </div>
                                                </div>
                                              </CollapsibleContent>
                                            </Collapsible>
                                          </div>
                                        );
                                      })()}

                                      {/* Receptionists - Level 3 */}
                                      {(() => {
                                        const receptionists = branchGroup.users.filter(u => u.role === 'receptionist');
                                        if (receptionists.length === 0) return null;

                                        return (
                                          <div className="ml-6 bg-white rounded-lg border border-gray-200">
                                            <div
                                              className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 transition-colors border-l-4 border-l-amber-500 bg-amber-50"
                                              onClick={() => toggleRoleExpansion(`branch-${branchGroup.branchId}-receptionists`)}
                                            >
                                              <div className="flex items-center space-x-3">
                                                <div className="p-2 bg-amber-100 rounded-lg">
                                                  <UserCheck className="w-4 h-4 text-amber-600" />
                                     </div>
                                     <div>
                                                  <h5 className="font-medium text-gray-900">Receptionists</h5>
                                                  <p className="text-xs text-gray-600">Front desk and administrative staff</p>
                                     </div>
                                              </div>
                                              <div className="flex items-center space-x-3">
                                                <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
                                                  {receptionists.length}
                                    </Badge>
                                                {expandedRoles.has(`branch-${branchGroup.branchId}-receptionists`) ? (
                                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                                ) : (
                                                  <ChevronRight className="w-4 h-4 text-gray-500" />
                                                )}
                                  </div>
                                  </div>
                                            <Collapsible open={expandedRoles.has(`branch-${branchGroup.branchId}-receptionists`)}>
                                              <CollapsibleContent>
                                                <div className="p-3 pt-0">
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                    {receptionists.map(renderUserCard)}
                                </div>
                            </div>
                      </CollapsibleContent>
                    </Collapsible>
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </CollapsibleContent>
                                </Collapsible>
                              </div>
                ))}
              </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  ))}
                </>
            ) : (
              <Card className="bg-white shadow-sm">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Hospital</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedUsers.map((user: User) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleColor(user.role)}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.hospitalId ? (
                                <div className="text-gray-900">{user.hospitalId.name}</div>
                              ) : (
                                <span className="text-gray-500">Not assigned</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.phoneNumber && (
                                <div className="text-gray-900">{user.phoneNumber}</div>
                              )}
                              {user.address && (
                                <div className="text-gray-500 truncate max-w-xs">{user.address}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </div>
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
                                <DropdownMenuItem onClick={() => setViewingUser(user)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setEditingUser(user)}>
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
                                      <AlertDialogTitle>Delete User</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete "{user.firstName} {user.lastName}"? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteMutation.mutate(user._id)}
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
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
      </div>

      {/* Add User Modal */ }
  <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
        <DialogTitle className="text-2xl font-bold">Add New User</DialogTitle>
              <DialogDescription>
          Create a new user account with appropriate role and permissions
              </DialogDescription>
            </DialogHeader>

      <Form {...addUserForm}>
        <form onSubmit={addUserForm.handleSubmit(onSubmitAddUser)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
              control={addUserForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>First Name</FormLabel>
                          <FormControl>
                    <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
              control={addUserForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>Last Name</FormLabel>
                          <FormControl>
                    <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
          </div>
                    
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
              control={addUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>Email</FormLabel>
                          <FormControl>
                    <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
              control={addUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                      <SelectItem value="master_admin">Master Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="sub_admin">Sub Admin</SelectItem>
                              <SelectItem value="doctor">Doctor</SelectItem>
                              <SelectItem value="receptionist">Receptionist</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddModalOpen(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit" disabled={addUserMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  </Dialog>

  {/* Edit User Modal */ }
  {
    editingUser && (
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions
            </DialogDescription>
          </DialogHeader>

          <Form {...editUserForm}>
            <form onSubmit={editUserForm.handleSubmit(onSubmitEditUser)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                  name="firstName"
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>First Name</FormLabel>
                            <FormControl>
                          <Input {...field} defaultValue={editingUser?.firstName || ''} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editUserForm.control}
                  name="lastName"
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Last Name</FormLabel>
                            <FormControl>
                          <Input {...field} defaultValue={editingUser?.lastName || ''} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                  name="email"
                      render={({ field }) => (
                        <FormItem>
                      <FormLabel>Email</FormLabel>
                          <FormControl>
                          <Input type="email" {...field} defaultValue={editingUser?.email || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editUserForm.control}
                  name="role"
                      render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                                              <Select value={field.value} onValueChange={field.onChange} defaultValue={editingUser?.role || ''}>
                          <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          </FormControl>
                        <SelectContent>
                          <SelectItem value="master_admin">Master Admin</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="sub_admin">Sub Admin</SelectItem>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="receptionist">Receptionist</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                        </FormItem>
                      )}
                    />
                </div>

              <div className="flex justify-end space-x-4">
                    <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingUser(null)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                          Update User
                    </Button>
                  </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
    )
  }

  {/* View User Modal */ }
  {
    viewingUser && (
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
            <DialogTitle className="text-2xl font-bold">User Details</DialogTitle>
              <DialogDescription>
              Comprehensive information about the user
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                {viewingUser?.profilePhotoUrl ? (
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200">
                    <img 
                      src={viewingUser.profilePhotoUrl} 
                      alt={`${viewingUser.firstName} ${viewingUser.lastName} profile`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to initials if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-blue-700 text-lg hidden">
                      {viewingUser.firstName?.[0]}{viewingUser.lastName?.[0]}
                    </div>
                  </div>
                ) : (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={viewingUser?.profilePhotoUrl} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                      {viewingUser?.firstName?.[0]}{viewingUser?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                      <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {viewingUser?.firstName} {viewingUser?.lastName}
                  </h3>
                  <p className="text-gray-600">{viewingUser?.email}</p>
                  <Badge className={getRoleColor(viewingUser?.role || '')}>
                    {getRoleIcon(viewingUser?.role || '')}
                    <span className="ml-1 capitalize">{(viewingUser?.role || '').replace('_', ' ')}</span>
                  </Badge>
                      </div>
                      </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <p className="text-gray-900">{viewingUser?.phoneNumber || 'No Phone'}</p>
                      </div>
                      <div>
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <p className="text-gray-900">{viewingUser?.department || 'No Department'}</p>
                      </div>
                      <div>
                  <Label className="text-sm font-medium text-gray-700">Hospital</Label>
                  <p className="text-gray-900">{viewingUser?.hospitalId?.name || 'Not Assigned'}</p>
                      </div>
                      <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge variant={viewingUser?.isActive ? "default" : "secondary"}>
                    {viewingUser?.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        </div>

            <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setViewingUser(null)}>
                  Close
                </Button>
              <Button onClick={() => {
                    setViewingUser(null);
                    setEditingUser(viewingUser);
              }}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
              </div>
          </div>
          </DialogContent>
        </Dialog>
    )
  }

      {/* Send Message Modal */}
      {showMessageModal && selectedUserForAction && (
        <Dialog open={showMessageModal} onOpenChange={handleCloseMessageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message</DialogTitle>
              <DialogDescription>
                Send a message to {selectedUserForAction.firstName} {selectedUserForAction.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseMessageModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleMessageSubmit}
                  disabled={sendMessageMutation.isPending || !messageText.trim()}
                >
                  {sendMessageMutation.isPending ? (
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
          </DialogContent>
        </Dialog>
      )}

      {/* Send Hospital Message Modal */}
      {showHospitalMessageModal && selectedHospitalForAction && (
        <Dialog open={showHospitalMessageModal} onOpenChange={handleCloseHospitalMessageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Hospital Message</DialogTitle>
              <DialogDescription>
                Send a message to all users in {selectedHospitalForAction.hospitalName} ({selectedHospitalForAction.stats.total} users)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea
                  value={hospitalMessageText}
                  onChange={(e) => setHospitalMessageText(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseHospitalMessageModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleHospitalMessageSubmit}
                  disabled={sendHospitalMessageMutation.isPending || !hospitalMessageText.trim()}
                >
                  {sendHospitalMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send to Hospital
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Branch Message Modal */}
      {showBranchMessageModal && selectedBranchForAction && (
        <Dialog open={showBranchMessageModal} onOpenChange={handleCloseBranchMessageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Branch Message</DialogTitle>
              <DialogDescription>
                Send a message to all users in {selectedBranchForAction.branchName} ({selectedBranchForAction.users.length} users)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea
                  value={branchMessageText}
                  onChange={(e) => setBranchMessageText(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseBranchMessageModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleBranchMessageSubmit}
                  disabled={sendBranchMessageMutation.isPending || !branchMessageText.trim()}
                >
                  {sendBranchMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send to Branch
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hospital Profile Modal */}
      {showHospitalProfileModal && selectedHospitalForAction && (
        <Dialog open={showHospitalProfileModal} onOpenChange={() => setShowHospitalProfileModal(false)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">Hospital Profile</DialogTitle>
              <DialogDescription>
                Comprehensive information about {selectedHospitalForAction.hospitalName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Hospital Header */}
              <div className="flex items-center space-x-4">
                {selectedHospitalForAction.hospitalLogo ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200">
                    <img 
                      src={selectedHospitalForAction.hospitalLogo} 
                      alt={`${selectedHospitalForAction.hospitalName} logo`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl hidden">
                      {selectedHospitalForAction.hospitalName.charAt(0)}
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                    {selectedHospitalForAction.hospitalName.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedHospitalForAction.hospitalName}
                  </h3>
                  <p className="text-gray-600">Hospital ID: {selectedHospitalForAction.hospitalId}</p>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">{selectedHospitalForAction.stats.total}</div>
                  <div className="text-sm text-blue-700">Total Users</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-600">{selectedHospitalForAction.stats.activeUsers}</div>
                  <div className="text-sm text-green-700">Active Users</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-600">{Object.keys(selectedHospitalForAction.branches).length}</div>
                  <div className="text-sm text-purple-700">Branches</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">{Object.keys(selectedHospitalForAction.departments).length}</div>
                  <div className="text-sm text-orange-700">Departments</div>
                </div>
              </div>

              {/* User Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Role Distribution */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">User Roles</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Hospital Admins</span>
                      <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-200">
                        {selectedHospitalForAction.stats.admins}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Sub Admins</span>
                      <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-200">
                        {selectedHospitalForAction.stats.subAdmins}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Doctors</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {selectedHospitalForAction.stats.doctors}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Receptionists</span>
                      <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                        {selectedHospitalForAction.stats.receptionists}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Department Distribution */}
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-3">Departments</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedHospitalForAction.departments).map(([dept, count]) => (
                      <div key={dept} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{dept}</span>
                        <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-200">
                          {count}
                        </Badge>
                      </div>
                    ))}
                    {Object.keys(selectedHospitalForAction.departments).length === 0 && (
                      <p className="text-sm text-gray-500">No departments assigned</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Branches */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Branches</h4>
                <div className="space-y-2">
                  {Object.entries(selectedHospitalForAction.branches).map(([branch, count]) => (
                    <div key={branch} className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{branch}</span>
                      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                        {count} users
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(selectedHospitalForAction.branches).length === 0 && (
                    <p className="text-sm text-gray-500">No branches assigned</p>
                  )}
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-3">Recent Users</h4>
                <div className="space-y-2">
                  {selectedHospitalForAction.users.slice(0, 5).map((user) => (
                    <div key={user._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        {user.profilePhotoUrl ? (
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
                            <img 
                              src={user.profilePhotoUrl} 
                              alt={`${user.firstName} ${user.lastName} profile`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to initials if image fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                target.nextElementSibling?.classList.remove('hidden');
                              }}
                            />
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs hidden">
                              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                            </div>
                          </div>
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-xs">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-sm text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <Badge className={getRoleColor(user.role)}>
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                  {selectedHospitalForAction.users.length === 0 && (
                    <p className="text-sm text-gray-500">No users found</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setShowHospitalProfileModal(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setShowHospitalProfileModal(false);
                  handleSendHospitalMessage(selectedHospitalForAction);
                }}>
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Master Admin Message Modal */}
      {showMasterAdminMessageModal && selectedMasterAdmins.length > 0 && (
        <Dialog open={showMasterAdminMessageModal} onOpenChange={handleCloseMasterAdminMessageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message to Master Administrators</DialogTitle>
              <DialogDescription>
                Send a message to all {selectedMasterAdmins.length} master administrators
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea
                  value={masterAdminMessageText}
                  onChange={(e) => setMasterAdminMessageText(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseMasterAdminMessageModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleMasterAdminMessageSubmit}
                  disabled={sendMasterAdminMessageMutation.isPending || !masterAdminMessageText.trim()}
                >
                  {sendMasterAdminMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send to Master Admins
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Send Hospital Admin Message Modal */}
      {showHospitalAdminMessageModal && selectedHospitalAdmins.length > 0 && (
        <Dialog open={showHospitalAdminMessageModal} onOpenChange={handleCloseHospitalAdminMessageModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Send Message to Hospital Administrators</DialogTitle>
              <DialogDescription>
                Send a message to all {selectedHospitalAdmins.length} hospital administrators
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Message</label>
                <Textarea
                  value={hospitalAdminMessageText}
                  onChange={(e) => setHospitalAdminMessageText(e.target.value)}
                  placeholder="Enter your message here..."
                  rows={4}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleCloseHospitalAdminMessageModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleHospitalAdminMessageSubmit}
                  disabled={sendHospitalAdminMessageMutation.isPending || !hospitalAdminMessageText.trim()}
                >
                  {sendHospitalAdminMessageMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send to Hospital Admins
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div >
  );
};

export default Users; 