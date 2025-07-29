import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Star,
  Eye,
  CalendarDays,
  Settings,
  Save,
  X,
  Users,
  Edit2,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { authService } from '@/lib/auth';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  specialization?: string;
  department?: string;
  branchId?: string | { _id: string; branchName: string };
  branchName?: string;
  isActive: boolean;
  profilePhotoUrl?: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  hoursAvailable: number;
  tokenCount: number;
  bookedTokens: number[];
}

interface Availability {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  slots: TimeSlot[];
  isAvailable: boolean;
  addedBy: {
    userId: string;
    role: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

const DAYS = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const DEFAULT_SLOT: TimeSlot = {
  startTime: '09:00',
  endTime: '10:00',
  hoursAvailable: 1,
  tokenCount: 10,
  bookedTokens: []
};

const API_URL = import.meta.env.VITE_API_URL;

const DoctorAvailability = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState('doctors');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const user = authService.getStoredUser();

  const form = useForm({
    defaultValues: {
      doctorId: '',
      dayOfWeek: '1',
      startTime: '09:00',
      endTime: '10:00',
      hoursAvailable: 1,
      tokenCount: 10,
    },
  });

  useEffect(() => {
    fetchDoctors();
    fetchAvailabilities();
  }, []);

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  const fetchDoctors = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to view doctors',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/doctor-availability/doctors/list`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch doctors');
      }

      const data = await response.json();
      setDoctors(data);
    } catch (error) {
      toast({
        title: 'Error fetching doctors',
        description: 'Failed to load doctors data',
        variant: 'destructive',
      });
    }
  };

  const fetchAvailabilities = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to view availability',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/doctor-availability`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch availabilities');
      }

      const data = await response.json();
      setAvailabilities(data);
      setIsLoading(false);
    } catch (error) {
      toast({
        title: 'Error fetching availabilities',
        description: 'Failed to load availability data',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleAddTimeSlot = async (formData: any) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to add availability',
          variant: 'destructive',
        });
        return;
      }

      // Convert form data to the correct format
      const dayOfWeek = parseInt(formData.dayOfWeek);
      const newSlot = {
        startTime: formData.startTime,
        endTime: formData.endTime,
        hoursAvailable: parseInt(formData.hoursAvailable),
        tokenCount: parseInt(formData.tokenCount),
        bookedTokens: []
      };

      // Find existing availability for the selected day and doctor
      const existingAvailability = availabilities.find(
        a => a.doctorId === formData.doctorId && a.dayOfWeek === dayOfWeek
      );
      const slots = existingAvailability ? [...existingAvailability.slots, newSlot] : [newSlot];

      const response = await fetch(`${API_URL}/api/doctor-availability/${formData.doctorId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek,
          slots,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to add time slot');
      }
      
      toast({
        title: 'Success',
        description: 'Time slot added successfully',
      });

      fetchAvailabilities();
      form.reset();
      setShowAddAvailability(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add time slot',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAvailability = async (doctorId: string, dayOfWeek: number) => {
    try {
      const token = getAuthToken();
      if (!token) {
        toast({
          title: 'Error',
          description: 'Please log in to delete availability',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`${API_URL}/api/doctor-availability/${doctorId}/${dayOfWeek}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete availability');
      }

      toast({
        title: 'Success',
        description: 'Availability deleted successfully',
      });

      fetchAvailabilities();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete availability',
        variant: 'destructive',
      });
    }
  };

  const handleViewDoctorDetails = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorDetails(true);
  };

  const getDoctorAvailability = (doctorId: string) => {
    return availabilities.filter(av => av.doctorId === doctorId);
  };

  const getAvailabilityStatus = (availability: Availability) => {
    if (!availability.isAvailable) return { status: 'Unavailable', color: 'bg-gray-100 text-gray-600' };
    
    const totalTokens = availability.slots.reduce((sum, slot) => sum + slot.tokenCount, 0);
    const bookedTokens = availability.slots.reduce((sum, slot) => sum + slot.bookedTokens.length, 0);
    
    if (bookedTokens >= totalTokens) return { status: 'Full', color: 'bg-red-100 text-red-600' };
    if (bookedTokens >= totalTokens * 0.8) return { status: 'Almost Full', color: 'bg-orange-100 text-orange-600' };
    return { status: 'Available', color: 'bg-green-100 text-green-600' };
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartment === 'all' || doctor.department === selectedDepartment;
    
    // Handle branch filtering with populated data
    let matchesBranch = selectedBranch === 'all';
    if (selectedBranch !== 'all') {
      if (typeof doctor.branchId === 'object' && doctor.branchId !== null) {
        matchesBranch = doctor.branchId._id === selectedBranch;
      } else if (typeof doctor.branchId === 'string') {
        matchesBranch = doctor.branchId === selectedBranch;
      }
    }
    
    return matchesSearch && matchesDepartment && matchesBranch;
  });

  const departments = Array.from(new Set(doctors.map(d => d.department).filter(Boolean)));

  // Calculate stats
  const totalDoctors = doctors.length;
  const activeDoctors = doctors.filter(d => d.isActive).length;
  const totalSlots = availabilities.reduce((acc, curr) => acc + curr.slots.length, 0);
  const totalHours = availabilities.reduce((acc, curr) => 
    acc + curr.slots.reduce((sum, slot) => sum + slot.hoursAvailable, 0), 0
  );

  return (
    <div className="p-6 space-y-8">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-3 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Doctor Availability</h1>
            <p className="text-sm text-gray-600 mb-2">
              Manage doctor schedules and optimize appointment availability across all departments
            </p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span className="flex items-center">
                <Stethoscope className="w-3 h-3 mr-1" />
                {totalDoctors} Total Doctors
              </span>
              <span className="flex items-center">
                <CheckCircle className="w-3 h-3 mr-1" />
                {activeDoctors} Active
              </span>
              <span className="flex items-center">
                <Calendar className="w-3 h-3 mr-1" />
                {totalSlots} Time Slots
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline"
              size="sm"
              className="border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <Settings className="w-3 h-3 mr-1" />
              Settings
            </Button>
            <Button 
              size="sm"
              onClick={() => setShowAddAvailability(true)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Availability
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Doctors</p>
                <p className="text-3xl font-bold text-blue-800">{totalDoctors}</p>
                <p className="text-xs text-blue-600 mt-1">Across all departments</p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-xl flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 mb-1">Active Doctors</p>
                <p className="text-3xl font-bold text-green-800">{activeDoctors}</p>
                <p className="text-xs text-green-600 mt-1">
                  {totalDoctors > 0 ? ((activeDoctors / totalDoctors) * 100).toFixed(1) : '0'}% active rate
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 mb-1">Total Time Slots</p>
                <p className="text-3xl font-bold text-purple-800">{totalSlots}</p>
                <p className="text-xs text-purple-600 mt-1">Available appointments</p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">Total Hours</p>
                <p className="text-3xl font-bold text-orange-800">{totalHours}h</p>
                <p className="text-xs text-orange-600 mt-1">Weekly availability</p>
              </div>
              <div className="w-12 h-12 bg-orange-200 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Main Content */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200">
              <TabsList className="grid w-full grid-cols-2 h-16 bg-transparent">
                <TabsTrigger 
                  value="doctors" 
                  className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <User className="w-5 h-5" />
                  Doctors List
                </TabsTrigger>
                <TabsTrigger 
                  value="availability" 
                  className="flex items-center gap-3 text-lg font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:border-b-2 data-[state=active]:border-blue-600"
                >
                  <Calendar className="w-5 h-5" />
                  Availability Schedule
                </TabsTrigger>
              </TabsList>
            </div>

        <TabsContent value="doctors" className="p-6">
          {/* Enhanced Search and Filters */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Search className="w-5 h-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">Search & Filter Doctors</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search by name, specialization..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="h-12 border-gray-300">
                    <SelectValue placeholder="All Departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.filter((dept): dept is string => dept !== undefined).map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="h-12 border-gray-300">
                    <SelectValue placeholder="All Branches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {Array.from(new Set(doctors.map(d => {
                      let branchId = '';
                      let branchName = '';
                      
                      if (typeof d.branchId === 'object' && d.branchId !== null) {
                        branchId = d.branchId._id;
                        branchName = d.branchId.branchName;
                      } else if (typeof d.branchId === 'string') {
                        branchId = d.branchId;
                        branchName = d.branchName || '';
                      }
                      
                      return { id: branchId, name: branchName };
                    }).filter((branch): branch is { id: string, name: string } => branch.id !== '' && branch.name !== ''))).map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Active Filters Display */}
              {(searchTerm || selectedDepartment !== 'all' || selectedBranch !== 'all') && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {selectedDepartment !== 'all' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Department: {selectedDepartment}
                    </Badge>
                  )}
                  {selectedBranch !== 'all' && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                      Branch: {(() => {
                        const doctor = doctors.find(d => {
                          if (typeof d.branchId === 'object' && d.branchId !== null) {
                            return d.branchId._id === selectedBranch;
                          } else if (typeof d.branchId === 'string') {
                            return d.branchId === selectedBranch;
                          }
                          return false;
                        });
                        return typeof doctor?.branchId === 'object' ? doctor.branchId.branchName : doctor?.branchName || 'Unknown';
                      })()}
                    </Badge>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedDepartment('all');
                      setSelectedBranch('all');
                    }}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>

        {/* Enhanced Hospital Hierarchy */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Hospital Hierarchy</h2>
              <p className="text-gray-600">Branch → Department → Doctor structure</p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {filteredDoctors.length} Doctors Found
            </Badge>
          </div>
          
          {Array.from(new Set(filteredDoctors.map(doctor => {
            if (typeof doctor.branchId === 'object' && doctor.branchId !== null) {
              return doctor.branchId.branchName;
            } else {
              return doctor.branchName || 'Unknown Branch';
            }
          }))).map(branchName => {
            const branchDoctors = filteredDoctors.filter(d => {
              const docBranchName = typeof d.branchId === 'object' && d.branchId !== null 
                ? d.branchId.branchName 
                : d.branchName || 'Unknown Branch';
              return docBranchName === branchName;
            });
            
            if (branchDoctors.length === 0) return null;

            // Group branch doctors by department
            const departmentGroups = branchDoctors.reduce((acc, doctor) => {
              const department = doctor.department || 'General';
              if (!acc[department]) {
                acc[department] = [];
              }
              acc[department].push(doctor);
              return acc;
            }, {} as Record<string, Doctor[]>);
            
            return (
              <Card key={`branch-${branchName}`} className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardHeader className="bg-gradient-to-r from-blue-100 to-indigo-100 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-200 rounded-lg flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-blue-700" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-blue-900">{branchName}</CardTitle>
                        <CardDescription className="text-blue-700">
                          {branchDoctors.length} doctor{branchDoctors.length !== 1 ? 's' : ''} across {Object.keys(departmentGroups).length} department{Object.keys(departmentGroups).length !== 1 ? 's' : ''}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                        Branch
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
                          <Stethoscope className="w-5 h-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Departments</p>
                            <p className="text-2xl font-bold text-blue-600">{Object.keys(departmentGroups).length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-green-200">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Total Doctors</p>
                            <p className="text-2xl font-bold text-green-600">{branchDoctors.length}</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-purple-200">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Active Doctors</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {branchDoctors.filter(d => d.isActive).length}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-orange-200">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-5 h-5 text-orange-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-600">Availability Slots</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {branchDoctors.reduce((acc, doctor) => {
                                const doctorAvailabilities = getDoctorAvailability(doctor._id);
                                return acc + doctorAvailabilities.reduce((sum, av) => sum + av.slots.length, 0);
                              }, 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Departments Table */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Departments & Doctors</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Department
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Doctor Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Specialization
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Availability Slots
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {Object.entries(departmentGroups).map(([departmentName, doctors]) => 
                              doctors.map((doctor) => {
                                const doctorAvailabilities = getDoctorAvailability(doctor._id);
                                const totalSlots = doctorAvailabilities.reduce((sum, av) => sum + av.slots.length, 0);
                                
                                return (
                                  <tr key={doctor._id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                                          <Stethoscope className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">{departmentName}</div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center space-x-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarImage src={doctor.profilePhotoUrl} />
                                          <AvatarFallback className="text-xs bg-emerald-100 text-emerald-700">
                                            {doctor.firstName[0]}{doctor.lastName[0]}
                                          </AvatarFallback>
                                        </Avatar>
                                        <span className="text-sm text-gray-900">{doctor.firstName} {doctor.lastName}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {doctor.specialization || 'General Medicine'}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <Badge variant={doctor.isActive ? 'default' : 'secondary'}>
                                        {doctor.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <div className="flex items-center justify-center space-x-2">
                                        <Calendar className="w-4 h-4 text-purple-500" />
                                        <span className="text-sm font-medium text-purple-600">{totalSlots}</span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="w-4 h-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem onClick={() => handleViewDoctorDetails(doctor)}>
                                            <Eye className="w-4 h-4 mr-2" />
                                            View Details
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            form.setValue('doctorId', doctor._id);
                                            setShowAddAvailability(true);
                                          }}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Availability
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        </TabsContent>



        <TabsContent value="availability" className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Availability Schedule</h2>
                <p className="text-gray-600">View and manage doctor availability organized by hospital hierarchy</p>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                {availabilities.length} Schedules
              </Badge>
            </div>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading availability data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group doctors by branch and department
                    const groupedDoctors = doctors.reduce((acc, doctor) => {
                      // Handle populated branch data
                      let branchName = 'Unknown Branch';
                      let branchId = '';
                      
                      if (typeof doctor.branchId === 'object' && doctor.branchId !== null) {
                        branchName = doctor.branchId.branchName || 'Unknown Branch';
                        branchId = doctor.branchId._id;
                      } else if (typeof doctor.branchId === 'string') {
                        branchId = doctor.branchId;
                        branchName = doctor.branchName || 'Unknown Branch';
                      }
                      
                      const department = doctor.department || 'General';
                      
                      if (!acc[branchName]) {
                        acc[branchName] = {};
                      }
                      if (!acc[branchName][department]) {
                        acc[branchName][department] = [];
                      }
                      acc[branchName][department].push(doctor);
                      return acc;
                    }, {} as Record<string, Record<string, Doctor[]>>);

                    return (
                      <div className="space-y-6">
                        {Object.entries(groupedDoctors).map(([branchName, departments]) => (
                          <div key={branchName} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-2 mb-4">
                              <MapPin className="w-5 h-5 text-blue-600" />
                              <h3 className="text-lg font-semibold text-gray-900">{branchName}</h3>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                                {Object.values(departments).flat().length} Doctors
                              </Badge>
                            </div>
                            
                            <div className="space-y-4">
                              {Object.entries(departments).map(([department, doctors]) => (
                                <div key={department} className="ml-6 border-l-2 border-gray-200 pl-4">
                                  <div className="flex items-center gap-2 mb-3">
                                    <Stethoscope className="w-4 h-4 text-green-600" />
                                    <h4 className="font-medium text-gray-800">{department}</h4>
                                    <Badge variant="secondary" className="bg-green-50 text-green-700">
                                      {doctors.length} Doctors
                                    </Badge>
                                  </div>
                                  
                                  <div className="space-y-4">
                                    {doctors.map((doctor) => {
                                      const doctorAvailabilities = getDoctorAvailability(doctor._id);
                                      return (
                                        <div key={doctor._id} className="border rounded-lg p-4 bg-white">
                                          <div className="flex items-center justify-between mb-4">
                                            <div className="flex items-center space-x-3">
                                              <Avatar className="h-10 w-10">
                                                <AvatarImage src={doctor.profilePhotoUrl} />
                                                <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                                  {doctor.firstName[0]}{doctor.lastName[0]}
                                                </AvatarFallback>
                                              </Avatar>
                                              <div>
                                                <h5 className="font-semibold text-gray-900">
                                                  {doctor.firstName} {doctor.lastName}
                                                </h5>
                                                <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                              </div>
                                            </div>
                                            <Badge variant={doctor.isActive ? "default" : "secondary"}>
                                              {doctor.isActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                          </div>

                                          {doctorAvailabilities.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                              {doctorAvailabilities.map((availability) => {
                                                const status = getAvailabilityStatus(availability);
                                                const dayLabel = DAYS.find(d => d.value === availability.dayOfWeek)?.label;
                                                return (
                                                  <div key={availability._id} className="border rounded-lg p-3 bg-gray-50">
                                                    <div className="flex items-center justify-between mb-2">
                                                      <span className="font-medium text-gray-900">{dayLabel}</span>
                                                      <Badge className={status.color}>
                                                        {status.status}
                                                      </Badge>
                                                    </div>
                                                    <div className="space-y-1 text-sm">
                                                      {availability.slots.map((slot, index) => (
                                                        <div key={index} className="flex justify-between">
                                                          <span className="text-gray-600">Slot {index + 1}:</span>
                                                          <span className="font-medium">
                                                            {slot.startTime} - {slot.endTime}
                                                          </span>
                                                        </div>
                                                      ))}
                                                      <div className="flex justify-between">
                                                        <span className="text-gray-600">Added by:</span>
                                                        <span className="font-medium text-xs">
                                                          {availability.addedBy.name} ({availability.addedBy.role})
                                                        </span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          ) : (
                                            <div className="text-center py-4 text-gray-500">
                                              <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                                              <p className="text-sm">No availability scheduled</p>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
          </div>
        </TabsContent>
      </Tabs>
        </CardContent>
      </Card>

      {/* Add Availability Modal */}
      <Dialog open={showAddAvailability} onOpenChange={setShowAddAvailability}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add Doctor Availability</DialogTitle>
            <DialogDescription>
              Schedule doctor availability for appointments
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddTimeSlot)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="doctorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Doctor</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map(doctor => (
                            <SelectItem key={doctor._id} value={doctor._id}>
                              {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {DAYS.map((day) => (
                            <SelectItem
                              key={day.value}
                              value={day.value.toString()}
                              disabled={day.value === 0}
                            >
                              {day.label} {day.value === 0 ? '(Holiday)' : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hoursAvailable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hours Available</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tokenCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tokens per Hour</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                      <FormDescription>
                        Maximum patients per hour
                      </FormDescription>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddAvailability(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  Add Availability
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Doctor Details Modal */}
      <Dialog open={showDoctorDetails} onOpenChange={setShowDoctorDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Doctor Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the doctor
            </DialogDescription>
          </DialogHeader>
          
          {selectedDoctor && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedDoctor.profilePhotoUrl} />
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-lg">
                    {selectedDoctor.firstName[0]}{selectedDoctor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedDoctor.firstName} {selectedDoctor.lastName}
                  </h3>
                  <p className="text-gray-600">{selectedDoctor.specialization}</p>
                  <Badge variant={selectedDoctor.isActive ? "default" : "secondary"} className="mt-2">
                    {selectedDoctor.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-gray-900">{selectedDoctor.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <p className="text-gray-900">{selectedDoctor.phoneNumber || 'No Phone'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <p className="text-gray-900">{selectedDoctor.department || 'No Department'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge variant={selectedDoctor.isActive ? "default" : "secondary"}>
                    {selectedDoctor.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Current Availability</h4>
                <div className="space-y-2">
                  {getDoctorAvailability(selectedDoctor._id).map((availability) => {
                    const status = getAvailabilityStatus(availability);
                    const dayLabel = DAYS.find(d => d.value === availability.dayOfWeek)?.label;
                    return (
                      <div key={availability._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{dayLabel}</div>
                          <div className="text-sm text-gray-600">
                            {availability.slots.map((slot, index) => (
                              <span key={index}>
                                {slot.startTime} - {slot.endTime}
                                {index < availability.slots.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Added by: {availability.addedBy.name} ({availability.addedBy.role})
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={status.color}>
                            {status.status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DoctorAvailability;