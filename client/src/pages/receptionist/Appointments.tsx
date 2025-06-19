import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type User } from "@/lib/auth";
import { 
  Search,
  Calendar,
  Clock,
  User as UserIcon,
  Stethoscope,
  Check,
  X,
  FileText,
  Phone,
  Mail,
  Edit,
  Plus,
  Users,
  CalendarPlus
} from "lucide-react";

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface Appointment {
  _id: string;
  patientId: Patient;
  doctorId: Doctor;
  datetime: string;
  type: 'consultation' | 'checkup' | 'follow-up';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  tokenNumber: number;
  notes?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export default function ReceptionistAppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  
  // New appointment form state
  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    doctorId: "",
    datetime: "",
    type: "consultation" as const,
    notes: ""
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch all appointments (receptionist can see all)
  const { data: appointmentsData = [], isError, error, isLoading } = useQuery({
    queryKey: ['/api/appointments', 'receptionist', selectedDate, statusFilter, doctorFilter],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        let url = '/api/appointments?';
        const params = new URLSearchParams();
        if (selectedDate) params.append('date', selectedDate);
        if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
        if (doctorFilter && doctorFilter !== 'all') params.append('doctorId', doctorFilter);
        
        const response = await fetch(url + params.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          throw new Error('Session expired. Please login again.');
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        return data;
        
      } catch (error) {
        console.error('Error fetching appointments:', error);
        if (error instanceof Error && error.message.includes('Session expired')) {
          toast({
            title: "Session Expired",
            description: "Your session has expired. Please login again.",
            variant: "destructive",
          });
          navigate('/login');
        }
        throw error;
      }
    },
    retry: 1,
    retryDelay: 1000
  });

  // Fetch patients for booking
  const { data: patientsData = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/patients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch patients');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch doctors for booking
  const { data: doctorsData = [] } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update appointment status');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update appointment",
        variant: "destructive",
      });
    }
  });

  // Book new appointment mutation
  const bookAppointmentMutation = useMutation({
    mutationFn: async (appointmentData: typeof newAppointment) => {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (!response.ok) {
        throw new Error('Failed to book appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setShowBookingModal(false);
      resetNewAppointmentForm();
      toast({
        title: "Success",
        description: "Appointment booked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to book appointment",
        variant: "destructive",
      });
    }
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: async ({ id, datetime }: { id: string; datetime: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/appointments/${id}/reschedule`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ datetime }),
      });

      if (!response.ok) {
        throw new Error('Failed to reschedule appointment');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const resetNewAppointmentForm = () => {
    setNewAppointment({
      patientId: "",
      doctorId: "",
      datetime: "",
      type: "consultation",
      notes: ""
    });
  };

  // Event handlers
  const handleStatusUpdate = async (appointmentId: string, newStatus: string) => {
    try {
      await updateAppointmentMutation.mutateAsync({
        id: appointmentId,
        status: newStatus
      });
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
  };

  const handleBookAppointment = () => {
    if (!newAppointment.patientId || !newAppointment.doctorId || !newAppointment.datetime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    bookAppointmentMutation.mutate(newAppointment);
  };

  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
  };

  const handleRescheduleSubmit = () => {
    if (selectedAppointment && newAppointment.datetime) {
      rescheduleAppointmentMutation.mutate({
        id: selectedAppointment._id,
        datetime: newAppointment.datetime
      });
    }
  };

  const viewPatientHistory = (patientId: string) => {
    navigate(`/patients/${patientId}/history`);
  };

  // Filter appointments based on search query
  const filteredAppointments = appointmentsData
    .filter((appointment: Appointment) => 
      searchQuery === "" || 
      appointment.patientId.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.patientId.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.doctorId.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.doctorId.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Group appointments by status for overview
  const appointmentStats = filteredAppointments.reduce((acc: any, appointment: Appointment) => {
    acc[appointment.status] = (acc[appointment.status] || 0) + 1;
    return acc;
  }, {});

  // Render functions
  const renderAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment._id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Patient Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-lg">
                {appointment.patientId.firstName} {appointment.patientId.lastName}
              </span>
            </div>
            
            {appointment.patientId.dateOfBirth && (
              <div className="text-sm text-gray-600">
                Age: {calculateAge(appointment.patientId.dateOfBirth)} years
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{appointment.patientId.phone}</span>
            </div>
            
            {appointment.patientId.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span className="truncate">{appointment.patientId.email}</span>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => viewPatientHistory(appointment.patientId._id)}
              className="mt-2"
            >
              <FileText className="h-4 w-4 mr-1" />
              View History
            </Button>
          </div>

          {/* Doctor Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-green-600" />
              <span className="font-semibold">
                Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
              </span>
            </div>
            
            <div className="text-sm text-gray-600">
              {appointment.doctorId.specialization}
            </div>
          </div>

          {/* Appointment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600" />
              <span className="font-medium">{formatDate(appointment.datetime)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span>{formatTime(appointment.datetime)}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Type:</span>
              <span className="capitalize bg-gray-100 px-2 py-1 rounded text-sm">
                {appointment.type}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Token:</span>
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                #{appointment.tokenNumber}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(appointment.status)}>
                {appointment.status}
              </Badge>
            </div>
            
            {appointment.notes && (
              <div className="bg-yellow-50 p-2 rounded text-sm border-l-4 border-yellow-400">
                <div className="font-medium text-yellow-800">Notes:</div>
                <div className="text-yellow-700">{appointment.notes}</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {appointment.status === 'scheduled' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                  className="w-full text-medical-green-600 border-medical-green-600 hover:bg-medical-green-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReschedule(appointment)}
                  className="w-full"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Reschedule
                </Button>
              </>
            )}
            
            {appointment.status === 'confirmed' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleReschedule(appointment)}
                className="w-full"
              >
                <Calendar className="h-4 w-4 mr-1" />
                Reschedule
              </Button>
            )}
            
            {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                className="w-full text-medical-red-600 border-medical-red-600 hover:bg-medical-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <ProtectedRoute requiredRole="receptionist">
      {(currentUser: User) => (
        <Layout user={currentUser}>
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Management</h2>
            <p className="text-gray-600">
              Manage all appointments across all doctors
            </p>
          </div>
                <Button onClick={() => setShowBookingModal(true)} className="bg-medical-blue-600 hover:bg-medical-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.scheduled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Check className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Confirmed</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.confirmed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <X className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">{appointmentStats.cancelled || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Date</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Doctor</Label>
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Doctors</SelectItem>
                  {doctorsData.map((doctor: Doctor) => (
                    <SelectItem key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Search</Label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  placeholder="Search patients or doctors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Appointments for {formatDate(selectedDate)}
            <Badge variant="secondary" className="ml-2">
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
                    <div className="animate-spin w-8 h-8 border-4 border-medical-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading appointments...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 bg-red-50 rounded-lg">
              <X className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-600 font-medium">
                {error instanceof Error ? error.message : 'Failed to load appointments'}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/appointments'] })}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.length > 0 ? (
                filteredAppointments.map(renderAppointmentCard)
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-medical-blue-100 rounded-full flex items-center justify-center text-medical-blue-600 mx-auto mb-4">
                          <Calendar className="w-6 h-6" />
                        </div>
                  <p className="text-gray-500 font-medium text-lg mb-2">
                    No appointments found
                  </p>
                  <p className="text-gray-400">
                    {searchQuery ? 'Try adjusting your search criteria' : 'No appointments scheduled for this date'}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

            {/* Reschedule Modal */}
            <Dialog open={showRescheduleModal} onOpenChange={setShowRescheduleModal}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Reschedule Appointment
                  </DialogTitle>
                </DialogHeader>
                
                {selectedAppointment && (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Current Appointment</h3>
                      <p className="text-sm text-gray-600">
                        <strong>Patient:</strong> {selectedAppointment.patientId.firstName} {selectedAppointment.patientId.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Doctor:</strong> Dr. {selectedAppointment.doctorId.firstName} {selectedAppointment.doctorId.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Current Time:</strong> {formatDate(selectedAppointment.datetime)} at {formatTime(selectedAppointment.datetime)}
                      </p>
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium text-gray-700">New Date & Time *</Label>
                      <Input
                        type="datetime-local"
                        value={newAppointment.datetime}
                        onChange={(e) => setNewAppointment({...newAppointment, datetime: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-4">
                      <Button variant="outline" onClick={() => {
                        setShowRescheduleModal(false);
                        setSelectedAppointment(null);
                        setNewAppointment({...newAppointment, datetime: ""});
                      }}>
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleRescheduleSubmit}
                        disabled={rescheduleAppointmentMutation.isPending || !newAppointment.datetime}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {rescheduleAppointmentMutation.isPending ? 'Rescheduling...' : 'Reschedule'}
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

      {/* Book Appointment Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarPlus className="h-5 w-5" />
              Book New Appointment
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Patient *</Label>
                <Select 
                  value={newAppointment.patientId} 
                  onValueChange={(value) => setNewAppointment({...newAppointment, patientId: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                          {Array.isArray(patientsData) && patientsData.map((patient: Patient) => (
                      <SelectItem key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} - {patient.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Doctor *</Label>
                <Select 
                  value={newAppointment.doctorId} 
                  onValueChange={(value) => setNewAppointment({...newAppointment, doctorId: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                          {Array.isArray(doctorsData) && doctorsData.map((doctor: Doctor) => (
                      <SelectItem key={doctor._id} value={doctor._id}>
                        Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Date & Time *</Label>
                <Input
                  type="datetime-local"
                  value={newAppointment.datetime}
                  onChange={(e) => setNewAppointment({...newAppointment, datetime: e.target.value})}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">Type</Label>
                <Select 
                  value={newAppointment.type} 
                  onValueChange={(value: any) => setNewAppointment({...newAppointment, type: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="checkup">Checkup</SelectItem>
                    <SelectItem value="follow-up">Follow-up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-700">Notes</Label>
              <Textarea
                value={newAppointment.notes}
                onChange={(e) => setNewAppointment({...newAppointment, notes: e.target.value})}
                placeholder="Any special notes or requirements..."
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setShowBookingModal(false);
                resetNewAppointmentForm();
              }}>
                Cancel
              </Button>
              <Button 
                onClick={handleBookAppointment}
                disabled={bookAppointmentMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {bookAppointmentMutation.isPending ? 'Booking...' : 'Book Appointment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
          </div>
        </Layout>
      )}
    </ProtectedRoute>
  );
}