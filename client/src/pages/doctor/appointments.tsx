import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useLocation } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
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
  Edit
} from "lucide-react";
import { type User as AuthUser, authService } from "@/lib/auth";

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

export default function DoctorAppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [doctorNotes, setDoctorNotes] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  // Fetch doctor's appointments
  const { data: appointmentsData = [], isError, error, isLoading } = useQuery({
    queryKey: ['/api/appointments', 'doctor', selectedDate, statusFilter],
    queryFn: async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Try multiple endpoint patterns to handle different backend implementations
        const endpoints = [
          // First try: doctor-specific endpoint
          (() => {
            let url = `${API_URL}/api/doctor/appointments?`;
            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            return url + params.toString();
          })(),
          // Second try: general appointments with doctor filter
          (() => {
            let url = `${API_URL}/api/appointments?`;
            const params = new URLSearchParams();
            params.append('doctorOnly', 'true');
            if (selectedDate) params.append('date', selectedDate);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            return url + params.toString();
          })(),
          // Third try: just general appointments (backend should filter by token)
          (() => {
            let url = `${API_URL}/api/appointments?`;
            const params = new URLSearchParams();
            if (selectedDate) params.append('date', selectedDate);
            if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
            return url + params.toString();
          })()
        ];

        let lastError;
        
        for (const url of endpoints) {
          try {
            console.log('Trying endpoint:', url);
            
            const response = await fetch(url, {
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

            if (response.ok) {
              const data = await response.json();
              console.log('Successfully fetched appointments:', data);
              
              // If this is the general appointments endpoint, filter by current doctor
              // (This should ideally be done on the backend)
              if (url.includes('/api/appointments?') && !url.includes('doctorOnly')) {
                // Filter will be done by backend based on JWT token
                // If not, you might need to get current user info and filter here
              }
              
              return data;
            }
            
            lastError = new Error(`HTTP ${response.status}: ${await response.text()}`);
          } catch (err) {
            console.log('Endpoint failed:', url, err);
            lastError = err;
            continue;
          }
        }
        
        throw lastError || new Error('All appointment endpoints failed');
        
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

  // Update appointment status mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, status, doctorNotes }: { id: string; status: string; doctorNotes?: string }) => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const response = await fetch(`${API_URL}/api/appointments/${id}/status`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status, doctorNotes }),
        });

        if (!response.ok) {
          throw new Error('Failed to update appointment status');
        }

        return response.json();
      } catch (error) {
        console.error('Error updating appointment status:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      setShowNotesModal(false);
      setSelectedAppointment(null);
      setDoctorNotes("");
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

  const handleCompleteAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDoctorNotes(appointment.doctorNotes || "");
    setShowNotesModal(true);
  };

  const handleSaveNotes = () => {
    if (selectedAppointment) {
      updateAppointmentMutation.mutate({
        id: selectedAppointment._id,
        status: 'completed',
        doctorNotes: doctorNotes
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
      appointment.type.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Render functions
  const renderAppointmentCard = (appointment: Appointment) => (
    <Card key={appointment._id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <span>{appointment.patientId.email}</span>
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
          </div>

          {/* Actions and Notes */}
          <div className="space-y-3">
            {appointment.notes && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="font-medium text-sm text-yellow-800 mb-1">Patient Notes:</div>
                <div className="text-sm text-yellow-700">{appointment.notes}</div>
              </div>
            )}
            
            {appointment.doctorNotes && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="font-medium text-sm text-blue-800 mb-1">Doctor Notes:</div>
                <div className="text-sm text-blue-700">{appointment.doctorNotes}</div>
              </div>
            )}
            
            <div className="flex flex-col gap-2">
              {appointment.status === 'scheduled' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                  className="text-green-600 border-green-600 hover:bg-green-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Confirm
                </Button>
              )}
              
              {appointment.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => handleCompleteAppointment(appointment)}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
              
              {appointment.status === 'completed' && appointment.doctorNotes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCompleteAppointment(appointment)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit Notes
                </Button>
              )}
              
              {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                  className="text-red-600 border-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">My Appointments</h2>
        <p className="text-gray-600">
          View and manage your scheduled appointments
        </p>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  placeholder="Search patients..."
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
            <Stethoscope className="h-5 w-5" />
            Appointments for {formatDate(selectedDate)}
            <Badge variant="secondary" className="ml-2">
              {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
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
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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

      {/* Notes Modal */}
      <Dialog open={showNotesModal} onOpenChange={setShowNotesModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complete Appointment</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Patient Information</h3>
                <p className="text-sm text-gray-600">
                  <strong>Name:</strong> {selectedAppointment.patientId.firstName} {selectedAppointment.patientId.lastName}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Type:</strong> {selectedAppointment.type}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Date & Time:</strong> {formatDate(selectedAppointment.datetime)} at {formatTime(selectedAppointment.datetime)}
                </p>
              </div>
              
              {selectedAppointment.notes && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-medium mb-2 text-yellow-800">Patient Notes:</h3>
                  <p className="text-sm text-yellow-700">{selectedAppointment.notes}</p>
                </div>
              )}
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Doctor Notes <span className="text-gray-400">(Optional)</span>
                </Label>
                <Textarea
                  value={doctorNotes}
                  onChange={(e) => setDoctorNotes(e.target.value)}
                  placeholder="Add consultation notes, diagnosis, treatment recommendations..."
                  className="mt-2 min-h-[120px]"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowNotesModal(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveNotes}
                  disabled={updateAppointmentMutation.isPending}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {updateAppointmentMutation.isPending ? 'Saving...' : 'Complete Appointment'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}