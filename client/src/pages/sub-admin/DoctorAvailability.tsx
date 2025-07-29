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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Doctor Availability</h1>
          <p className="text-gray-600 mt-1">Manage doctor schedules and view availability for appointments</p>
        </div>
        <Button 
          onClick={() => setShowAddAvailability(true)}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Availability
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Doctors</p>
                <p className="text-2xl font-bold text-blue-600">{totalDoctors}</p>
              </div>
              <Stethoscope className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Doctors</p>
                <p className="text-2xl font-bold text-green-600">{activeDoctors}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Time Slots</p>
                <p className="text-2xl font-bold text-purple-600">{totalSlots}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Hours</p>
                <p className="text-2xl font-bold text-orange-600">{totalHours}h</p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="doctors" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Doctors List
          </TabsTrigger>
          <TabsTrigger value="availability" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Availability Schedule
          </TabsTrigger>
        </TabsList>

        <TabsContent value="doctors" className="mt-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search doctors by name or specialization..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
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
                <div className="w-full md:w-48">
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger>
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
              </div>
            </CardContent>
          </Card>

          {/* Hierarchical View */}
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Branch Hierarchy
                </CardTitle>
                <CardDescription>
                  View doctors organized by branch structure
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  // Group doctors by department
                  const groupedDoctors = doctors.reduce((acc, doctor) => {
                    const department = doctor.department || 'General';
                    
                    if (!acc[department]) {
                      acc[department] = [];
                    }
                    acc[department].push(doctor);
                    return acc;
                  }, {} as Record<string, Doctor[]>);

                  return (
                    <div className="space-y-6">
                      {Object.entries(groupedDoctors).map(([department, doctors]) => (
                        <div key={department} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-2 mb-4">
                            <Stethoscope className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-gray-900">{department}</h3>
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              {doctors.length} Doctors
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {doctors.map((doctor) => (
                              <Card key={doctor._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                                    <Avatar className="h-10 w-10">
                        <AvatarImage src={doctor.profilePhotoUrl} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {doctor.firstName[0]}{doctor.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                                    <div className="flex-1">
                                      <h5 className="font-medium text-gray-900">
                          {doctor.firstName} {doctor.lastName}
                                      </h5>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                                      <Badge variant={doctor.isActive ? "default" : "secondary"} className="mt-1 text-xs">
                                        {doctor.isActive ? 'Active' : 'Inactive'}
                                      </Badge>
                    </div>
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
                  </div>
                                </CardContent>
                              </Card>
                            ))}
                    </div>
                    </div>
                      ))}
                    </div>
                  );
                })()}
                </CardContent>
              </Card>
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Availability Schedule
              </CardTitle>
              <CardDescription>
                View and manage doctor availability organized by department structure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading availability data...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    // Group doctors by department
                    const groupedDoctors = doctors.reduce((acc, doctor) => {
                      const department = doctor.department || 'General';
                      
                      if (!acc[department]) {
                        acc[department] = [];
                      }
                      acc[department].push(doctor);
                      return acc;
                    }, {} as Record<string, Doctor[]>);

                    return (
                      <div className="space-y-6">
                        {Object.entries(groupedDoctors).map(([department, doctors]) => (
                          <div key={department} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex items-center gap-2 mb-4">
                              <Stethoscope className="w-5 h-5 text-green-600" />
                              <h3 className="text-lg font-semibold text-gray-900">{department}</h3>
                              <Badge variant="outline" className="bg-green-50 text-green-700">
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
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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