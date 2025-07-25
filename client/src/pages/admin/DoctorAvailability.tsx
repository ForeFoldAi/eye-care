import React, { useState } from 'react';
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
  X
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

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  department: string;
  isActive: boolean;
  profilePhotoUrl?: string;
  rating: number;
  totalAppointments: number;
  completedAppointments: number;
}

interface Availability {
  _id: string;
  doctorId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  maxPatients: number;
  currentBookings: number;
  breakStartTime?: string;
  breakEndTime?: string;
}

const DoctorAvailability = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [showAddAvailability, setShowAddAvailability] = useState(false);
  const [showDoctorDetails, setShowDoctorDetails] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [activeTab, setActiveTab] = useState('doctors');

  // Mock data - replace with actual API calls
  const [doctors] = useState<Doctor[]>([
    {
      _id: '1',
      firstName: 'Dr. Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@hospital.com',
      phone: '+1-555-0123',
      specialization: 'Cardiology',
      department: 'Cardiology',
      isActive: true,
      rating: 4.8,
      totalAppointments: 1250,
      completedAppointments: 1180
    },
    {
      _id: '2',
      firstName: 'Dr. Michael',
      lastName: 'Chen',
      email: 'michael.chen@hospital.com',
      phone: '+1-555-0124',
      specialization: 'Neurology',
      department: 'Neurology',
      isActive: true,
      rating: 4.9,
      totalAppointments: 980,
      completedAppointments: 920
    },
    {
      _id: '3',
      firstName: 'Dr. Emily',
      lastName: 'Davis',
      email: 'emily.davis@hospital.com',
      phone: '+1-555-0125',
      specialization: 'Pediatrics',
      department: 'Pediatrics',
      isActive: true,
      rating: 4.7,
      totalAppointments: 1100,
      completedAppointments: 1050
    }
  ]);

  const [availabilities] = useState<Availability[]>([
    {
      _id: '1',
      doctorId: '1',
      dayOfWeek: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      maxPatients: 20,
      currentBookings: 15,
      breakStartTime: '12:00',
      breakEndTime: '13:00'
    },
    {
      _id: '2',
      doctorId: '1',
      dayOfWeek: 'Tuesday',
      startTime: '09:00',
      endTime: '17:00',
      isAvailable: true,
      maxPatients: 20,
      currentBookings: 18,
      breakStartTime: '12:00',
      breakEndTime: '13:00'
    },
    {
      _id: '3',
      doctorId: '2',
      dayOfWeek: 'Monday',
      startTime: '10:00',
      endTime: '18:00',
      isAvailable: true,
      maxPatients: 15,
      currentBookings: 12,
      breakStartTime: '13:00',
      breakEndTime: '14:00'
    }
  ]);

  const [availabilityForm, setAvailabilityForm] = useState({
    doctorId: '',
    dayOfWeek: '',
    startTime: '',
    endTime: '',
    maxPatients: 20,
    breakStartTime: '',
    breakEndTime: ''
  });

  const departments = ['Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics', 'Dermatology', 'Oncology'];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = 
      doctor.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || doctor.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const handleAddAvailability = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Availability Added",
        description: "Doctor availability has been successfully scheduled.",
      });
      setShowAddAvailability(false);
      setAvailabilityForm({
        doctorId: '',
        dayOfWeek: '',
        startTime: '',
        endTime: '',
        maxPatients: 20,
        breakStartTime: '',
        breakEndTime: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add availability. Please try again.",
        variant: "destructive",
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
    if (availability.currentBookings >= availability.maxPatients) return { status: 'Full', color: 'bg-red-100 text-red-600' };
    if (availability.currentBookings >= availability.maxPatients * 0.8) return { status: 'Almost Full', color: 'bg-orange-100 text-orange-600' };
    return { status: 'Available', color: 'bg-green-100 text-green-600' };
  };

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
                <p className="text-2xl font-bold text-blue-600">{doctors.length}</p>
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
                <p className="text-2xl font-bold text-green-600">{doctors.filter(d => d.isActive).length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Appointments</p>
                <p className="text-2xl font-bold text-purple-600">{doctors.reduce((sum, d) => sum + d.totalAppointments, 0)}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Rating</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(doctors.reduce((sum, d) => sum + d.rating, 0) / doctors.length).toFixed(1)}
                </p>
              </div>
              <Star className="w-8 h-8 text-orange-500" />
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
                      {departments.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor._id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={doctor.profilePhotoUrl} />
                        <AvatarFallback className="bg-emerald-100 text-emerald-700">
                          {doctor.firstName[0]}{doctor.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span className="text-xs text-gray-600">{doctor.rating}</span>
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
                        <DropdownMenuItem onClick={() => handleViewDoctorDetails(doctor)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Availability
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Calendar className="w-4 h-4 mr-2" />
                          View Schedule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{doctor.department}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{doctor.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">{doctor.email}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{doctor.totalAppointments}</div>
                        <div className="text-xs text-gray-500">Total Appointments</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{doctor.completedAppointments}</div>
                        <div className="text-xs text-gray-500">Completed</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleViewDoctorDetails(doctor)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="availability" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Availability Schedule</CardTitle>
              <CardDescription>
                View and manage doctor availability across all departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {doctors.map((doctor) => {
                  const doctorAvailabilities = getDoctorAvailability(doctor._id);
                  return (
                    <div key={doctor._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={doctor.profilePhotoUrl} />
                            <AvatarFallback className="bg-emerald-100 text-emerald-700">
                              {doctor.firstName[0]}{doctor.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {doctor.firstName} {doctor.lastName}
                            </h4>
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
                            return (
                              <div key={availability._id} className="border rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-900">{availability.dayOfWeek}</span>
                                  <Badge className={status.color}>
                                    {status.status}
                                  </Badge>
                                </div>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Time:</span>
                                    <span className="font-medium">
                                      {availability.startTime} - {availability.endTime}
                                    </span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-600">Patients:</span>
                                    <span className="font-medium">
                                      {availability.currentBookings}/{availability.maxPatients}
                                    </span>
                                  </div>
                                  {availability.breakStartTime && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Break:</span>
                                      <span className="font-medium">
                                        {availability.breakStartTime} - {availability.breakEndTime}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-gray-500">
                          <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No availability scheduled</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="doctor">Doctor</Label>
                <Select value={availabilityForm.doctorId} onValueChange={(value) => setAvailabilityForm(prev => ({ ...prev, doctorId: value }))}>
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
              </div>
              <div>
                <Label htmlFor="dayOfWeek">Day of Week</Label>
                <Select value={availabilityForm.dayOfWeek} onValueChange={(value) => setAvailabilityForm(prev => ({ ...prev, dayOfWeek: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select day" />
                  </SelectTrigger>
                  <SelectContent>
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <SelectItem key={day} value={day}>{day}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={availabilityForm.startTime}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={availabilityForm.endTime}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="maxPatients">Max Patients</Label>
                <Input
                  id="maxPatients"
                  type="number"
                  value={availabilityForm.maxPatients}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, maxPatients: parseInt(e.target.value) }))}
                  min="1"
                  max="50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="breakStartTime">Break Start Time (Optional)</Label>
                <Input
                  id="breakStartTime"
                  type="time"
                  value={availabilityForm.breakStartTime}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, breakStartTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="breakEndTime">Break End Time (Optional)</Label>
                <Input
                  id="breakEndTime"
                  type="time"
                  value={availabilityForm.breakEndTime}
                  onChange={(e) => setAvailabilityForm(prev => ({ ...prev, breakEndTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowAddAvailability(false)}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleAddAvailability}>
                <Save className="w-4 h-4 mr-2" />
                Add Availability
              </Button>
            </div>
          </div>
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
                  <div className="flex items-center space-x-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    <span className="text-sm text-gray-600">{selectedDoctor.rating} Rating</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email</Label>
                  <p className="text-gray-900">{selectedDoctor.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Phone</Label>
                  <p className="text-gray-900">{selectedDoctor.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Department</Label>
                  <p className="text-gray-900">{selectedDoctor.department}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Badge variant={selectedDoctor.isActive ? "default" : "secondary"}>
                    {selectedDoctor.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Appointment Statistics</h4>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{selectedDoctor.totalAppointments}</div>
                    <div className="text-sm text-gray-600">Total</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-green-600">{selectedDoctor.completedAppointments}</div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="text-2xl font-bold text-purple-600">
                      {((selectedDoctor.completedAppointments / selectedDoctor.totalAppointments) * 100).toFixed(1)}%
                    </div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-900 mb-3">Current Availability</h4>
                <div className="space-y-2">
                  {getDoctorAvailability(selectedDoctor._id).map((availability) => {
                    const status = getAvailabilityStatus(availability);
                    return (
                      <div key={availability._id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{availability.dayOfWeek}</div>
                          <div className="text-sm text-gray-600">
                            {availability.startTime} - {availability.endTime}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={status.color}>
                            {status.status}
                          </Badge>
                          <div className="text-sm text-gray-600 mt-1">
                            {availability.currentBookings}/{availability.maxPatients} patients
                          </div>
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