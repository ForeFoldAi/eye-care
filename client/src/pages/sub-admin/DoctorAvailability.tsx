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
  
  // Filter doctors by branch
  const branchDoctors = doctors.filter(doctor => {
    // Handle different possible formats of branchId
    const doctorBranchId = typeof doctor.branchId === 'object' ? doctor.branchId._id || doctor.branchId : doctor.branchId;
    const userBranchId = user?.branchId;
    
    return doctorBranchId === userBranchId || doctorBranchId === userBranchId?.toString();
  });
  
  // Filter availabilities to only show those for branch doctors
  const branchAvailabilities = availabilities.filter(availability => {
    return branchDoctors.some(doctor => doctor._id === availability.doctorId);
  });

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
    return branchAvailabilities.filter(av => av.doctorId === doctorId);
  };

  const getAvailabilityStatus = (availability: Availability) => {
    if (!availability.isAvailable) return { status: 'Unavailable', color: 'bg-gray-100 text-gray-600' };
    
    const totalTokens = availability.slots.reduce((sum, slot) => sum + slot.tokenCount, 0);
    const bookedTokens = availability.slots.reduce((sum, slot) => sum + slot.bookedTokens.length, 0);
    
    if (bookedTokens >= totalTokens) return { status: 'Full', color: 'bg-red-100 text-red-600' };
    if (bookedTokens >= totalTokens * 0.8) return { status: 'Almost Full', color: 'bg-orange-100 text-orange-600' };
    return { status: 'Available', color: 'bg-green-100 text-green-600' };
  };

  const filteredDoctors = branchDoctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doctor.specialization && doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDepartment = selectedDepartment === 'all' || doctor.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const departments = Array.from(new Set(branchDoctors.map(d => d.department).filter(Boolean)));

  // Calculate stats for branch
  const totalDoctors = branchDoctors.length;
  const activeDoctors = branchDoctors.filter(d => d.isActive).length;
  const totalSlots = branchAvailabilities.reduce((acc, curr) => acc + curr.slots.length, 0);
  const totalHours = branchAvailabilities.reduce((acc, curr) => 
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
              Manage doctor schedules and optimize appointment availability across all departments in your branch
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

      {/* Branch Info Card */}
      {user?.branchId && (
        <Card className="mb-4 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">Branch Filter Active</p>
                <p className="text-xs text-blue-700">
                  Showing doctors for Branch ID: {user.branchId}
                </p>
                <p className="text-xs text-blue-600">
                  {branchDoctors.length} doctors found in your branch
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 mb-1">Total Doctors</p>
                <p className="text-3xl font-bold text-blue-800">{totalDoctors}</p>
                <p className="text-xs text-blue-600 mt-1">In your branch</p>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </div>

                  {/* Active Filters Display */}
                  {(searchTerm || selectedDepartment !== 'all') && (
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedDepartment('all');
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        Clear All
                      </Button>
                    </div>
                  )}
                </div>
              </div>

                                      {/* Enhanced Doctors Table */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Doctors Directory</h2>
                    <p className="text-gray-600">Complete list of doctors in your branch</p>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {filteredDoctors.length} Doctors Found
                  </Badge>
                </div>

                {/* Doctors Table */}
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="font-semibold text-gray-900">Doctor</TableHead>
                            <TableHead className="font-semibold text-gray-900">Department</TableHead>
                            <TableHead className="font-semibold text-gray-900">Specialization</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-center">Status</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-center">Availability</TableHead>
                            <TableHead className="font-semibold text-gray-900 text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredDoctors.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-8">
                                <div className="flex flex-col items-center space-y-3">
                                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                                    <User className="w-8 h-8 text-gray-400" />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-medium text-gray-900">No Doctors Found</h3>
                                    <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredDoctors.map((doctor) => {
                              const doctorAvailabilities = getDoctorAvailability(doctor._id);
                              const totalSlots = doctorAvailabilities.reduce((sum, av) => sum + av.slots.length, 0);
                              const activeAvailabilities = doctorAvailabilities.filter(av => av.isAvailable);

                              return (
                                <TableRow key={doctor._id} className="hover:bg-gray-50 transition-colors">
                                  <TableCell>
                                    <div className="flex items-center space-x-3">
                                      <Avatar className="h-10 w-10">
                                        <AvatarImage src={doctor.profilePhotoUrl} />
                                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                                          {doctor.firstName[0]}{doctor.lastName[0]}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="font-medium text-gray-900">
                                          Dr. {doctor.firstName} {doctor.lastName}
                                        </div>
                                        <div className="text-sm text-gray-500">{doctor.email}</div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Stethoscope className="w-4 h-4 text-blue-600" />
                                      </div>
                                      <span className="font-medium text-gray-900">{doctor.department || 'General'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className="text-gray-900">{doctor.specialization || 'General Medicine'}</span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant={doctor.isActive ? "default" : "secondary"}
                                      className={doctor.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                                    >
                                      {doctor.isActive ? 'Active' : 'Inactive'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex flex-col items-center space-y-1">
                                      <div className="flex items-center space-x-2">
                                        <Calendar className="w-4 h-4 text-purple-500" />
                                        <span className="font-medium text-purple-600">{totalSlots}</span>
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {activeAvailabilities.length} active days
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
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
                                        {doctorAvailabilities.length > 0 && (
                                          <DropdownMenuItem>
                                            <Calendar className="w-4 h-4 mr-2" />
                                            View Schedule
                                          </DropdownMenuItem>
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="availability" className="p-6">
              <div className="space-y-6">
                {/* Simple Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Availability Schedule</h2>
                    <p className="text-gray-600 mt-1">Manage doctor availability schedules in your branch</p>
                  </div>
                  <Button
                    onClick={() => setShowAddAvailability(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Schedule
                  </Button>
                </div>

                {/* Loading State */}
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading availability data...</p>
                  </div>
                ) : branchAvailabilities.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Availability Schedules</h3>
                    <p className="text-gray-600 mb-4">Get started by adding the first availability schedule</p>
                    <Button onClick={() => setShowAddAvailability(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {branchDoctors.map((doctor) => {
                      const doctorAvailabilities = getDoctorAvailability(doctor._id);
                      const totalSlots = doctorAvailabilities.reduce((sum, av) => sum + av.slots.length, 0);

                      return (
                        <Card key={doctor._id} className="border border-gray-200">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={doctor.profilePhotoUrl} />
                                  <AvatarFallback className="bg-blue-100 text-blue-700">
                                    {doctor.firstName[0]}{doctor.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h5 className="font-semibold text-gray-900">
                                    Dr. {doctor.firstName} {doctor.lastName}
                                  </h5>
                                  <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="outline" className="text-xs px-2 py-0.5">
                                      {totalSlots} slots
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreVertical className="w-4 h-4" />
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
                            </div>
                          </CardHeader>

                          <CardContent className="pt-0">
                            {doctorAvailabilities.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <h6 className="font-medium text-gray-900 text-sm">Weekly Schedule</h6>
                                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                                    {doctorAvailabilities.length} active days
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                  {doctorAvailabilities.map((availability) => {
                                    const status = getAvailabilityStatus(availability);
                                    const dayLabel = DAYS.find(d => d.value === availability.dayOfWeek)?.label;
                                    return (
                                      <div key={availability._id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center space-x-2">
                                            <Calendar className="w-4 h-4 text-blue-600" />
                                            <span className="font-medium text-gray-900 text-sm">{dayLabel}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <Badge className={`${status.color} text-xs px-2 py-0.5`}>
                                              {status.status}
                                            </Badge>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                  <MoreVertical className="w-3 h-3" />
                                                </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                  className="text-red-600"
                                                  onClick={() => handleDeleteAvailability(availability.doctorId, availability.dayOfWeek)}
                                                >
                                                  <Trash2 className="w-3 h-3 mr-2" />
                                                  Delete
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>

                                        <div className="space-y-1">
                                          {availability.slots.map((slot, index) => (
                                            <div key={index} className="flex items-center justify-between bg-white rounded-md p-2 border border-gray-100">
                                              <div className="flex items-center space-x-2">
                                                <Clock className="w-3 h-3 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-900">
                                                  {slot.startTime} - {slot.endTime}
                                                </span>
                                              </div>
                                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{slot.hoursAvailable}h</span>
                                                <span>•</span>
                                                <span>{slot.tokenCount} tokens</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                          <div className="flex items-center justify-between text-xs text-gray-500">
                                            <span>Added by: {availability.addedBy.name}</span>
                                            <span className="bg-gray-100 px-2 py-1 rounded-full">
                                              {availability.addedBy.role}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                  <Calendar className="w-8 h-8 text-gray-400" />
                                </div>
                                <h6 className="font-medium text-gray-900 mb-1">No Schedule Set</h6>
                                <p className="text-sm text-gray-600 mb-4">This doctor hasn't set their availability yet</p>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    form.setValue('doctorId', doctor._id);
                                    setShowAddAvailability(true);
                                  }}
                                  className="bg-purple-600 hover:bg-purple-700"
                                >
                                  <Plus className="w-3 h-3 mr-2" />
                                  Add Schedule
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
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
                      {branchDoctors.map(doctor => (
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