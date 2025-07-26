import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Edit, 
  Trash2, 
  Mail, 
  Phone,
  Stethoscope,
  MoreHorizontal,
  LayoutGrid,
  Table as TableIcon,
  Upload,
  X,
  Save,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useDepartments } from '@/contexts/DepartmentContext';
import { useStaff, StaffMember } from '@/contexts/StaffContext';
import { useToast } from '@/hooks/use-toast';

interface StaffFormData {
  // Personal Information
  firstName: string;
  lastName: string;
  gender: 'male' | 'female' | 'other';
  dateOfBirth: string;
  photo: File | null;
  contactNumber: string;
  email: string;
  emergencyContact: string;
  
  // Job Details
  role: 'doctor' | 'receptionist' | 'nurse' | 'admin' | 'other';
  department: string;
  specialization: string;
  employeeId: string;
  joiningDate: string;
  shiftTiming: 'morning' | 'evening' | 'night' | 'other' | undefined;

  
  // Qualifications & Experience
  highestQualification: string;
  medicalLicenseNumber: string;
  yearsOfExperience: number;
  certifications: string;
  previousHospitals: string;
  
  // Address Information
  currentAddress: string;
  permanentAddress: string;
  city: string;
  state: string;
  zipCode: string;
  
  // System Access
  username: string;
  systemRole: 'admin' | 'doctor' | 'nurse' | 'receptionist';
  password: string;
  confirmPassword: string;
  
  // Documents
  idProof: File | null;
  degreeLicense: File | null;
  resume: File | null;
}

