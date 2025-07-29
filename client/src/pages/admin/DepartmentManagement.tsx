import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Users, 
  MoreHorizontal,
  Eye,
  Activity,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Heart,
  X,
  Save,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  UserCheck,
  Filter,
  SortAsc,
  SortDesc,
  ChevronDown,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Settings,
  BarChart3
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useShifts, ShiftTiming } from '@/contexts/ShiftContext';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  specialization: string;
}

interface Department {
  _id: string;
  name: string;
  description: string;
  headOfDepartment: string;
  staffCount: number;
  activePatients: number;
  totalAppointments: number;
  isActive: boolean;
  createdAt: string;
  staff: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    role: string;
    specialization: string;
  }>;
  branchId: string | {
    _id: string;
    branchName: string;
  };
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface DepartmentFormData {
  departmentName: string;
  departmentCode: string;
  departmentType: 'clinical' | 'administrative' | 'support' | 'other';
  customDepartmentType: string;
  description: string;
  phoneNumber: string;
  emailAddress: string;
  floorWing: string;
  roomNumberLocation: string;
  headOfDepartment: string;
  staffCountLimit: number;
  createdDate: string;
  createdBy: string;
}

const AdminDepartmentManagement = () => {
  const { shiftTimings, addShift, isLoading: shiftsLoading, error: shiftsError } = useShifts();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = authService.getStoredUser();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Fetch staff members for department head selection
  const { data: staffMembers = [] } = useQuery({
    queryKey: ['admin', 'staff', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/users/staff/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch staff members for department head selection');
        return [];
      }
      
      const data = await response.json();
      return data.filter((staff: any) => 
        staff.role === 'doctor' || staff.role === 'admin' || staff.role === 'sub-admin'
      );
    },
    enabled: !!user?.hospitalId
  });

  // Fetch branches for better branch information
  const { data: branches = [] } = useQuery({
    queryKey: ['admin', 'branches', user?.hospitalId],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/branches/hospital/${user?.hospitalId}`, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        console.warn('Failed to fetch branches');
        return [];
      }
      
      return response.json();
    },
    enabled: !!user?.hospitalId
  });

  // Fetch real departments data from API
  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['admin', 'departments', user?.hospitalId],
    queryFn: async () => {
      console.log('Fetching departments for hospital:', user?.hospitalId);
      console.log('User role:', user?.role);
      
      // Try hospital-level endpoint first (for admin users)
      let endpoint = `${API_URL}/api/departments/hospital/${user?.hospitalId}`;
      
      // If user is not admin, try branch-level endpoint
      if (user?.role !== 'admin') {
        endpoint = `${API_URL}/api/departments/branch/${user?.branchId}`;
        console.log('Using branch endpoint for non-admin user:', endpoint);
      }
      
      const response = await fetch(endpoint, {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(`Failed to fetch departments: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Departments API Response:', data);
      console.log('Total departments fetched:', data.length);
      
      // Log each department with its branch info and patient data
      data.forEach((dept: Department, index: number) => {
        console.log(`Department ${index + 1}:`, {
          name: dept.name,
          branch: typeof dept.branchId === 'object' ? dept.branchId.branchName : dept.branchId,
          createdBy: dept.createdBy?.firstName + ' ' + dept.createdBy?.lastName,
          activePatients: dept.activePatients,
          staffCount: dept.staffCount,
          staffArray: dept.staff,
          totalAppointments: dept.totalAppointments
        });
      });
      
      return data;
    },
    enabled: !!user?.hospitalId
  });

  // Add department mutation - saves to real database
  const addDepartmentMutation = useMutation({
    mutationFn: async (departmentData: DepartmentFormData) => {
      if (!user?.branchId) {
        throw new Error('No branch ID available');
      }

      const response = await fetch(`${API_URL}/api/departments`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: departmentData.departmentName,
          description: departmentData.description,
          branchId: user.branchId,
          headOfDepartment: departmentData.headOfDepartment === 'none' ? '' : departmentData.headOfDepartment,
          departmentCode: departmentData.departmentCode,
          departmentType: departmentData.departmentType,
          phoneNumber: departmentData.phoneNumber,
          emailAddress: departmentData.emailAddress,
          floorWing: departmentData.floorWing,
          roomNumberLocation: departmentData.roomNumberLocation,
          staffCountLimit: departmentData.staffCountLimit,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create department');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      toast({
        title: "Department Created",
        description: "Department has been successfully created and saved to database.",
      });
      setShowAddForm(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create department",
        variant: "destructive",
      });
    }
  });

  // Update department mutation
  const updateDepartmentMutation = useMutation({
    mutationFn: async (departmentData: { id: string; data: Partial<DepartmentFormData> }) => {
      const response = await fetch(`${API_URL}/api/departments/${departmentData.id}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: departmentData.data.departmentName,
          description: departmentData.data.description,
          headOfDepartment: departmentData.data.headOfDepartment === 'none' ? '' : departmentData.data.headOfDepartment,
          isActive: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update department');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      toast({
        title: "Department Updated",
        description: "Department has been successfully updated.",
      });
      setShowEditForm(false);
      setSelectedDepartment(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive",
      });
    }
  });

  // Delete department mutation
  const deleteDepartmentMutation = useMutation({
    mutationFn: async (departmentId: string) => {
      const response = await fetch(`${API_URL}/api/departments/${departmentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'departments'] });
      toast({
        title: "Department Deleted",
        description: "Department has been successfully deleted.",
      });
      setShowDeleteConfirm(false);
      setSelectedDepartment(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete department",
        variant: "destructive",
      });
    }
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showViewDetails, setShowViewDetails] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shiftFormData, setShiftFormData] = useState({
    name: '',
    startTime: '',
    endTime: '',
    description: '',
    departmentId: 'all'
  });
  const [formData, setFormData] = useState<DepartmentFormData>({
    departmentName: '',
    departmentCode: '',
    departmentType: 'clinical',
    customDepartmentType: '',
    description: '',
    phoneNumber: '',
    emailAddress: '',
    floorWing: '',
    roomNumberLocation: '',
    headOfDepartment: 'none',
    staffCountLimit: 0,
    createdDate: new Date().toISOString().split('T')[0],
    createdBy: user ? `${user.firstName} ${user.lastName}` : ''
  });

  // Enhanced filtering with branch information
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept: Department) => {
      const matchesSearch = 
        dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.headOfDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (typeof dept.branchId === 'object' && dept.branchId.branchName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'true' && dept.isActive) ||
        (statusFilter === 'false' && !dept.isActive);
      
      const matchesSize = sizeFilter === 'all' ||
        (sizeFilter === 'small' && dept.staffCount <= 5) ||
        (sizeFilter === 'medium' && dept.staffCount > 5 && dept.staffCount <= 10) ||
        (sizeFilter === 'large' && dept.staffCount > 10);
      
      const matchesBranch = branchFilter === 'all' ||
        (typeof dept.branchId === 'object' && dept.branchId._id === branchFilter) ||
        (typeof dept.branchId === 'string' && dept.branchId === branchFilter);
      
      return matchesSearch && matchesStatus && matchesSize && matchesBranch;
    });
  }, [departments, searchTerm, statusFilter, sizeFilter, branchFilter]);

  // Group departments by branch
  const departmentsByBranch = useMemo(() => {
    console.log('departmentsByBranch calculation - filteredDepartments:', filteredDepartments);
    console.log('departmentsByBranch calculation - departments:', departments);
    const grouped: { [branchId: string]: { branchName: string; departments: Department[] } } = {};
    
    filteredDepartments.forEach((dept: Department) => {
      const branchId = typeof dept.branchId === 'object' ? dept.branchId._id : dept.branchId;
      const branchName = typeof dept.branchId === 'object' ? dept.branchId.branchName : 'Unknown Branch';
      
      if (!grouped[branchId]) {
        grouped[branchId] = {
          branchName,
          departments: []
        };
      }
      
      grouped[branchId].departments.push(dept);
    });
    
    // Sort branches by name and departments within each branch by name
    return Object.fromEntries(
      Object.entries(grouped)
        .sort(([, a], [, b]) => a.branchName.localeCompare(b.branchName))
        .map(([branchId, branchData]) => [
          branchId,
          {
            ...branchData,
            departments: branchData.departments.sort((a, b) => a.name.localeCompare(b.name))
          }
        ])
    );
  }, [filteredDepartments]);

  // Safe calculation functions for patient data
  const calculateTotalPatients = (deptList: Department[]) => {
    return deptList.reduce((sum: number, d: Department) => {
      const patientCount = d.activePatients || 0;
      return sum + patientCount;
    }, 0);
  };

  const calculateTotalStaff = (deptList: Department[]) => {
    console.log('Calculating total staff for departments:', deptList.map(d => ({
      name: d.name,
      staffCount: d.staffCount,
      staffArrayLength: d.staff ? d.staff.length : 0,
      staffArray: d.staff
    })));
    
    return deptList.reduce((sum: number, d: Department) => {
      // Use staff array length if available, otherwise fall back to staffCount
      const staffCount = d.staff && d.staff.length > 0 ? d.staff.length : (d.staffCount || 0);
      console.log(`Department ${d.name}: staffCount=${staffCount}`);
      return sum + staffCount;
    }, 0);
  };

  const calculateTotalAppointments = (deptList: Department[]) => {
    return deptList.reduce((sum: number, d: Department) => {
      const appointmentCount = d.totalAppointments || 0;
      return sum + appointmentCount;
    }, 0);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof DepartmentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle shift form input changes
  const handleShiftInputChange = (field: string, value: any) => {
    setShiftFormData(prev => ({ ...prev, [field]: value }));
  };

  // Generate department code
  const generateDepartmentCode = () => {
    const prefix = formData.departmentName.substring(0, 4).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const code = `${prefix}${randomNum}`;
    handleInputChange('departmentCode', code);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      departmentName: '',
      departmentCode: '',
      departmentType: 'clinical',
      customDepartmentType: '',
      description: '',
      phoneNumber: '',
      emailAddress: '',
      floorWing: '',
      roomNumberLocation: '',
      headOfDepartment: 'none',
      staffCountLimit: 0,
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: user ? `${user.firstName} ${user.lastName}` : ''
    });
  };

  // Reset shift form
  const resetShiftForm = () => {
    setShiftFormData({
      name: '',
      startTime: '',
      endTime: '',
      description: '',
      departmentId: 'all'
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDepartmentMutation.mutate(formData);
  };

  // Handle shift form submission
  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addShift({
        name: shiftFormData.name,
        startTime: shiftFormData.startTime,
        endTime: shiftFormData.endTime,
        description: shiftFormData.description,
        isActive: true,
        departmentId: shiftFormData.departmentId === 'all' ? undefined : shiftFormData.departmentId
      });
      setShowShiftForm(false);
      resetShiftForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create shift",
        variant: "destructive",
      });
    }
  };

  // Action handlers
  const handleViewDetails = (department: Department) => {
    setSelectedDepartment(department);
    setShowViewDetails(true);
  };

  const handleEdit = (department: Department) => {
    setSelectedDepartment(department);
    setFormData({
      departmentName: department.name,
      departmentCode: department.name.substring(0, 4).toUpperCase() + Math.floor(Math.random() * 100).toString().padStart(2, '0'),
      departmentType: 'clinical',
      customDepartmentType: '',
      description: department.description,
      phoneNumber: '',
      emailAddress: '',
      floorWing: '',
      roomNumberLocation: '',
      headOfDepartment: department.headOfDepartment || 'none',
      staffCountLimit: 0,
      createdDate: new Date(department.createdAt).toISOString().split('T')[0],
      createdBy: user ? `${user.firstName} ${user.lastName}` : ''
    });
    setShowEditForm(true);
  };

  const handleDelete = (department: Department) => {
    setSelectedDepartment(department);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (selectedDepartment) {
      deleteDepartmentMutation.mutate(selectedDepartment._id);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDepartment) {
      updateDepartmentMutation.mutate({
        id: selectedDepartment._id,
        data: formData
      });
    }
  };

  // Define columns for the enhanced table
  const columns: ColumnDef<Department>[] = [
    {
      accessorKey: "name",
      header: "Department",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="font-medium">{department.name}</span>
              <div className="text-xs text-gray-500">
                {typeof department.branchId === 'object' ? department.branchId.branchName : 'Unknown Branch'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="max-w-xs truncate" title={department.description}>
            {department.description}
          </div>
        );
      },
    },
    {
      accessorKey: "headOfDepartment",
      header: "Head of Department",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
                                              <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                                  {department.headOfDepartment.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
            </Avatar>
            <span className="text-sm">{department.headOfDepartment}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "staffCount",
      header: "Staff",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-blue-600">{department.staffCount}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "activePatients",
      header: "Patients",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4 text-green-500" />
            <span className="font-medium text-green-600">{department.activePatients}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "totalAppointments",
      header: "Appointments",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="font-medium text-purple-600">{department.totalAppointments}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <Badge variant={department.isActive ? 'default' : 'secondary'}>
            {department.isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
    },
    {
      accessorKey: "createdBy",
      header: "Created By",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                {department.createdBy?.firstName?.[0]}{department.createdBy?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-sm font-medium">
                {department.createdBy?.firstName} {department.createdBy?.lastName}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(department.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const department = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleViewDetails(department)}>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(department)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDelete(department)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const filterOptions = [
    {
      label: "Status",
      value: "isActive",
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
    {
      label: "Department Size",
      value: "staffCount",
      options: [
        { label: "All Sizes", value: "all" },
        { label: "Small (≤5)", value: "small" },
        { label: "Medium (6-10)", value: "medium" },
        { label: "Large (>10)", value: "large" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
            <p className="text-gray-600 mt-1">
              {user?.role === 'admin' 
                ? 'Manage departments across all branches in your hospital'
                : 'Manage departments in your branch'
              }
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center">
                <Building2 className="w-4 h-4 mr-1" />
                {departments.length} Departments
              </span>
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {departments.reduce((sum: number, d: Department) => sum + d.staffCount, 0)} Staff
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-4 h-4 mr-1" />
                {departments.filter((d: Department) => d.isActive).length} Active
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <Button 
              onClick={() => setShowShiftForm(true)}
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Manage Shifts
            </Button>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </div>
        </div>
      </div>

      {/* Add Department Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Add New Department</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new department in your hospital
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section A: Basic Department Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-sm">A</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Basic Department Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentName">Department Name *</Label>
                  <Input
                    id="departmentName"
                    value={formData.departmentName}
                    onChange={(e) => handleInputChange('departmentName', e.target.value)}
                    placeholder="e.g., Cardiology"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="departmentCode">Department Code</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="departmentCode"
                      value={formData.departmentCode}
                      onChange={(e) => handleInputChange('departmentCode', e.target.value)}
                      placeholder="e.g., CARD01"
                    />
                    <Button type="button" variant="outline" onClick={generateDepartmentCode}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="departmentType">Department Type *</Label>
                  <Select value={formData.departmentType} onValueChange={(value) => handleInputChange('departmentType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinical">Clinical</SelectItem>
                      <SelectItem value="administrative">Administrative</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.departmentType === 'other' && (
                  <div>
                    <Label htmlFor="customDepartmentType">Custom Department Type *</Label>
                    <Input
                      id="customDepartmentType"
                      value={formData.customDepartmentType}
                      onChange={(e) => handleInputChange('customDepartmentType', e.target.value)}
                      placeholder="Enter custom department type"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="e.g., Handles heart-related cases and cardiovascular treatments"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Section B: Contact & Location Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">B</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Contact & Location Info</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                      placeholder="Internal extension or direct line"
                      className="pl-10"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emailAddress">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="emailAddress"
                      type="email"
                      value={formData.emailAddress}
                      onChange={(e) => handleInputChange('emailAddress', e.target.value)}
                      placeholder="department@hospital.com"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="floorWing">Floor/Wing</Label>
                  <Select value={formData.floorWing} onValueChange={(value) => handleInputChange('floorWing', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select floor/wing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ground-floor-east">Ground Floor - East Wing</SelectItem>
                      <SelectItem value="ground-floor-west">Ground Floor - West Wing</SelectItem>
                      <SelectItem value="1st-floor-east">1st Floor - East Wing</SelectItem>
                      <SelectItem value="1st-floor-west">1st Floor - West Wing</SelectItem>
                      <SelectItem value="2nd-floor-east">2nd Floor - East Wing</SelectItem>
                      <SelectItem value="2nd-floor-west">2nd Floor - West Wing</SelectItem>
                      <SelectItem value="3rd-floor-east">3rd Floor - East Wing</SelectItem>
                      <SelectItem value="3rd-floor-west">3rd Floor - West Wing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="roomNumberLocation">Room Number/Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="roomNumberLocation"
                      value={formData.roomNumberLocation}
                      onChange={(e) => handleInputChange('roomNumberLocation', e.target.value)}
                      placeholder="e.g., Room 201A"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section C: Department Head */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-sm">C</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Department Head (Optional)</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="headOfDepartment">Head of Department</Label>
                  <Select value={formData.headOfDepartment} onValueChange={(value) => handleInputChange('headOfDepartment', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department head" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Head Selected</SelectItem>
                      {staffMembers.map((staff: any) => (
                        <SelectItem key={staff._id} value={`${staff.firstName} ${staff.lastName}`}>
                          {staff.firstName} {staff.lastName} ({staff.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="staffCountLimit">Staff Count Limit</Label>
                  <Input
                    id="staffCountLimit"
                    type="number"
                    min="0"
                    value={formData.staffCountLimit}
                    onChange={(e) => handleInputChange('staffCountLimit', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 20"
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of staff members</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Section D: Metadata (Read-only) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-700 font-bold text-sm">D</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Metadata</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="createdDate">Created Date</Label>
                  <Input
                    id="createdDate"
                    type="date"
                    value={formData.createdDate}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
                <div>
                  <Label htmlFor="createdBy">Created By</Label>
                  <Input
                    id="createdBy"
                    value={formData.createdBy}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={addDepartmentMutation.isPending}
              >
                {addDepartmentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Department
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Shift Management Modal */}
      <Dialog open={showShiftForm} onOpenChange={setShowShiftForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Shift Management</DialogTitle>
            <DialogDescription>
              Create and manage shift timings for staff members
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Add New Shift Form */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Shift</h3>
              <form onSubmit={handleShiftSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shiftName">Shift Name *</Label>
                    <Input
                      id="shiftName"
                      value={shiftFormData.name}
                      onChange={(e) => handleShiftInputChange('name', e.target.value)}
                      placeholder="e.g., Morning Shift, Night Shift"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="shiftDepartment">Department (Optional)</Label>
                    <Select value={shiftFormData.departmentId || undefined} onValueChange={(value) => handleShiftInputChange('departmentId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map((dept: Department) => (
                          <SelectItem key={dept._id} value={dept._id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time *</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={shiftFormData.startTime}
                      onChange={(e) => handleShiftInputChange('startTime', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time *</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={shiftFormData.endTime}
                      onChange={(e) => handleShiftInputChange('endTime', e.target.value)}
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="shiftDescription">Description</Label>
                  <Textarea
                    id="shiftDescription"
                    value={shiftFormData.description}
                    onChange={(e) => handleShiftInputChange('description', e.target.value)}
                    placeholder="e.g., Early morning shift for morning operations"
                    rows={2}
                  />
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowShiftForm(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetShiftForm}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                  <Button type="submit" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                    <Save className="w-4 h-4 mr-2" />
                    Add Shift
                  </Button>
                </div>
              </form>
            </div>

            <Separator />

            {/* Existing Shifts List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Existing Shifts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shiftTimings.map((shift) => (
                  <Card key={shift._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{shift.name}</h4>
                          <p className="text-sm text-gray-600">{shift.description}</p>
                        </div>
                        <Badge variant={shift.isActive ? 'default' : 'secondary'}>
                          {shift.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Start Time:</span>
                          <span className="font-medium">{shift.startTime}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">End Time:</span>
                          <span className="font-medium">{shift.endTime}</span>
                        </div>
                        {shift.departmentId && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Department:</span>
                            <span className="font-medium">
                              {departments.find((d: Department) => d._id === shift.departmentId)?.name || 'Unknown'}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-end space-x-2 mt-3 pt-3 border-t">
                        <Button variant="ghost" size="sm">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {shiftTimings.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-gray-600">No shifts created yet. Create your first shift above.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Department</DialogTitle>
            <DialogDescription>
              Update the department information
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editDepartmentName">Department Name *</Label>
                <Input
                  id="editDepartmentName"
                  value={formData.departmentName}
                  onChange={(e) => handleInputChange('departmentName', e.target.value)}
                  placeholder="e.g., Cardiology"
                  required
                />
              </div>
              <div>
                <Label htmlFor="editDepartmentCode">Department Code</Label>
                <Input
                  id="editDepartmentCode"
                  value={formData.departmentCode}
                  onChange={(e) => handleInputChange('departmentCode', e.target.value)}
                  placeholder="e.g., CARD01"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="e.g., Handles heart-related cases and cardiovascular treatments"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="editHeadOfDepartment">Head of Department</Label>
              <Select value={formData.headOfDepartment} onValueChange={(value) => handleInputChange('headOfDepartment', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department head" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Head Selected</SelectItem>
                  {staffMembers.map((staff: any) => (
                    <SelectItem key={staff._id} value={`${staff.firstName} ${staff.lastName}`}>
                      {staff.firstName} {staff.lastName} ({staff.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowEditForm(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                disabled={updateDepartmentMutation.isPending}
              >
                {updateDepartmentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Update Department
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Department Details Modal */}
      <Dialog open={showViewDetails} onOpenChange={setShowViewDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Department Details</DialogTitle>
            <DialogDescription>
              Detailed information about the department
            </DialogDescription>
          </DialogHeader>
          
          {selectedDepartment && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Department Name</Label>
                      <p className="text-lg font-semibold">{selectedDepartment.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-gray-900">{selectedDepartment.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Status</Label>
                      <Badge variant={selectedDepartment.isActive ? 'default' : 'secondary'}>
                        {selectedDepartment.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Branch</Label>
                      <p className="text-gray-900">
                        {typeof selectedDepartment.branchId === 'object' 
                          ? selectedDepartment.branchId.branchName 
                          : 'Unknown Branch'
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{selectedDepartment.staffCount}</div>
                        <div className="text-sm text-gray-600">Staff Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{selectedDepartment.activePatients}</div>
                        <div className="text-sm text-gray-600">Active Patients</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{selectedDepartment.totalAppointments}</div>
                        <div className="text-sm text-gray-600">Total Appointments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {selectedDepartment.staff.length}
                        </div>
                        <div className="text-sm text-gray-600">Assigned Staff</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Staff Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Staff Members</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDepartment.staff.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {selectedDepartment.staff.map((staff) => (
                        <div key={staff._id} className="flex items-center space-x-3 p-3 border rounded-lg">
                          <Avatar>
                            <AvatarFallback className="bg-blue-100 text-blue-700">
                              {staff.firstName[0]}{staff.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{staff.firstName} {staff.lastName}</p>
                            <p className="text-sm text-gray-600">{staff.role}</p>
                            {staff.specialization && (
                              <p className="text-xs text-gray-500">{staff.specialization}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-600">No staff members assigned to this department</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Department Head */}
              {selectedDepartment.headOfDepartment && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Department Head</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {selectedDepartment.headOfDepartment.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{selectedDepartment.headOfDepartment}</p>
                        <p className="text-sm text-gray-600">Head of Department</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Creation Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Creation Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created By</Label>
                      <p className="text-gray-900">
                        {selectedDepartment.createdBy?.firstName} {selectedDepartment.createdBy?.lastName}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600">Created Date</Label>
                      <p className="text-gray-900">
                        {new Date(selectedDepartment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this department? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedDepartment && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">{selectedDepartment.name}</p>
                    <p className="text-sm text-red-700">
                      {selectedDepartment.staffCount} staff members • {selectedDepartment.activePatients} patients
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                  disabled={deleteDepartmentMutation.isPending}
                >
                  {deleteDepartmentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Department
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Error Loading Departments</h3>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
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
      )}

      

      {/* Loading State */}
      {isLoading && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900">Loading Departments</h3>
                <p className="text-sm text-gray-600">Fetching department data from the database...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Departments</p>
                <p className="text-3xl font-bold text-blue-800">{departments.length}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Across all branches
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Active Departments</p>
                <p className="text-3xl font-bold text-green-800">{departments.filter((d: Department) => d.isActive).length}</p>
                <p className="text-xs text-green-600 mt-1">
                  {departments.length > 0 ? ((departments.filter((d: Department) => d.isActive).length / departments.length) * 100).toFixed(1) : '0'}% active
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Staff</p>
                <p className="text-3xl font-bold text-purple-800">{calculateTotalStaff(departments)}</p>
                <p className="text-xs text-purple-600 mt-1">
                  Across all departments
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Total Patients</p>
                <p className="text-3xl font-bold text-orange-800">{calculateTotalPatients(departments)}</p>
                <p className="text-xs text-orange-600 mt-1">
                  Currently active
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Search and Filters */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search departments by name, description, branch, or head of department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Status Filter */}
              <div className="w-full lg:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-12 border-gray-300">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Size Filter */}
              <div className="w-full lg:w-48">
                <Select value={sizeFilter} onValueChange={setSizeFilter}>
                  <SelectTrigger className="h-12 border-gray-300">
                    <SelectValue placeholder="Filter by size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sizes</SelectItem>
                    <SelectItem value="small">Small (≤5 staff)</SelectItem>
                    <SelectItem value="medium">Medium (6-10 staff)</SelectItem>
                    <SelectItem value="large">Large (&gt;10 staff)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Branch Filter */}
              <div className="w-full lg:w-48">
                <Select value={branchFilter} onValueChange={setBranchFilter}>
                  <SelectTrigger className="h-12 border-gray-300">
                    <SelectValue placeholder="Filter by branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {Array.from(new Set(departments.map((dept: Department) => 
                      typeof dept.branchId === 'object' ? dept.branchId._id : dept.branchId
                    ))).map((branchId: unknown) => {
                      const branchIdStr = branchId as string;
                                              const dept = departments.find((d: Department) => 
                          (typeof d.branchId === 'object' ? d.branchId._id : d.branchId) === branchIdStr
                        );
                        const branchName = typeof dept?.branchId === 'object' ? dept.branchId.branchName : 'Unknown Branch';
                        return (
                          <SelectItem key={branchIdStr} value={branchIdStr}>
                            {branchName}
                          </SelectItem>
                        );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Clear Filters Button */}
              {(searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' || branchFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                    setSizeFilter('all');
                    setBranchFilter('all');
                  }}
                  className="h-12 px-6 border-gray-300 hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
            
            {/* Active Filters Display */}
            {(searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' || branchFilter !== 'all') && (
              <div className="flex flex-wrap gap-2 pt-2">
                {searchTerm && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    Search: "{searchTerm}"
                  </Badge>
                )}
                {statusFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    Status: {statusFilter === 'true' ? 'Active' : 'Inactive'}
                  </Badge>
                )}
                {sizeFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                    Size: {sizeFilter === 'small' ? 'Small' : sizeFilter === 'medium' ? 'Medium' : 'Large'}
                  </Badge>
                )}
                {branchFilter !== 'all' && (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                    Branch: {(() => {
                      const dept = departments.find((d: Department) => 
                        (typeof d.branchId === 'object' ? d.branchId._id : d.branchId) === branchFilter
                      );
                      return typeof dept?.branchId === 'object' ? dept.branchId.branchName : 'Unknown Branch';
                    })()}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Departments Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Departments</CardTitle>
              <CardDescription>
                {filteredDepartments.length} of {departments.length} department(s) found
                {(searchTerm || statusFilter !== 'all' || sizeFilter !== 'all') && (
                  <span className="ml-2 text-blue-600">
                    (filtered)
                  </span>
                )}
              </CardDescription>
            </div>
            {(searchTerm || statusFilter !== 'all' || sizeFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setSizeFilter('all');
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="branch-view" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="branch-view" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Branch View
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Card View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="branch-view" className="mt-6">
              <div className="space-y-8">
                {Object.keys(departmentsByBranch).length > 0 ? (
                  Object.entries(departmentsByBranch).map(([branchId, branchData]) => (
                    <Card key={branchId} className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-blue-700" />
                            </div>
                            <div>
                              <CardTitle className="text-xl text-blue-900">{branchData.branchName}</CardTitle>
                              <CardDescription className="text-blue-700">
                                {branchData.departments.length} department{branchData.departments.length !== 1 ? 's' : ''} • 
                                {calculateTotalStaff(branchData.departments)} total staff • 
                                {branchData.departments.filter(dept => dept.isActive).length} active
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                              Branch ID: {branchId}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Branch Summary Stats */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div className="bg-white rounded-lg p-4 border border-blue-200">
                              <div className="flex items-center space-x-2">
                                <Building2 className="w-5 h-5 text-blue-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Departments</p>
                                  <p className="text-2xl font-bold text-blue-600">{branchData.departments.length}</p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-green-200">
                              <div className="flex items-center space-x-2">
                                <Users className="w-5 h-5 text-green-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                                  <p className="text-2xl font-bold text-green-600">
                                    {calculateTotalStaff(branchData.departments)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-purple-200">
                              <div className="flex items-center space-x-2">
                                <Heart className="w-5 h-5 text-purple-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Patients</p>
                                  <p className="text-2xl font-bold text-purple-600">
                                    {calculateTotalPatients(branchData.departments)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg p-4 border border-orange-200">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-5 h-5 text-orange-600" />
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Appointments</p>
                                  <p className="text-2xl font-bold text-orange-600">
                                    {calculateTotalAppointments(branchData.departments)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Departments Table */}
                          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                              <h3 className="text-lg font-semibold text-gray-900">Departments</h3>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Department
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Description
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Head
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Staff
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Patients
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Appointments
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                      Actions
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                  {branchData.departments.map((department) => (
                                    <tr key={department._id} className="hover:bg-gray-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-3">
                                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                                            <Building2 className="w-4 h-4 text-emerald-600" />
                                          </div>
                                          <div>
                                            <div className="text-sm font-medium text-gray-900">{department.name}</div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 max-w-xs truncate" title={department.description}>
                                          {department.description}
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                          <Avatar className="w-6 h-6">
                                            <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                                              {department.headOfDepartment.split(' ').map((n: string) => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm text-gray-900">{department.headOfDepartment}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          <Users className="w-4 h-4 text-blue-500" />
                                          <span className="text-sm font-medium text-blue-600">{department.staffCount || 0}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          <Activity className="w-4 h-4 text-green-500" />
                                          <span className="text-sm font-medium text-green-600">{department.activePatients || 0}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center space-x-2">
                                          <Calendar className="w-4 h-4 text-purple-500" />
                                          <span className="text-sm font-medium text-purple-600">{department.totalAppointments || 0}</span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <Badge variant={department.isActive ? 'default' : 'secondary'}>
                                          {department.isActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                                                  <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetails(department)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(department)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(department)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' || branchFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria' 
                        : 'Get started by creating your first department'
                      }
                    </p>
                    
                    {/* Debug Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>Total Departments: {departments?.length || 0}</p>
                        <p>Filtered Departments: {filteredDepartments.length}</p>
                        <p>Departments By Branch Keys: {Object.keys(departmentsByBranch).length}</p>
                        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                        <p>Error: {error ? error.message : 'None'}</p>
                      </div>
                    </div>
                    
                    {searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' || branchFilter !== 'all' ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setSizeFilter('all');
                          setBranchFilter('all');
                        }}
                        className="mr-2"
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Department
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cards" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department: Department) => (
                    <Card key={department._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{department.name}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant={department.isActive ? 'default' : 'secondary'}>
                                  {department.isActive ? 'Active' : 'Inactive'}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {typeof department.branchId === 'object' ? department.branchId.branchName : 'Unknown Branch'}
                                </Badge>
                              </div>
                            </div>
                          </div>
                                                                  <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleViewDetails(department)}>
                                              <Eye className="w-4 h-4 mr-2" />
                                              View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleEdit(department)}>
                                              <Edit className="w-4 h-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              className="text-red-600"
                                              onClick={() => handleDelete(department)}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {department.description}
                        </p>
                        
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div>
                            <div className="text-2xl font-bold text-blue-600">{department.staffCount || 0}</div>
                            <div className="text-xs text-gray-500">Staff</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{department.activePatients || 0}</div>
                            <div className="text-xs text-gray-500">Patients</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{department.totalAppointments || 0}</div>
                            <div className="text-xs text-gray-500">Appointments</div>
                          </div>
                        </div>
                        
                        {department.headOfDepartment && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                                  {department.headOfDepartment.split(' ').map((n: string) => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-xs font-medium text-gray-900">Department Head</div>
                                <div className="text-xs text-gray-600">{department.headOfDepartment}</div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Creator Information */}
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                                {department.createdBy?.firstName?.[0]}{department.createdBy?.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-xs font-medium text-gray-900">Created by</div>
                              <div className="text-xs text-gray-600">
                                {department.createdBy?.firstName} {department.createdBy?.lastName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(department.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' || branchFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria' 
                        : 'Get started by creating your first department'
                      }
                    </p>
                    
                    {/* Debug Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left max-w-md mx-auto">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Debug Info:</h4>
                      <div className="text-xs text-gray-600 space-y-1">
                        <p>User Role: {user?.role}</p>
                        <p>User Hospital ID: {user?.hospitalId}</p>
                        <p>User Branch ID: {user?.branchId}</p>
                        <p>Total Departments: {departments?.length || 0}</p>
                        <p>Filtered Departments: {filteredDepartments.length}</p>
                        <p>Total Patients: {calculateTotalPatients(departments)}</p>
                        <p>Total Staff: {calculateTotalStaff(departments)}</p>
                        <p>Total Appointments: {calculateTotalAppointments(departments)}</p>
                        <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
                        <p>Error: {error ? error.message : 'None'}</p>
                      </div>
                    </div>
                    
                    {searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' || branchFilter !== 'all' ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setSizeFilter('all');
                          setBranchFilter('all');
                        }}
                        className="mr-2"
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Department
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <EnhancedTable
                columns={columns}
                data={filteredDepartments}
                searchPlaceholder="Search departments..."
                filterOptions={filterOptions}
                showFooter={true}
                footerProps={{
                  showFirstLastButtons: true,
                  labelRowsPerPage: "Departments per page:",
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}-${to} of ${count} departments`
                }}
                viewToggle={{
                  mode: viewMode,
                  onToggle: setViewMode
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDepartmentManagement; 