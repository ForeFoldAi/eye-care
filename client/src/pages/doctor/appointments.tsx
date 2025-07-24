import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useRouter } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ChatWidget } from '@/components/chat/ChatWidget';
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
  Grid3X3,
  List
} from "lucide-react";
import { type User as AuthUser, authService } from "@/lib/auth";
import { EnhancedTable } from "@/components/ui/enhanced-table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { type ColumnDef, type Row } from "@tanstack/react-table";

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
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // Helper functions
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "PPP");
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "p");
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
              navigate({ to: '/login' });
              throw new Error('Session expired. Please login again.');
            }

            if (response.ok) {
              const data = await response.json();
              console.log('Successfully fetched appointments:', data);
              
              // Handle the new API response format
              const appointmentsArray = data.data || data || [];
              
              // If this is the general appointments endpoint, filter by current doctor
              // (This should ideally be done on the backend)
              if (url.includes('/api/appointments?') && !url.includes('doctorOnly')) {
                // Filter will be done by backend based on JWT token
                // If not, you might need to get current user info and filter here
              }
              
              return appointmentsArray;
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
          navigate({ to: '/login' });
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
    navigate({ to: `/patients/${patientId}/history` });
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
    <Card key={appointment._id} className="hover:shadow-lg transition-all duration-200 border-gray-200">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          {/* Patient Info Header */}
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-lg">
                {appointment.patientId.firstName[0]}{appointment.patientId.lastName[0]}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {appointment.patientId.firstName} {appointment.patientId.lastName}
              </h3>
              <p className="text-sm text-gray-500">
                {appointment.patientId.dateOfBirth && 
                  `${calculateAge(appointment.patientId.dateOfBirth)} years`
                }
              </p>
            </div>
          </div>
          
          {/* Token Number */}
          <div className="text-right">
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              Token #{appointment.tokenNumber}
            </div>
          </div>
        </div>

        {/* Appointment Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{formatDate(appointment.datetime)}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{formatTime(appointment.datetime)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4 text-gray-400" />
              <Badge variant="outline" className="capitalize text-xs">
                {appointment.type}
              </Badge>
            </div>
            <Badge className={cn(
              "capitalize text-xs",
              appointment.status === "scheduled" && "bg-blue-100 text-blue-800",
              appointment.status === "confirmed" && "bg-green-100 text-green-800",
              appointment.status === "completed" && "bg-purple-100 text-purple-800",
              appointment.status === "cancelled" && "bg-red-100 text-red-800"
            )}>
              {appointment.status}
            </Badge>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-700">{appointment.patientId.phone}</span>
            </div>
            {appointment.patientId.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700 truncate">{appointment.patientId.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes Section */}
        {(appointment.notes || appointment.doctorNotes) && (
          <div className="space-y-2 mb-4">
            {appointment.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <UserIcon className="h-4 w-4 text-yellow-600" />
                  <span className="text-xs font-medium text-yellow-800">Patient Notes</span>
                </div>
                <p className="text-sm text-yellow-700">{appointment.notes}</p>
              </div>
            )}
            
            {appointment.doctorNotes && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-1">
                  <Stethoscope className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-800">Doctor Notes</span>
                </div>
                <p className="text-sm text-blue-700">{appointment.doctorNotes}</p>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          
          
          {appointment.status === 'scheduled' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
              className="flex-1 min-w-0 text-green-600 border-green-600 hover:bg-green-50"
            >
              <Check className="h-4 w-4 mr-1" />
              Confirm
            </Button>
          )}
          
          {appointment.status === 'confirmed' && (
            <Button
              size="sm"
              onClick={() => handleCompleteAppointment(appointment)}
              className="flex-1 min-w-0 bg-purple-600 hover:bg-purple-700 text-white"
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
              className="flex-1 min-w-0"
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
              className="flex-1 min-w-0 text-red-600 border-red-600 hover:bg-red-50"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const appointmentColumns: ColumnDef<Appointment>[] = [
    {
      accessorFn: (row: Appointment) => `${row.patientId.firstName} ${row.patientId.lastName}`,
      header: "Patient Name",
      cell: ({ row }: { row: Row<Appointment> }) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
            {row.original.patientId.firstName[0]}{row.original.patientId.lastName[0]}
          </div>
          <div>
            <div className="font-medium">{row.original.patientId.firstName} {row.original.patientId.lastName}</div>
            <div className="text-sm text-gray-500">{row.original.patientId.phone}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "type",
      header: "Type",
      cell: ({ row }: { row: Row<Appointment> }) => (
        <Badge variant="outline" className="capitalize">
          {row.original.type}
        </Badge>
      ),
    },
    {
      accessorKey: "datetime",
      header: "Date & Time",
      cell: ({ row }: { row: Row<Appointment> }) => (
        <div>
          <div className="font-medium">{formatDate(row.original.datetime)}</div>
          <div className="text-sm text-gray-500">{formatTime(row.original.datetime)}</div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: { row: Row<Appointment> }) => (
        <Badge className={cn(
          "capitalize",
          row.original.status === "scheduled" && "bg-blue-100 text-blue-800",
          row.original.status === "confirmed" && "bg-green-100 text-green-800",
          row.original.status === "completed" && "bg-purple-100 text-purple-800",
          row.original.status === "cancelled" && "bg-red-100 text-red-800"
        )}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "tokenNumber",
      header: "Token",
      cell: ({ row }: { row: Row<Appointment> }) => (
        <div className="font-mono text-sm bg-gray-100 px-2 py-1 rounded w-fit">
          #{row.original.tokenNumber}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }: { row: Row<Appointment> }) => {
        const appointment = row.original;
        return (
          <div className="flex items-center gap-2">
            {appointment.status === 'scheduled' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {appointment.status === 'confirmed' && (
              <Button
                size="sm"
                onClick={() => handleCompleteAppointment(appointment)}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            {(appointment.status === 'scheduled' || appointment.status === 'confirmed') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-4 px-4 pt-0 bg-gray-50">
      <div className="flex items-center justify-between py-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Appointments</h2>
          <p className="text-gray-600">
            View and manage your scheduled appointments
          </p>
        </div>
      </div>

      {viewMode === 'table' ? (
        <Card className="flex-1 overflow-hidden flex flex-col">
          <CardContent className="p-0 flex-1">
            <EnhancedTable
              columns={appointmentColumns}
              data={filteredAppointments}
              searchPlaceholder="Search appointments..."
              filterOptions={[
                {
                  label: "Status",
                  value: "status",
                  options: [
                    { label: "All", value: "all" },
                    { label: "Scheduled", value: "scheduled" },
                    { label: "Confirmed", value: "confirmed" },
                    { label: "Completed", value: "completed" },
                    { label: "Cancelled", value: "cancelled" },
                  ],
                },
                {
                  label: "Type",
                  value: "type",
                  options: [
                    { label: "All", value: "all" },
                    { label: "Consultation", value: "consultation" },
                    { label: "Checkup", value: "checkup" },
                    { label: "Follow-up", value: "follow-up" },
                  ],
                },
              ]}
              showFooter={true}
              rowsPerPageOptions={[10, 20, 50, 100]}
              defaultRowsPerPage={10}
              footerProps={{
                className: "border-t bg-white py-0 px-4",
                showFirstLastButtons: true,
                labelRowsPerPage: "Rows per page:",
                labelDisplayedRows: ({ from, to, count }) => 
                  `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`,
              }}
              viewToggle={{
                mode: viewMode,
                onToggle: setViewMode,
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredAppointments.map(renderAppointmentCard)}
          </div>
          
          {filteredAppointments.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Appointments Found</h3>
              <p className="text-gray-500">No appointments match your current filters.</p>
            </div>
          )}
          
          <div className="fixed bottom-4 right-4">
            <Button
              variant="default"
              size="lg"
              onClick={() => setViewMode('table')}
              className="shadow-lg"
            >
              <List className="h-4 w-4 mr-2" />
              Switch to Table View
            </Button>
          </div>
        </div>
      )}

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
      
      {/* Chat Widget - Fixed Bottom Right */}
      <ChatWidget />
    </div>
  );
}