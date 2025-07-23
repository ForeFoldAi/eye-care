import React, { useState } from 'react';
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
  UserCheck
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
import { useDepartments, DepartmentFormData, Department } from '@/contexts/DepartmentContext';
import { useShifts, ShiftTiming } from '@/contexts/ShiftContext';
import { useToast } from '@/hooks/use-toast';
import { authService } from '@/lib/auth';

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  role: string;
  specialization: string;
}



const DepartmentManagement = () => {
  const { departments, addDepartment, isLoading, error } = useDepartments();
  const { shiftTimings, addShift, isLoading: shiftsLoading, error: shiftsError } = useShifts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  // Set default view mode to 'table'
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showShiftForm, setShowShiftForm] = useState(false);
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
    createdBy: 'Current Admin' // This would be dynamic in real app
  });



  // Remove mock staff data for department head selection
  // const availableStaff: StaffMember[] = [
  //   { _id: '1', firstName: 'John', lastName: 'Smith', role: 'doctor', specialization: 'Cardiology' },
  //   { _id: '2', firstName: 'Sarah', lastName: 'Johnson', role: 'doctor', specialization: 'Pediatrics' },
  //   { _id: '3', firstName: 'Michael', lastName: 'Brown', role: 'doctor', specialization: 'Emergency Medicine' },
  //   { _id: '4', firstName: 'David', lastName: 'Wilson', role: 'doctor', specialization: 'Orthopedics' },
  //   { _id: '5', firstName: 'Emily', lastName: 'Davis', role: 'doctor', specialization: 'Neurology' },
  //   { _id: '6', firstName: 'Robert', lastName: 'Anderson', role: 'doctor', specialization: 'Dermatology' },
  //   { _id: '7', firstName: 'Lisa', lastName: 'Martinez', role: 'doctor', specialization: 'Psychiatry' },
  //   { _id: '8', firstName: 'James', lastName: 'Taylor', role: 'doctor', specialization: 'Radiology' }
  // ];



  const user = authService.getStoredUser();
  // Filter departments by branchId
  const branchDepartments = departments.filter(dept => dept.branchId === user?.branchId);
  // Remove duplicates by _id
  const uniqueDepartments = Array.from(
    new Map(branchDepartments.map(dept => [dept._id, dept])).values()
  );
  // Use only unique, branch-level departments in the UI
  const filteredDepartments = uniqueDepartments.filter((dept) => {
    const matchesSearch = 
      dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dept.headOfDepartment.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'true' && dept.isActive) ||
      (statusFilter === 'false' && !dept.isActive);
    
    const matchesSize = sizeFilter === 'all' ||
      (sizeFilter === 'small' && dept.staffCount <= 5) ||
      (sizeFilter === 'medium' && dept.staffCount > 5 && dept.staffCount <= 10) ||
      (sizeFilter === 'large' && dept.staffCount > 10);
    
    return matchesSearch && matchesStatus && matchesSize;
  });

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
      createdBy: 'Current Admin'
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
    try {
      await addDepartment(formData);
      toast({
        title: "Department Created",
        description: `${formData.departmentName} has been successfully created and saved to database.`,
      });
      setShowAddForm(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create department",
        variant: "destructive",
      });
    }
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
            <span className="font-medium">{department.name}</span>
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
                {department.headOfDepartment.split(' ').map(n => n[0]).join('')}
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
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="w-4 h-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Department Management</h1>
          <p className="text-gray-600 mt-1">Organize and manage hospital departments</p>
        </div>
        <div className="flex space-x-3">
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
                       {/* {availableStaff.map((staff) => (
                        <SelectItem key={staff._id} value={`${staff.firstName} ${staff.lastName}`}>
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-4 h-4 text-emerald-500" />
                            <span>Dr. {staff.firstName} {staff.lastName}</span>
                            <span className="text-xs text-gray-500">({staff.specialization})</span>
                          </div>
                        </SelectItem>
                      ))} */}
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
              <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Save className="w-4 h-4 mr-2" />
                Save Department
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
                        {departments.map((dept) => (
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
                              {departments.find(d => d._id === shift.departmentId)?.name || 'Unknown'}
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

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 text-red-700">
              <span className="text-sm font-medium">Error loading departments:</span>
              <span className="text-sm">{error.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isLoading && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-600"></div>
              <span className="text-sm text-gray-600">Loading departments...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Departments</p>
                <p className="text-2xl font-bold text-blue-600">{departments.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Departments</p>
                <p className="text-2xl font-bold text-green-600">{departments.filter(d => d.isActive).length}</p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Staff</p>
                <p className="text-2xl font-bold text-purple-600">{departments.reduce((sum, d) => sum + d.staffCount, 0)}</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-orange-600">{departments.reduce((sum, d) => sum + d.activePatients, 0)}</p>
              </div>
              <Heart className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search departments by name, description, or head of department..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* Status Filter */}
              <div className="w-full md:w-48">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              {/* Size Filter */}
              <div className="w-full md:w-48">
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Sizes</option>
                  <option value="small">Small (≤5)</option>
                  <option value="medium">Medium (6-10)</option>
                  <option value="large">Large (&gt;10)</option>
                </select>
              </div>
            </div>
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
                {filteredDepartments.length > 0 ? (
                  filteredDepartments.map((department) => (
                    <Card key={department._id} className="hover:shadow-lg transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                              <Building2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900">{department.name}</h3>
                              <Badge variant={department.isActive ? 'default' : 'secondary'}>
                                {department.isActive ? 'Active' : 'Inactive'}
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
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
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
                            <div className="text-2xl font-bold text-blue-600">{department.staffCount}</div>
                            <div className="text-xs text-gray-500">Staff</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-green-600">{department.activePatients}</div>
                            <div className="text-xs text-gray-500">Patients</div>
                          </div>
                          <div>
                            <div className="text-2xl font-bold text-purple-600">{department.totalAppointments}</div>
                            <div className="text-xs text-gray-500">Appointments</div>
                          </div>
                        </div>
                        
                        {department.headOfDepartment && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                                  {department.headOfDepartment.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-xs font-medium text-gray-900">Department Head</div>
                                <div className="text-xs text-gray-600">{department.headOfDepartment}</div>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Departments Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || sizeFilter !== 'all'
                        ? 'Try adjusting your search or filter criteria' 
                        : 'Get started by creating your first department'
                      }
                    </p>
                    {searchTerm || statusFilter !== 'all' || sizeFilter !== 'all' ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setSizeFilter('all');
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

export default DepartmentManagement; 