const StaffManagement = () => {
  const { getActiveDepartments, isLoading: departmentsLoading, error: departmentsError } = useDepartments();
  const { staff, addStaff, updateStaff, deleteStaff, isLoading: staffLoading, error: staffError } = useStaff();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [formData, setFormData] = useState<StaffFormData>({
    firstName: '',
    lastName: '',
    gender: 'male',
    dateOfBirth: '',
    photo: null,
    contactNumber: '',
    email: '',
    emergencyContact: '',
    role: 'doctor',
    department: '',
    specialization: '',
    employeeId: '',
    joiningDate: '',
    shiftTiming: undefined,
    
    highestQualification: '',
    medicalLicenseNumber: '',
    yearsOfExperience: 0,
    certifications: '',
    previousHospitals: '',
    currentAddress: '',
    permanentAddress: '',
    city: '',
    state: '',
    zipCode: '',
    username: '',
    systemRole: 'doctor',
    password: '',
    confirmPassword: '',
    idProof: null,
    degreeLicense: null,
    resume: null
  });



  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (member.department && member.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.phone && member.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (member.specialization && member.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = filterRole === 'all' || member.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && member.isActive) ||
      (filterStatus === 'inactive' && !member.isActive);
    
    // Add date range filtering for hire date
    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to) {
      const hireDate = new Date(member.createdAt);
      matchesDateRange = hireDate >= dateRange.from && hireDate <= dateRange.to;
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesDateRange;
  });

  // Handle form input changes
  const handleInputChange = (field: keyof StaffFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle file input changes
  const handleFileChange = (field: keyof StaffFormData, file: File | null) => {
    setFormData(prev => ({ ...prev, [field]: file }));
  };

  // Generate employee ID
  const generateEmployeeId = () => {
    const prefix = formData.role === 'doctor' ? 'DR' : 'ST';
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const employeeId = `${prefix}${randomNum}`;
    handleInputChange('employeeId', employeeId);
  };

  // Copy current address to permanent address
  const copyCurrentToPermanent = () => {
    handleInputChange('permanentAddress', formData.currentAddress);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      gender: 'male',
      dateOfBirth: '',
      photo: null,
      contactNumber: '',
      email: '',
      emergencyContact: '',
      role: 'doctor',
      department: '',
      specialization: '',
      employeeId: '',
      joiningDate: '',
      shiftTiming: undefined,

      highestQualification: '',
      medicalLicenseNumber: '',
      yearsOfExperience: 0,
      certifications: '',
      previousHospitals: '',
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      zipCode: '',
      username: '',
      systemRole: 'doctor',
      password: '',
      confirmPassword: '',
      idProof: null,
      degreeLicense: null,
      resume: null
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!', { editingStaff: !!editingStaff, formData });
    
    // Validate required fields - different for add vs edit
    const requiredFields = editingStaff ? [
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'email', label: 'Email' },
    ] : [
      { field: 'firstName', label: 'First Name' },
      { field: 'lastName', label: 'Last Name' },
      { field: 'email', label: 'Email' },
      { field: 'contactNumber', label: 'Contact Number' },
      { field: 'shiftTiming', label: 'Shift Timing' },
      { field: 'highestQualification', label: 'Highest Qualification' },
      { field: 'currentAddress', label: 'Current Address' },
      { field: 'city', label: 'City' },
      { field: 'state', label: 'State' },
      { field: 'zipCode', label: 'ZIP Code' },
    ];
    
    for (const { field, label } of requiredFields) {
      const value = formData[field as keyof StaffFormData];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        toast({
          title: "Validation Error",
          description: `${label} is required`,
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    // Validate password match for new staff
    if (!editingStaff && formData.password !== formData.confirmPassword) {
      toast({
        title: "Validation Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingStaff) {
        console.log('Updating staff member:', editingStaff._id);
        console.log('Update data:', {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.contactNumber,
          role: formData.systemRole,
          specialization: formData.specialization,
          department: formData.department,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          emergencyContact: formData.emergencyContact,
          employeeId: formData.employeeId,
          joiningDate: formData.joiningDate,
          shiftTiming: formData.shiftTiming,
          highestQualification: formData.highestQualification,
          medicalLicenseNumber: formData.medicalLicenseNumber,
          yearsOfExperience: formData.yearsOfExperience,
          certifications: formData.certifications,
          previousHospitals: formData.previousHospitals,
          currentAddress: formData.currentAddress,
          permanentAddress: formData.permanentAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
        });
        
        // Update existing staff member with all available fields
        await updateStaff(editingStaff._id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.contactNumber,
          role: formData.systemRole, // Use systemRole for the actual role
          specialization: formData.specialization,
          department: formData.department,
          gender: formData.gender,
          dateOfBirth: formData.dateOfBirth,
          emergencyContact: formData.emergencyContact,
          employeeId: formData.employeeId,
          joiningDate: formData.joiningDate,
          shiftTiming: formData.shiftTiming,
          highestQualification: formData.highestQualification,
          medicalLicenseNumber: formData.medicalLicenseNumber,
          yearsOfExperience: formData.yearsOfExperience,
          certifications: formData.certifications,
          previousHospitals: formData.previousHospitals,
          currentAddress: formData.currentAddress,
          permanentAddress: formData.permanentAddress,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          // Note: We don't update password in edit mode for security
        });
        
        console.log('Staff member updated successfully');
        
        toast({
          title: "Staff Member Updated",
          description: `${formData.firstName} ${formData.lastName} has been successfully updated.`,
        });
        
        setShowEditForm(false);
        setEditingStaff(null);
      } else {
        // Create new staff member
        await addStaff(formData);
        
        if (formData.department) {
          const selectedDepartment = getActiveDepartments().find(
            dept => dept.name.toLowerCase() === formData.department
          );
          
          if (selectedDepartment) {
            toast({
              title: "Staff Member Added",
              description: `${formData.firstName} ${formData.lastName} has been successfully created and assigned to ${selectedDepartment.name} department.`,
            });
          }
        }
        
        setShowAddForm(false);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save staff member",
        variant: "destructive",
      });
    }
  };

  // Handle edit staff member
  const handleEdit = (staffMember: StaffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      firstName: staffMember.firstName,
      lastName: staffMember.lastName,
      gender: staffMember.gender || 'male',
      dateOfBirth: staffMember.dateOfBirth || '',
      photo: null,
      contactNumber: staffMember.phone || staffMember.phoneNumber || '',
      email: staffMember.email,
      emergencyContact: staffMember.emergencyContact || '',
      role: staffMember.role as any,
      department: staffMember.department || '',
      specialization: staffMember.specialization || '',
      employeeId: staffMember.employeeId || '',
      joiningDate: staffMember.joiningDate || '',
      shiftTiming: staffMember.shiftTiming || undefined,

      highestQualification: staffMember.highestQualification || '',
      medicalLicenseNumber: staffMember.medicalLicenseNumber || '',
      yearsOfExperience: staffMember.yearsOfExperience || 0,
      certifications: staffMember.certifications || '',
      previousHospitals: staffMember.previousHospitals || '',
      currentAddress: staffMember.currentAddress || '',
      permanentAddress: staffMember.permanentAddress || '',
      city: staffMember.city || '',
      state: staffMember.state || '',
      zipCode: staffMember.zipCode || '',
      username: '', // Don't pre-fill username for security
      systemRole: staffMember.role as any, // Set systemRole to match the actual role
      password: '', // Don't pre-fill password for security
      confirmPassword: '',
      idProof: null,
      degreeLicense: null,
      resume: null
    });
    setShowEditForm(true);
  };

  // Handle delete staff member
  const handleDelete = async (staffMember: StaffMember) => {
    if (window.confirm(`Are you sure you want to delete ${staffMember.firstName} ${staffMember.lastName}?`)) {
      try {
        await deleteStaff(staffMember._id);
        toast({
          title: "Staff Member Deleted",
          description: `${staffMember.firstName} ${staffMember.lastName} has been successfully deleted.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to delete staff member",
          variant: "destructive",
        });
      }
    }
  };

  // Define columns for the enhanced table
  const columns: ColumnDef<StaffMember, unknown>[] = [
    {
      accessorKey: "firstName",
      header: "Staff Member",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-semibold text-xs">
                {member.firstName[0]}{member.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{member.firstName} {member.lastName}</div>
              <div className="text-sm text-gray-500">{member.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div>
            <Badge variant={member.role === 'doctor' ? 'default' : 'secondary'}>
              {member.role === 'doctor' ? 'Doctor' : 'Receptionist'}
            </Badge>
            {member.specialization && (
              <div className="flex items-center space-x-2 mt-1">
                <Stethoscope className="w-3 h-3 text-blue-500" />
                <span className="text-xs text-blue-600">{member.specialization}</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "department",
      header: "Department",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-purple-600 font-medium">{member.department || 'Not assigned'}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-sm">{member.phone || 'Not provided'}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const member = row.original;
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
            <span className="text-sm">
              {member.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "lastLogin",
      header: "Last Login",
      cell: ({ row }) => {
        const member = row.original;
        return (
          member.lastLogin ? (
            <span className="text-sm text-gray-600">
              {new Date(member.lastLogin).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-sm text-gray-400">Never</span>
          )
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const staffMember = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleEdit(staffMember)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => handleDelete(staffMember)}
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
      label: "Role",
      value: "role",
      options: [
        { label: "All Roles", value: "all" },
        { label: "Doctors", value: "doctor" },
        { label: "Receptionists", value: "receptionist" },
      ],
    },
    {
      label: "Status",
      value: "isActive",
      options: [
        { label: "All Status", value: "all" },
        { label: "Active", value: "true" },
        { label: "Inactive", value: "false" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage doctors and receptionists in your branch</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Add Staff Member Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Add New Staff Member</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new staff member to your branch
            </DialogDescription>

          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section A: Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-sm">A</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gender *</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="other" />
                      <Label htmlFor="other">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photo">Photo Upload</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange('photo', e.target.files?.[0] || null)}
                  />
                </div>
                <div>
                  <Label htmlFor="contactNumber">Contact Number *</Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyContact">Emergency Contact Number *</Label>
                  <Input
                    id="emergencyContact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section B: Job Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">B</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="role">Role/Position *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.role === 'other' && (
                    <Input
                      placeholder="Specify custom role"
                      className="mt-2"
                      onChange={(e) => handleInputChange('role', e.target.value)}
                    />
                  )}
                </div>
                <div>
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department || undefined} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger disabled={departmentsLoading}>
                      <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsLoading ? (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          Loading departments...
                        </div>
                      ) : departmentsError ? (
                        <div className="px-2 py-1 text-sm text-red-500">
                          Error loading departments
                        </div>
                      ) : getActiveDepartments().length > 0 ? (
                        getActiveDepartments().map((dept) => (
                          <SelectItem key={dept._id} value={dept.name.toLowerCase()}>
                            {dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No departments available. Please create a department first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {departmentsError && (
                    <p className="text-xs text-red-600 mt-1">
                      ❌ Error loading departments: {departmentsError.message}
                    </p>
                  )}
                  {!departmentsLoading && !departmentsError && getActiveDepartments().length === 0 && (
                    <p className="text-xs text-orange-600 mt-1">
                      ⚠️ No active departments found. Create departments in Department Management first.
                    </p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.role === 'doctor' || formData.role === 'nurse') && (
                  <div>
                    <Label htmlFor="specialization">Specialization</Label>
                    <Input
                      id="specialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      placeholder="e.g., Cardiology, Pediatrics"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="employeeId">Employee ID</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => handleInputChange('employeeId', e.target.value)}
                      placeholder="Auto-generated or manual"
                    />
                    <Button type="button" variant="outline" onClick={generateEmployeeId}>
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="joiningDate">Joining Date *</Label>
                  <Input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="shiftTiming">Shift Timing *</Label>
                  <Select 
                    value={formData.shiftTiming || ''} 
                    onValueChange={(value) => handleInputChange('shiftTiming', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (06:00 - 14:00)</SelectItem>
                      <SelectItem value="evening">Evening (14:00 - 22:00)</SelectItem>
                      <SelectItem value="night">Night (22:00 - 06:00)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.shiftTiming === 'other' && (
                    <Input
                      placeholder="Enter custom shift timing"
                      className="mt-2"
                      onChange={(e) => handleInputChange('shiftTiming', e.target.value)}
                      required
                    />
                  )}
                  {!formData.shiftTiming && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Please select a shift timing
                    </p>
                  )}
                </div>

              </div>
            </div>

            <Separator />

            {/* Section C: Qualifications & Experience */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-sm">C</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Qualifications & Experience</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="highestQualification">Highest Qualification *</Label>
                  <Input
                    id="highestQualification"
                    value={formData.highestQualification}
                    onChange={(e) => handleInputChange('highestQualification', e.target.value)}
                    placeholder="e.g., MBBS, MD, BSc Nursing"
                    required
                  />
                </div>
                {(formData.role === 'doctor' || formData.role === 'nurse') && (
                  <div>
                    <Label htmlFor="medicalLicenseNumber">Medical License Number *</Label>
                    <Input
                      id="medicalLicenseNumber"
                      value={formData.medicalLicenseNumber}
                      onChange={(e) => handleInputChange('medicalLicenseNumber', e.target.value)}
                      placeholder="License number"
                      required
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                  <Input
                    id="yearsOfExperience"
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="certifications">Certifications</Label>
                  <Input
                    id="certifications"
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    placeholder="Comma-separated certifications"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="previousHospitals">Previous Hospitals Worked</Label>
                <Textarea
                  id="previousHospitals"
                  value={formData.previousHospitals}
                  onChange={(e) => handleInputChange('previousHospitals', e.target.value)}
                  placeholder="List previous hospitals or healthcare facilities"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Section D: Address Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-700 font-bold text-sm">D</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
              </div>
              
              <div>
                <Label htmlFor="currentAddress">Current Address *</Label>
                <Textarea
                  id="currentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                  placeholder="Enter current address"
                  rows={3}
                  required
                />
              </div>
              
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <Label htmlFor="permanentAddress">Permanent Address *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyCurrentToPermanent}
                    className="text-xs"
                  >
                    Same as Current
                  </Button>
                </div>
                <Textarea
                  id="permanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  placeholder="Enter permanent address"
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zipCode">ZIP Code *</Label>
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section E: System Access */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-700 font-bold text-sm">E</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">System Access</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    placeholder="System username"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="systemRole">System Role *</Label>
                  <Select value={formData.systemRole} onValueChange={(value) => handleInputChange('systemRole', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="System password"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password *</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    required
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section F: Document Uploads */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-indigo-700 font-bold text-sm">F</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Document Uploads</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="idProof">ID Proof *</Label>
                  <Input
                    id="idProof"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('idProof', e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </div>
                <div>
                  <Label htmlFor="degreeLicense">Degree/License *</Label>
                  <Input
                    id="degreeLicense"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange('degreeLicense', e.target.files?.[0] || null)}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG (Max 5MB)</p>
                </div>
                <div>
                  <Label htmlFor="resume">Resume</Label>
                  <Input
                    id="resume"
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => handleFileChange('resume', e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
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
              <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Save className="w-4 h-4 mr-2" />
                Submit
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Member Modal */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Staff Member</DialogTitle>
            <DialogDescription>
              Update the details for {editingStaff?.firstName} {editingStaff?.lastName}
            </DialogDescription>

          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Section A: Personal Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-700 font-bold text-sm">A</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editFirstName">First Name *</Label>
                  <Input
                    id="editFirstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="editLastName">Last Name *</Label>
                  <Input
                    id="editLastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editContactNumber">Contact Number</Label>
                  <Input
                    id="editContactNumber"
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="editEmail">Email Address *</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Gender</Label>
                  <RadioGroup
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange('gender', value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="editMale" />
                      <Label htmlFor="editMale">Male</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="editFemale" />
                      <Label htmlFor="editFemale">Female</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="other" id="editOther" />
                      <Label htmlFor="editOther">Other</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label htmlFor="editDateOfBirth">Date of Birth</Label>
                  <Input
                    id="editDateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section B: Job Details */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-700 font-bold text-sm">B</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editRole">Role/Position *</Label>
                  <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
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
                  <Select value={formData.department || undefined} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger disabled={departmentsLoading}>
                      <SelectValue placeholder={departmentsLoading ? "Loading departments..." : "Select department"} />
                    </SelectTrigger>
                    <SelectContent>
                      {departmentsLoading ? (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          Loading departments...
                        </div>
                      ) : departmentsError ? (
                        <div className="px-2 py-1 text-sm text-red-500">
                          Error loading departments
                        </div>
                      ) : getActiveDepartments().length > 0 ? (
                        getActiveDepartments().map((dept) => (
                          <SelectItem key={dept._id} value={dept.name.toLowerCase()}>
                            {dept.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-sm text-gray-500">
                          No departments available. Please create a department first.
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(formData.role === 'doctor' || formData.role === 'nurse') && (
                  <div>
                    <Label htmlFor="editSpecialization">Specialization</Label>
                    <Input
                      id="editSpecialization"
                      value={formData.specialization}
                      onChange={(e) => handleInputChange('specialization', e.target.value)}
                      placeholder="e.g., Cardiology, Pediatrics"
                    />
                  </div>
                )}
                <div>
                  <Label htmlFor="editSystemRole">System Role *</Label>
                  <Select value={formData.systemRole} onValueChange={(value) => handleInputChange('systemRole', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="doctor">Doctor</SelectItem>
                      <SelectItem value="nurse">Nurse</SelectItem>
                      <SelectItem value="receptionist">Receptionist</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editEmployeeId">Employee ID</Label>
                  <Input
                    id="editEmployeeId"
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="Employee ID"
                  />
                </div>
                <div>
                  <Label htmlFor="editJoiningDate">Joining Date</Label>
                  <Input
                    id="editJoiningDate"
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleInputChange('joiningDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editShiftTiming">Shift Timing</Label>
                  <Select 
                    value={formData.shiftTiming || ''} 
                    onValueChange={(value) => handleInputChange('shiftTiming', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift timing" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="morning">Morning (06:00 - 14:00)</SelectItem>
                      <SelectItem value="evening">Evening (14:00 - 22:00)</SelectItem>
                      <SelectItem value="night">Night (22:00 - 06:00)</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editEmergencyContact">Emergency Contact</Label>
                  <Input
                    id="editEmergencyContact"
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                    placeholder="Emergency contact number"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Section C: Qualifications & Experience */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-700 font-bold text-sm">C</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Qualifications & Experience</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editHighestQualification">Highest Qualification</Label>
                  <Input
                    id="editHighestQualification"
                    value={formData.highestQualification}
                    onChange={(e) => handleInputChange('highestQualification', e.target.value)}
                    placeholder="e.g., MBBS, MD, BSc Nursing"
                  />
                </div>
                {(formData.role === 'doctor' || formData.role === 'nurse') && (
                  <div>
                    <Label htmlFor="editMedicalLicenseNumber">Medical License Number</Label>
                    <Input
                      id="editMedicalLicenseNumber"
                      value={formData.medicalLicenseNumber}
                      onChange={(e) => handleInputChange('medicalLicenseNumber', e.target.value)}
                      placeholder="License number"
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editYearsOfExperience">Years of Experience</Label>
                  <Input
                    id="editYearsOfExperience"
                    type="number"
                    min="0"
                    value={formData.yearsOfExperience}
                    onChange={(e) => handleInputChange('yearsOfExperience', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="editCertifications">Certifications</Label>
                  <Input
                    id="editCertifications"
                    value={formData.certifications}
                    onChange={(e) => handleInputChange('certifications', e.target.value)}
                    placeholder="Comma-separated certifications"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="editPreviousHospitals">Previous Hospitals Worked</Label>
                <Textarea
                  id="editPreviousHospitals"
                  value={formData.previousHospitals}
                  onChange={(e) => handleInputChange('previousHospitals', e.target.value)}
                  placeholder="List previous hospitals or healthcare facilities"
                  rows={3}
                />
              </div>
            </div>

            <Separator />

            {/* Section D: Address Information */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-700 font-bold text-sm">D</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
              </div>
              
              <div>
                <Label htmlFor="editCurrentAddress">Current Address</Label>
                <Textarea
                  id="editCurrentAddress"
                  value={formData.currentAddress}
                  onChange={(e) => handleInputChange('currentAddress', e.target.value)}
                  placeholder="Enter current address"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="editPermanentAddress">Permanent Address</Label>
                <Textarea
                  id="editPermanentAddress"
                  value={formData.permanentAddress}
                  onChange={(e) => handleInputChange('permanentAddress', e.target.value)}
                  placeholder="Enter permanent address"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="editCity">City</Label>
                  <Input
                    id="editCity"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editState">State</Label>
                  <Input
                    id="editState"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="editZipCode">ZIP Code</Label>
                  <Input
                    id="editZipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditForm(false);
                  setEditingStaff(null);
                  resetForm();
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Save className="w-4 h-4 mr-2" />
                Update Staff Member
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search staff members by name, email, department, phone, or specialization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="w-full md:w-64">
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select hire date range"
                className="w-full"
              />
            </div>
            
            {/* Role Filter */}
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="doctor">Doctors</SelectItem>
                <SelectItem value="receptionist">Receptionists</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Staff Members</CardTitle>
              <CardDescription>
                {filteredStaff.length} of {staff.length} staff member(s) found
                {(searchTerm || filterRole !== 'all' || filterStatus !== 'all' || dateRange) && (
                  <span className="ml-2 text-blue-600">
                    (filtered)
                  </span>
                )}
              </CardDescription>
            </div>
            {(searchTerm || filterRole !== 'all' || filterStatus !== 'all' || dateRange) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterRole('all');
                  setFilterStatus('all');
                  setDateRange(undefined);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Card View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStaff.length > 0 ? (
                  filteredStaff.map((member) => (
                    <Card key={member._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 font-semibold">
                                {member.firstName[0]}{member.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {member.firstName} {member.lastName}
                              </h3>
                              <Badge variant={member.role === 'doctor' ? 'default' : 'secondary'}>
                                {member.role === 'doctor' ? 'Doctor' : 'Receptionist'}
                              </Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(member)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                className="text-red-600"
                                onClick={() => handleDelete(member)}
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600 mb-4">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{member.email}</span>
                          </div>
                          {member.phone && (
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span>{member.phone}</span>
                            </div>
                          )}
                          {member.specialization && (
                            <div className="flex items-center space-x-2">
                              <Stethoscope className="w-4 h-4 text-blue-500" />
                              <span className="text-blue-600 font-medium">{member.specialization}</span>
                            </div>
                          )}
                          {member.department && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-purple-500" />
                              <span className="text-purple-600 font-medium">{member.department}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-4 border-t">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-xs text-gray-500">
                              {member.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {member.lastLogin ? (
                            <span className="text-xs text-gray-500">
                              Last login: {new Date(member.lastLogin).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">
                              Never logged in
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Staff Members Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || filterRole !== 'all' || filterStatus !== 'all' || dateRange
                        ? 'Try adjusting your search or filter criteria' 
                        : 'Get started by adding your first staff member'
                      }
                    </p>
                    {searchTerm || filterRole !== 'all' || filterStatus !== 'all' || dateRange ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterRole('all');
                          setFilterStatus('all');
                          setDateRange(undefined);
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
                      <UserPlus className="w-4 h-4 mr-2" />
                      Add Staff Member
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <EnhancedTable
                columns={columns}
                data={filteredStaff}
                searchPlaceholder="Search staff members..."
                filterOptions={filterOptions}
                showFooter={true}
                footerProps={{
                  showFirstLastButtons: true,
                  labelRowsPerPage: "Staff per page:",
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}-${to} of ${count} staff members`
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

export default StaffManagement; 