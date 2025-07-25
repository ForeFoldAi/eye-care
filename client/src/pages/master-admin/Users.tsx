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
  Square
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authService } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { ROLES, GENDERS, DEFAULT_ROLE_PERMISSIONS } from '@/lib/constants';

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
  };
  branchId?: {
    _id: string;
    name: string;
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

interface HospitalGroup {
  hospitalId: string;
  hospitalName: string;
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

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: {
    master_admin: number;
    admin: number;
    sub_admin: number;
    doctor: number;
    receptionist: number;
  };
}

// Add user form schema
const addUserSchema = z.object({
  // Basic Information
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
  
  // Role and Assignment
  role: z.enum(['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist']),
  hospitalId: z.string().optional(),
  branchId: z.string().optional(),
  department: z.string().optional(),
  
  // Contact Information
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
  gender: z.enum(['male', 'female', 'other']).optional(),
  dateOfBirth: z.string().optional(),
  emergencyContact: z.string().optional(),
  
  // Professional Information
  specialization: z.string().optional(),
  employeeId: z.string().optional(),
  joiningDate: z.string().optional(),
  shiftTiming: z.enum(['morning', 'evening', 'night', 'other']).optional(),
  yearsOfExperience: z.number().optional(),
  medicalLicenseNumber: z.string().optional(),
  certifications: z.string().optional(),
  highestQualification: z.string().optional(),
  
  // System Settings
  isActive: z.boolean().default(true),
  permissions: z.array(z.string()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AddUserFormData = z.infer<typeof addUserSchema>;

const Users: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<'hierarchy' | 'table'>('hierarchy');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [expandedHospitals, setExpandedHospitals] = useState<Set<string>>(new Set());
  const [selectedHospital, setSelectedHospital] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'overview' | 'detailed' | 'analytics'>('overview');
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'status' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedUserForAction, setSelectedUserForAction] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [scheduleDate, setScheduleDate] = useState<string>('');
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<User | null>(null);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<User | null>(null);
  const [activityLogData, setActivityLogData] = useState<any[]>([]);
  const [isLoadingActivity, setIsLoadingActivity] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Edit user form schema
  const editUserSchema = z.object({
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
    isActive: z.boolean().default(true),
  });

  type EditUserFormData = z.infer<typeof editUserSchema>;

  // Edit user form
  const editUserForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  // Set form values when editing user changes
  React.useEffect(() => {
    if (editingUser) {
      editUserForm.reset({
        firstName: editingUser.firstName,
        lastName: editingUser.lastName,
        email: editingUser.email,
        role: editingUser.role,
        hospitalId: editingUser.hospitalId?._id || 'none',
        branchId: editingUser.branchId?._id || 'none',
        department: editingUser.department || '',
        phoneNumber: editingUser.phoneNumber || '',
        address: editingUser.address || '',
        specialization: editingUser.specialization || '',
        employeeId: editingUser.employeeId || '',
        isActive: editingUser.isActive,
      });
    }
  }, [editingUser, editUserForm]);

  const API_URL = import.meta.env.VITE_API_URL;

  // Add user form
  const addUserForm = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
      role: 'receptionist',
      hospitalId: 'none',
      branchId: 'none',
      department: '',
      phoneNumber: '',
      address: '',
      gender: 'male',
      dateOfBirth: '',
      emergencyContact: '',
      specialization: '',
      employeeId: '',
      joiningDate: '',
      shiftTiming: 'morning',
      yearsOfExperience: undefined,
      medicalLicenseNumber: '',
      certifications: '',
      highestQualification: '',
      isActive: true,
      permissions: [],
    },
  });

  // Fetch users
  const { data: users, isLoading, error, refetch } = useQuery({
    queryKey: ['master-admin', 'users'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // Fetch user statistics
  const { data: stats } = useQuery({
    queryKey: ['master-admin', 'user-stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/stats/overview`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch user statistics');
      return response.json();
    }
  });

  // Fetch hospitals for dropdown
  const { data: hospitals } = useQuery({
    queryKey: ['master-admin', 'hospitals'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/hospitals`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch hospitals');
      return response.json();
    }
  });

  // Fetch branches for dropdown
  const { data: branches } = useQuery({
    queryKey: ['master-admin', 'branches'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      if (!response.ok) throw new Error('Failed to fetch branches');
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
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'user-stats'] });
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
        body: JSON.stringify({
          ...data,
          permissions: DEFAULT_ROLE_PERMISSIONS[data.role] || [],
          // Convert "none" values to undefined for optional fields
          hospitalId: data.hospitalId === 'none' ? undefined : data.hospitalId,
          branchId: data.branchId === 'none' ? undefined : data.branchId,
          department: data.department || undefined,
          phoneNumber: data.phoneNumber || undefined,
          address: data.address || undefined,
          gender: data.gender || undefined,
          dateOfBirth: data.dateOfBirth || undefined,
          emergencyContact: data.emergencyContact || undefined,
          specialization: data.specialization || undefined,
          employeeId: data.employeeId || undefined,
          joiningDate: data.joiningDate || undefined,
          shiftTiming: data.shiftTiming || undefined,
          yearsOfExperience: data.yearsOfExperience || undefined,
          medicalLicenseNumber: data.medicalLicenseNumber || undefined,
          certifications: data.certifications || undefined,
          highestQualification: data.highestQualification || undefined,
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'user-stats'] });
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
        body: JSON.stringify({
          ...data,
          hospitalId: data.hospitalId === 'none' ? undefined : data.hospitalId,
          branchId: data.branchId === 'none' ? undefined : data.branchId,
          department: data.department || undefined,
          phoneNumber: data.phoneNumber || undefined,
          address: data.address || undefined,
          specialization: data.specialization || undefined,
          employeeId: data.employeeId || undefined,
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: ['master-admin', 'user-stats'] });
      editUserForm.reset();
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

  const onSubmitAddUser = (data: AddUserFormData) => {
    addUserMutation.mutate(data);
  };

  const onSubmitEditUser = (data: EditUserFormData) => {
    updateUserMutation.mutate(data);
  };

  const handleCloseAddModal = () => {
    addUserForm.reset();
    setIsAddModalOpen(false);
  };

  const handleCloseEditModal = () => {
    editUserForm.reset();
    setEditingUser(null);
  };

  // Handle send message functionality
  const handleSendMessage = (user: User) => {
    setSelectedUserForAction(user);
    setShowMessageModal(true);
  };

  // Handle view schedule functionality
  const handleViewSchedule = (user: User) => {
    setSelectedUserForAction(user);
    setShowScheduleModal(true);
  };

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

  // Close schedule modal
  const handleCloseScheduleModal = () => {
    setShowScheduleModal(false);
    setScheduleDate('');
    setSelectedUserForAction(null);
  };

  // Bulk actions functionality
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users?.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users?.map((user: User) => user._id) || []);
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete' | 'export') => {
    if (selectedUsers.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select users to perform bulk actions",
        variant: "destructive",
      });
      return;
    }

    switch (action) {
      case 'activate':
        // Implement bulk activate
        toast({
          title: "Bulk Activate",
          description: `Activating ${selectedUsers.length} users...`,
        });
        break;
      case 'deactivate':
        // Implement bulk deactivate
        toast({
          title: "Bulk Deactivate",
          description: `Deactivating ${selectedUsers.length} users...`,
        });
        break;
      case 'delete':
        // Implement bulk delete
        toast({
          title: "Bulk Delete",
          description: `Deleting ${selectedUsers.length} users...`,
        });
        break;
      case 'export':
        handleExportUsers();
        break;
    }
  };

  // Export users functionality
  const handleExportUsers = () => {
    const selectedUsersData = users?.filter((user: User) => selectedUsers.includes(user._id)) || users || [];
    
    const csvContent = [
      ['Name', 'Email', 'Role', 'Department', 'Hospital', 'Branch', 'Status', 'Last Login', 'Created Date'],
      ...selectedUsersData.map((user: User) => [
        `${user.firstName} ${user.lastName}`,
        user.email,
        user.role,
        user.department || 'N/A',
        user.hospitalId?.name || 'N/A',
        user.branchId?.name || 'N/A',
        user.isActive ? 'Active' : 'Inactive',
        user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never',
        new Date(user.createdAt).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${selectedUsersData.length} users to CSV`,
    });
  };

  // User activity log functionality
  const handleViewActivityLog = async (user: User) => {
    setSelectedUserForActivity(user);
    setShowActivityLog(true);
    setIsLoadingActivity(true);

    try {
      // Simulate API call for activity log
      const mockActivityLog = [
        {
          id: 1,
          action: 'Login',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          details: 'User logged in successfully',
          ipAddress: '192.168.1.100'
        },
        {
          id: 2,
          action: 'View Patient',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          details: 'Viewed patient record: John Doe',
          ipAddress: '192.168.1.100'
        },
        {
          id: 3,
          action: 'Update Profile',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          details: 'Updated personal information',
          ipAddress: '192.168.1.100'
        }
      ];

      setActivityLogData(mockActivityLog);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load activity log",
        variant: "destructive",
      });
    } finally {
      setIsLoadingActivity(false);
    }
  };

  // User permissions management
  const handleManagePermissions = (user: User) => {
    setSelectedUserForPermissions(user);
    setShowPermissionsModal(true);
  };

  const handleUpdatePermissions = async (permissions: string[]) => {
    if (!selectedUserForPermissions) return;

    try {
      // Implement API call to update permissions
      toast({
        title: "Permissions Updated",
        description: `Updated permissions for ${selectedUserForPermissions.firstName} ${selectedUserForPermissions.lastName}`,
      });
      setShowPermissionsModal(false);
      setSelectedUserForPermissions(null);
      refetch(); // Refresh user data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update permissions",
        variant: "destructive",
      });
    }
  };

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
      if (user.role === 'master_admin') return; // Skip master admins as they're already handled
      
      const hospitalId = user.hospitalId?._id || 'unassigned';
      const hospitalName = user.hospitalId?.name || 'Unassigned Users';
      
      if (!hospitalMap.has(hospitalId)) {
        hospitalMap.set(hospitalId, {
          hospitalId,
          hospitalName,
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
      
      // Update active/inactive counts
      if (user.isActive) {
        group.stats.activeUsers++;
      } else {
        group.stats.inactiveUsers++;
      }
      
      // Update role counts
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
      
      // Update department stats
      if (user.department) {
        group.departments[user.department] = (group.departments[user.department] || 0) + 1;
      }
      
      // Update branch stats
      if (user.branchId?.name) {
        group.branches[user.branchId.name] = (group.branches[user.branchId.name] || 0) + 1;
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

  // Filter users
  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const hospitalGroups = groupUsersByHospital(filteredUsers);

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

  const getRolePriority = (role: string) => {
    switch (role) {
      case 'master_admin': return 1;
      case 'admin': return 2;
      case 'sub_admin': return 3;
      case 'doctor': return 4;
      case 'receptionist': return 5;
      default: return 6;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'master_admin': return 'System-wide administrator with full access';
      case 'admin': return 'Hospital administrator with management privileges';
      case 'sub_admin': return 'Department or branch administrator';
      case 'doctor': return 'Medical professional with patient care access';
      case 'receptionist': return 'Front desk and administrative support';
      default: return 'User with basic access';
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200';
  };

  const sortUsers = (users: User[]) => {
    return [...users].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'role':
          comparison = getRolePriority(a.role) - getRolePriority(b.role);
          break;
        case 'status':
          comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
          break;
        case 'department':
          comparison = (a.department || '').localeCompare(b.department || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
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

  const renderUserCard = (user: User) => (
    <Card key={user._id} className="bg-white shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-500">{user.email}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <Badge className={`${getRoleColor(user.role)} border`}>
                {getRoleIcon(user.role)}
                <span className="ml-1 capitalize">{user.role.replace('_', ' ')}</span>
              </Badge>
              <Badge className={`${getStatusColor(user.isActive)} border`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
              {user.department && (
                <Badge variant="outline" className="text-xs">
                  {user.department}
                </Badge>
              )}
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
                <Mail className="w-4 h-4 mr-2" />
                Send Message
              </DropdownMenuItem>
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
        
        <div className="space-y-2 text-sm">
          {user.phoneNumber && (
            <div className="flex items-center text-gray-600">
              <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{user.phoneNumber}</span>
            </div>
          )}
          {user.specialization && (
            <div className="flex items-center text-gray-600">
              <Stethoscope className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{user.specialization}</span>
            </div>
          )}
          {user.branchId && (
            <div className="flex items-center text-gray-600">
              <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">{user.branchId.name}</span>
            </div>
          )}
          {user.yearsOfExperience && (
            <div className="flex items-center text-gray-600">
              <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
              <span>{user.yearsOfExperience} years experience</span>
            </div>
          )}
          {user.medicalLicenseNumber && (
            <div className="flex items-center text-gray-600">
              <Shield className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="truncate">License: {user.medicalLicenseNumber}</span>
            </div>
          )}
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            {user.lastLogin && (
              <span>Last login: {new Date(user.lastLogin).toLocaleDateString()}</span>
            )}
          </div>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-blue-900">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedUsers([])}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Selection
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('activate')}
                  className="text-green-600 border-green-200 hover:bg-green-50"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Activate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('deactivate')}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Deactivate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBulkAction('export')}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Selected Users</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleBulkAction('delete')}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Delete Users
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </div>
      )}
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Add New User</span>
                    </DialogTitle>
                    <DialogDescription>
                      Create a new user account with appropriate role and permissions
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Form {...addUserForm}>
                    <form onSubmit={addUserForm.handleSubmit(onSubmitAddUser)} className="space-y-6">
                      {/* Basic Information Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-blue-600" />
                          <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={addUserForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter first name" />
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
                                <FormLabel>Last Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Enter last name" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address *</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder="user@example.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password *</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder="Enter password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="confirmPassword"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Confirm Password *</FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder="Confirm password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Role and Assignment Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Shield className="w-5 h-5 text-green-600" />
                          <h3 className="text-lg font-medium text-gray-900">Role & Assignment</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={addUserForm.control}
                            name="role"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Role *</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select role" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="master_admin">Master Administrator</SelectItem>
                                    <SelectItem value="admin">Hospital Administrator</SelectItem>
                                    <SelectItem value="sub_admin">Branch Manager</SelectItem>
                                    <SelectItem value="doctor">Doctor</SelectItem>
                                    <SelectItem value="receptionist">Receptionist</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="hospitalId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hospital</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select hospital" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Hospital</SelectItem>
                                    {hospitals?.map((hospital: any) => (
                                      <SelectItem key={hospital._id} value={hospital._id}>
                                        {hospital.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="branchId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Branch</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select branch" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">No Branch</SelectItem>
                                    {branches?.map((branch: any) => (
                                      <SelectItem key={branch._id} value={branch._id}>
                                        {branch.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Cardiology, Pediatrics" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Contact Information Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Phone className="w-5 h-5 text-purple-600" />
                          <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={addUserForm.control}
                            name="phoneNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="+91 9876543210" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="gender"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Gender</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select gender" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {GENDERS.map((gender) => (
                                      <SelectItem key={gender.value} value={gender.value}>
                                        {gender.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="dateOfBirth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="emergencyContact"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Emergency Contact</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="Emergency contact number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={3} placeholder="Enter full address" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Professional Information Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Briefcase className="w-5 h-5 text-orange-600" />
                          <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={addUserForm.control}
                            name="specialization"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Specialization</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., Cardiology, Neurology" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="employeeId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Employee ID</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="EMP001" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="joiningDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Joining Date</FormLabel>
                                <FormControl>
                                  <Input {...field} type="date" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="shiftTiming"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Shift Timing</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select shift" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="morning">Morning (6 AM - 2 PM)</SelectItem>
                                    <SelectItem value="evening">Evening (2 PM - 10 PM)</SelectItem>
                                    <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="yearsOfExperience"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    placeholder="5"
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="medicalLicenseNumber"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Medical License Number</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="License number" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="highestQualification"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Highest Qualification</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="e.g., MBBS, MD, PhD" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={addUserForm.control}
                            name="certifications"
                            render={({ field }) => (
                              <FormItem className="md:col-span-2">
                                <FormLabel>Certifications</FormLabel>
                                <FormControl>
                                  <Textarea {...field} rows={2} placeholder="List certifications, separated by commas" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* System Settings Section */}
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-5 h-5 text-red-600" />
                          <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={addUserForm.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Active Account</FormLabel>
                                  <p className="text-sm text-gray-500">
                                    User can log in and access the system
                                  </p>
                                </div>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      {/* Form Actions */}
                      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                        <Button type="button" variant="outline" onClick={handleCloseAddModal}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-blue-600 hover:bg-blue-700"
                          disabled={addUserMutation.isPending}
                        >
                          {addUserMutation.isPending ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Creating User...
                            </>
                          ) : (
                            <>
                              <User className="w-4 h-4 mr-2" />
                              Create User
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <UsersIcon className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(stats?.totalMasterAdmins || 0) + (stats?.totalAdmins || 0) + (stats?.totalSubAdmins || 0) + (stats?.totalDoctors || 0) + (stats?.totalReceptionists || 0)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {stats?.activeUsers || 0} active, {stats?.inactiveUsers || 0} inactive
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Hospitals</CardTitle>
              <Hospital className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{hospitalGroups.length}</div>
              <p className="text-xs text-green-600 mt-1">
                Active hospitals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Doctors</CardTitle>
              <Stethoscope className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats?.totalDoctors || 0}</div>
              <p className="text-xs text-blue-600 mt-1">
                Medical professionals
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Staff</CardTitle>
              <UsersIcon className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {(stats?.totalReceptionists || 0) + (stats?.totalSubAdmins || 0)}
              </div>
              <p className="text-xs text-purple-600 mt-1">
                Support staff
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Filters and Controls */}
        <Card className="bg-white shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Primary Controls */}
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search users by name, email, or department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  {/* Role Filter */}
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by role" />
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

                  {/* Status Filter */}
                  <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                    <SelectTrigger className="w-full sm:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active Only</SelectItem>
                      <SelectItem value="inactive">Inactive Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* View Controls */}
                <div className="flex items-center space-x-2">
                  {/* View Type */}
                  

                  {/* View Mode */}
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
                </div>
              </div>

              {/* Secondary Controls */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                {/* Sort Controls */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Sort by:</span>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="role">Role</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                      <SelectItem value="department">Department</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="p-2"
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedHospitals(new Set(hospitalGroups.map(g => g.hospitalId)))}
                  >
                    Expand All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setExpandedHospitals(new Set())}
                  >
                    Collapse All
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

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
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first user'
                }
              </p>
              {!searchTerm && roleFilter === 'all' && statusFilter === 'all' && (
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
              <div className="space-y-6">
                {hospitalGroups.map((group) => (
                  <Card key={group.hospitalId} className="bg-white shadow-sm">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Hospital className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl font-semibold text-gray-900">
                              {group.hospitalName}
                            </CardTitle>
                            <CardDescription className="text-sm text-gray-600">
                              {group.stats.total} users • {group.stats.activeUsers} active • {group.stats.inactiveUsers} inactive
                            </CardDescription>
                            <div className="flex items-center space-x-4 mt-2">
                              <div className="flex items-center space-x-1 text-xs">
                                <Shield className="w-3 h-3 text-blue-600" />
                                <span className="text-gray-600">{group.stats.admins + group.stats.subAdmins} admins</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs">
                                <Stethoscope className="w-3 h-3 text-green-600" />
                                <span className="text-gray-600">{group.stats.doctors} doctors</span>
                              </div>
                              <div className="flex items-center space-x-1 text-xs">
                                <UserCheck className="w-3 h-3 text-orange-600" />
                                <span className="text-gray-600">{group.stats.receptionists} receptionists</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleHospitalExpansion(group.hospitalId)}
                          >
                            {expandedHospitals.has(group.hospitalId) ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <Collapsible open={expandedHospitals.has(group.hospitalId)}>
                      <CollapsibleContent>
                        <CardContent className="pt-0">
                          {/* Role-based sections */}
                          {group.hospitalId === 'system' ? (
                            // Special handling for System Administration group
                            group.stats.admins > 0 && (
                              <div className="mb-6">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Shield className="w-5 h-5 text-red-600" />
                                  <h3 className="text-lg font-medium text-gray-900">Master Administrators</h3>
                                  <Badge variant="outline">{group.stats.admins}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {sortUsers(group.users.filter(user => user.role === 'master_admin'))
                                    .map(renderUserCard)}
                                </div>
                              </div>
                            )
                          ) : (
                            // Regular hospital groups
                            group.stats.admins > 0 && (
                              <div className="mb-6">
                                <div className="flex items-center space-x-2 mb-3">
                                  <Shield className="w-5 h-5 text-blue-600" />
                                  <h3 className="text-lg font-medium text-gray-900">Administrators</h3>
                                  <Badge variant="outline">{group.stats.admins}</Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {sortUsers(group.users.filter(user => user.role === 'admin'))
                                    .map(renderUserCard)}
                                </div>
                              </div>
                            )
                          )}

                          {group.stats.subAdmins > 0 && (
                            <div className="mb-6">
                              <div className="flex items-center space-x-2 mb-3">
                                <User className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-medium text-gray-900">Sub Administrators</h3>
                                <Badge variant="outline">{group.stats.subAdmins}</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortUsers(group.users.filter(user => user.role === 'sub_admin'))
                                  .map(renderUserCard)}
                              </div>
                            </div>
                          )}

                          {group.stats.doctors > 0 && (
                            <div className="mb-6">
                              <div className="flex items-center space-x-2 mb-3">
                                <Stethoscope className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-medium text-gray-900">Doctors</h3>
                                <Badge variant="outline">{group.stats.doctors}</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortUsers(group.users.filter(user => user.role === 'doctor'))
                                  .map(renderUserCard)}
                              </div>
                            </div>
                          )}

                          {group.stats.receptionists > 0 && (
                            <div className="mb-6">
                              <div className="flex items-center space-x-2 mb-3">
                                <UserCheck className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-medium text-gray-900">Receptionists</h3>
                                <Badge variant="outline">{group.stats.receptionists}</Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {sortUsers(group.users.filter(user => user.role === 'receptionist'))
                                  .map(renderUserCard)}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>
                ))}
              </div>
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
                      {filteredUsers.map((user: User) => (
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

      {/* Edit User Modal */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={editingUser.profilePhotoUrl} alt={`${editingUser.firstName} ${editingUser.lastName}`} />
                    <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                      {editingUser.firstName?.[0]}{editingUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">Edit User</h2>
                    <p className="text-sm text-gray-600">
                      Update information for {editingUser.firstName} {editingUser.lastName}
                    </p>
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Update user information, role, and permissions
              </DialogDescription>
            </DialogHeader>

            <Form {...editUserForm}>
              <form onSubmit={editUserForm.handleSubmit(onSubmitEditUser)} className="space-y-6">
                {/* Basic Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter first name" />
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
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter last name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="user@example.com" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter phone number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="employeeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter employee ID" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Role and Assignment Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-medium text-gray-900">Role & Assignment</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="master_admin">Master Administrator</SelectItem>
                              <SelectItem value="admin">Hospital Administrator</SelectItem>
                              <SelectItem value="sub_admin">Branch Manager</SelectItem>
                              <SelectItem value="doctor">Doctor</SelectItem>
                              <SelectItem value="receptionist">Receptionist</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter department" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="hospitalId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hospital</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select hospital" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Hospital</SelectItem>
                              {hospitals?.map((hospital: any) => (
                                <SelectItem key={hospital._id} value={hospital._id}>
                                  {hospital.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editUserForm.control}
                      name="branchId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Branch</SelectItem>
                              {branches?.map((branch: any) => (
                                <SelectItem key={branch._id} value={branch._id}>
                                  {branch.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Professional Information Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-medium text-gray-900">Professional Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter specialization" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Account Status Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Settings className="w-5 h-5 text-orange-600" />
                    <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={editUserForm.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Account Status</FormLabel>
                            <div className="text-sm text-gray-500">
                              {field.value ? 'User account is active' : 'User account is inactive'}
                            </div>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Current User Information Display */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Current Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Created:</span>
                      <span className="ml-2 font-medium">
                        {new Date(editingUser.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Last Login:</span>
                      <span className="ml-2 font-medium">
                        {editingUser.lastLogin 
                          ? new Date(editingUser.lastLogin).toLocaleString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Current Role:</span>
                      <span className="ml-2 font-medium capitalize">
                        {editingUser.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={editingUser.isActive ? "default" : "secondary"} className="ml-2">
                        {editingUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DialogFooter className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={handleCloseEditModal}>
                      Cancel
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      type="submit"
                      disabled={updateUserMutation.isPending}
                    >
                      {updateUserMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <Edit className="w-4 h-4 mr-2" />
                          Update User
                        </>
                      )}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}

      {/* View User Details Modal */}
      {viewingUser && (
        <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={viewingUser.profilePhotoUrl} alt={`${viewingUser.firstName} ${viewingUser.lastName}`} />
                    <AvatarFallback className="bg-blue-500 text-white text-lg font-semibold">
                      {viewingUser.firstName?.[0]}{viewingUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">{viewingUser.firstName} {viewingUser.lastName}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={viewingUser.isActive ? "default" : "secondary"}>
                        {viewingUser.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {viewingUser.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              </DialogTitle>
              <DialogDescription>
                Comprehensive view of user information, activity, and permissions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Quick Actions */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Quick Actions:</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingUser(null);
                      setEditingUser(viewingUser);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit User
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingUser(null);
                      handleSendMessage(viewingUser);
                    }}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewingUser(null);
                      handleViewSchedule(viewingUser);
                    }}
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    View Schedule
                  </Button>
                </div>
              </div>

              {/* User Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="w-5 h-5" />
                      <span>Basic Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-sm text-gray-900">{viewingUser.firstName} {viewingUser.lastName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900">{viewingUser.email}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Phone</label>
                        <p className="text-sm text-gray-900">{viewingUser.phoneNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Employee ID</label>
                        <p className="text-sm text-gray-900">{viewingUser.employeeId || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                        <p className="text-sm text-gray-900">{viewingUser.emergencyContact || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Address</label>
                        <p className="text-sm text-gray-900">{viewingUser.address || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Briefcase className="w-5 h-5" />
                      <span>Professional Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Role</label>
                        <div className="flex items-center space-x-2">
                          {getRoleIcon(viewingUser.role)}
                          <span className="text-sm text-gray-900 capitalize">{viewingUser.role.replace('_', ' ')}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Department</label>
                        <p className="text-sm text-gray-900">{viewingUser.department || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Specialization</label>
                        <p className="text-sm text-gray-900">{viewingUser.specialization || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Years of Experience</label>
                        <p className="text-sm text-gray-900">{viewingUser.yearsOfExperience || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Medical License</label>
                        <p className="text-sm text-gray-900">{viewingUser.medicalLicenseNumber || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Shift Timing</label>
                        <p className="text-sm text-gray-900 capitalize">{viewingUser.shiftTiming || 'Not specified'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Assignment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Building2 className="w-5 h-5" />
                      <span>Assignment Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Hospital</label>
                        <p className="text-sm text-gray-900">{viewingUser.hospitalId?.name || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Branch</label>
                        <p className="text-sm text-gray-900">{viewingUser.branchId?.name || 'Not assigned'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Joining Date</label>
                        <p className="text-sm text-gray-900">
                          {viewingUser.joiningDate 
                            ? new Date(viewingUser.joiningDate).toLocaleDateString()
                            : 'Not specified'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Account Created</label>
                        <p className="text-sm text-gray-900">
                          {new Date(viewingUser.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="w-5 h-5" />
                      <span>Activity Information</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Last Login</label>
                        <p className="text-sm text-gray-900">
                          {viewingUser.lastLogin 
                            ? new Date(viewingUser.lastLogin).toLocaleString()
                            : 'Never logged in'
                          }
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Account Status</label>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${viewingUser.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                          <span className="text-sm text-gray-900 capitalize">
                            {viewingUser.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Days Since Last Login</label>
                        <p className="text-sm text-gray-900">
                          {viewingUser.lastLogin 
                            ? Math.floor((Date.now() - new Date(viewingUser.lastLogin).getTime()) / (1000 * 60 * 60 * 24))
                            : 'N/A'
                          } days
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Account Age</label>
                        <p className="text-sm text-gray-900">
                          {Math.floor((Date.now() - new Date(viewingUser.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Certifications and Permissions */}
              {((viewingUser.certifications && viewingUser.certifications.length > 0) || (viewingUser.permissions && viewingUser.permissions.length > 0)) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {viewingUser.certifications && viewingUser.certifications.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <GraduationCap className="w-5 h-5" />
                          <span>Certifications</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {viewingUser.certifications.map((cert, index) => (
                            <Badge key={index} variant="outline">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {viewingUser.permissions && viewingUser.permissions.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <Shield className="w-5 h-5" />
                          <span>Permissions</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {viewingUser.permissions.map((permission, index) => (
                            <Badge key={index} variant="secondary">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Role Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Role Description</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">
                    {getRoleDescription(viewingUser.role)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={() => setViewingUser(null)}>
                  Close
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingUser(null);
                    setEditingUser(viewingUser);
                  }}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit User
                </Button>
                <Button
                  onClick={() => {
                    setViewingUser(null);
                    handleSendMessage(viewingUser);
                  }}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

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

      {/* View Schedule Modal */}
      {showScheduleModal && selectedUserForAction && (
        <Dialog open={showScheduleModal} onOpenChange={handleCloseScheduleModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Schedule</DialogTitle>
              <DialogDescription>
                View schedule for {selectedUserForAction.firstName} {selectedUserForAction.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">{selectedUserForAction.firstName} {selectedUserForAction.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium">{selectedUserForAction.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">{selectedUserForAction.department || 'Not assigned'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift:</span>
                      <span className="font-medium">{selectedUserForAction.shiftTiming || 'Not specified'}</span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Schedule Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge variant={selectedUserForAction.isActive ? "default" : "secondary"}>
                        {selectedUserForAction.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Login:</span>
                      <span className="font-medium">
                        {selectedUserForAction.lastLogin 
                          ? new Date(selectedUserForAction.lastLogin).toLocaleDateString()
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Joined:</span>
                      <span className="font-medium">
                        {selectedUserForAction.joiningDate 
                          ? new Date(selectedUserForAction.joiningDate).toLocaleDateString()
                          : 'Not specified'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Schedule Information</h4>
                <div className="text-sm text-blue-800">
                  <p>Schedule details will be displayed here based on user role and availability.</p>
                  <p className="mt-2">
                    {selectedUserForAction.role === 'doctor' && (
                      <>Doctor availability and appointment schedules can be viewed here.</>
                    )}
                    {selectedUserForAction.role === 'receptionist' && (
                      <>Receptionist shift schedules and work hours can be viewed here.</>
                    )}
                    {selectedUserForAction.role === 'admin' && (
                      <>Administrative schedules and work hours can be viewed here.</>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={handleCloseScheduleModal}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Activity Log Modal */}
      {showActivityLog && selectedUserForActivity && (
        <Dialog open={showActivityLog} onOpenChange={() => setShowActivityLog(false)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>User Activity Log</span>
              </DialogTitle>
              <DialogDescription>
                Recent activity for {selectedUserForActivity.firstName} {selectedUserForActivity.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {isLoadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activityLogData.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{activity.action}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                        <p className="text-xs text-gray-400 mt-1">IP: {activity.ipAddress}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActivityLog(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Permissions Management Modal */}
      {showPermissionsModal && selectedUserForPermissions && (
        <Dialog open={showPermissionsModal} onOpenChange={() => setShowPermissionsModal(false)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Manage Permissions</span>
              </DialogTitle>
              <DialogDescription>
                Manage permissions for {selectedUserForPermissions.firstName} {selectedUserForPermissions.lastName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium">
                        {selectedUserForPermissions.firstName} {selectedUserForPermissions.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Role:</span>
                      <span className="font-medium capitalize">
                        {selectedUserForPermissions.role.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Department:</span>
                      <span className="font-medium">
                        {selectedUserForPermissions.department || 'Not assigned'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Current Permissions</h4>
                  <div className="space-y-2">
                    {selectedUserForPermissions.permissions && selectedUserForPermissions.permissions.length > 0 ? (
                      selectedUserForPermissions.permissions.map((permission, index) => (
                        <Badge key={index} variant="secondary" className="mr-1 mb-1">
                          {permission}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No specific permissions assigned</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Available Permissions</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'view_patients', 'edit_patients', 'delete_patients',
                    'view_appointments', 'edit_appointments', 'delete_appointments',
                    'view_reports', 'edit_reports', 'delete_reports',
                    'manage_users', 'manage_settings', 'view_analytics'
                  ].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <Checkbox 
                        id={permission}
                        checked={selectedUserForPermissions.permissions?.includes(permission) || false}
                        onCheckedChange={(checked) => {
                          const currentPermissions = selectedUserForPermissions.permissions || [];
                          const newPermissions = checked
                            ? [...currentPermissions, permission]
                            : currentPermissions.filter(p => p !== permission);
                          
                          setSelectedUserForPermissions({
                            ...selectedUserForPermissions,
                            permissions: newPermissions
                          });
                        }}
                      />
                      <label htmlFor={permission} className="text-sm font-medium text-gray-700 capitalize">
                        {permission.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPermissionsModal(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpdatePermissions(selectedUserForPermissions.permissions || [])}
              >
                <Key className="w-4 h-4 mr-2" />
                Update Permissions
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Users; 