import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import PatientRegistrationModal from "@/components/PatientRegistrationModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search,
  Plus,
  Eye,
  Phone,
  Mail,
  CalendarDays,
  Calendar,
  IndianRupee,
  MapPin,
  User,
  Grid3X3,
  List,
  MoreHorizontal,
  Clock,
  Stethoscope,
  CalendarPlus,
  FileText,
  AlertCircle
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { EnhancedTable } from "@/components/ui/enhanced-table";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type ViewMode = 'table' | 'grid';

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  createdAt: string;
  appointmentsCount?: number;
  paymentsTotal?: number;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface PatientAppointment {
  _id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  datetime: string;
  type: 'consultation' | 'checkup' | 'follow-up';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  tokenNumber: number;
  notes?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}
const API_URL = import.meta.env.VITE_API_URL;
async function fetchPatients(): Promise<Patient[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/patients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  const data = await response.json();
  
  // Handle different response formats
  const patientsArray = data.data?.patients || data.patients || data;
  
  // Validate that we have an array
  if (!Array.isArray(patientsArray)) {
    console.error('API response is not an array:', data);
    return [];
  }
  
  // Validate and transform the data
  return patientsArray.map((patient: any) => ({
    id: patient._id?.toString() || patient.id || '',
    firstName: patient.firstName || 'Unknown',
    lastName: patient.lastName || 'Patient',
    email: patient.email || 'N/A',
    phone: patient.phone || 'N/A',
    dateOfBirth: patient.dateOfBirth || new Date().toISOString(),
    gender: patient.gender || 'Not Specified',
    address: patient.address || 'N/A',
    createdAt: patient.createdAt || new Date().toISOString(),
    appointmentsCount: patient.appointmentsCount || 0,
    paymentsTotal: patient.paymentsTotal || 0
  }));
}

async function searchPatients(query: string): Promise<Patient[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/patients/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error('Failed to search patients');
  }
  const data = await response.json();
  
  // Handle different response formats
  const patientsArray = data.data?.patients || data.patients || data;
  
  // Validate that we have an array
  if (!Array.isArray(patientsArray)) {
    console.error('Search API response is not an array:', data);
    return [];
  }
  
  return patientsArray.map((patient: any) => ({
    id: patient._id?.toString() || patient.id || '',
    firstName: patient.firstName || 'Unknown',
    lastName: patient.lastName || 'Patient',
    email: patient.email || 'N/A',
    phone: patient.phone || 'N/A',
    dateOfBirth: patient.dateOfBirth || new Date().toISOString(),
    gender: patient.gender || 'Not Specified',
    address: patient.address || 'N/A',
    createdAt: patient.createdAt || new Date().toISOString(),
    appointmentsCount: patient.appointmentsCount || 0,
    paymentsTotal: patient.paymentsTotal || 0
  }));
}

async function fetchPatientAppointments(patientId: string): Promise<PatientAppointment[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/appointments?patientId=${patientId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch patient appointments');
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function fetchDoctors(): Promise<Doctor[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/doctors`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch doctors');
  }
  
  const data = await response.json();
  return Array.isArray(data) ? data : [];
}

async function bookAppointment(appointmentData: {
  patientId: string;
  doctorId: string;
  datetime: string;
  type: 'consultation' | 'checkup' | 'follow-up';
  notes?: string;
}): Promise<PatientAppointment> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_URL}/api/appointments`, {
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
}

export default function PatientsPage() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientForAppointments, setSelectedPatientForAppointments] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table' as 'table' | 'grid');
  const [newAppointment, setNewAppointment] = useState({
    patientId: "",
    doctorId: "",
    datetime: "",
    type: "consultation" as const,
    notes: ""
  });
  
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: patients = [], isError, error, isLoading } = useQuery({
    queryKey: ['/api/patients'],
    queryFn: fetchPatients,
    retry: 1,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['/api/patients/search', searchQuery],
    queryFn: () => searchPatients(searchQuery),
    enabled: searchQuery.length > 2,
  });

  // Fetch patient appointments when modal is open
  const { data: patientAppointments = [], isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/appointments', selectedPatientForAppointments?.id],
    queryFn: () => fetchPatientAppointments(selectedPatientForAppointments!.id),
    enabled: !!selectedPatientForAppointments && showAppointmentsModal,
  });

  // Fetch doctors for booking
  const { data: doctors = [] } = useQuery({
    queryKey: ['/api/doctors'],
    queryFn: fetchDoctors,
    enabled: showBookingModal,
  });

  const displayedPatients = searchQuery.length > 2 ? searchResults : patients;

  const getPatientInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || '?'}${lastName?.charAt(0) || '?'}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
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

  const viewPatientAppointments = (patient: Patient) => {
    setSelectedPatientForAppointments(patient);
    setShowAppointmentsModal(true);
  };

  const viewPatientPayments = (patientId: string) => {
    navigate({ to: '/receptionist/payments', search: { patientId } });
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  const handleBookAppointment = async () => {
    if (!newAppointment.patientId || !newAppointment.doctorId || !newAppointment.datetime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      await bookAppointment(newAppointment);
      toast({
        title: "Success",
        description: "Appointment booked successfully",
      });
      
      // Reset form and close modal
      setNewAppointment({
        patientId: "",
        doctorId: "",
        datetime: "",
        type: "consultation",
        notes: ""
      });
      setShowBookingModal(false);
      
      // Refresh appointments if modal is open
      if (selectedPatientForAppointments) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/appointments', selectedPatientForAppointments.id] 
        });
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to book appointment",
        variant: "destructive",
      });
    }
  };

  const openBookingModal = (patient?: Patient) => {
    if (patient) {
      setNewAppointment(prev => ({
        ...prev,
        patientId: patient.id
      }));
    }
    setShowBookingModal(true);
  };

  // Table columns definition
  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <div className="font-medium text-xs">P-{row.getValue('id')}</div>
      ),
    },
    {
      accessorKey: 'firstName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 bg-medical-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium text-medical-blue-600">
              {getPatientInitials(row.getValue('firstName'), row.getValue('lastName'))}
            </span>
          </div>
          <div>
            <div className="font-medium text-xs">
              {row.getValue('firstName')} {row.getValue('lastName')}
            </div>
            <div className="text-xs text-gray-500">{row.original.gender}</div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'phone',
      header: 'Phone',
      cell: ({ row }) => (
        <div className="flex items-center text-xs">
          <Phone className="w-3 h-3 mr-1 text-gray-500" />
          {row.getValue('phone')}
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <div className="flex items-center text-xs">
          <Mail className="w-3 h-3 mr-1 text-gray-500" />
          <span className="truncate max-w-[150px]">{row.getValue('email')}</span>
        </div>
      ),
    },
    {
      accessorKey: 'dateOfBirth',
      header: 'DOB',
      cell: ({ row }) => (
        <div className="flex items-center text-xs">
          <CalendarDays className="w-3 h-3 mr-1 text-gray-500" />
          {new Date(row.getValue('dateOfBirth')).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Registered',
      cell: ({ row }) => (
        <div className="text-xs">
          {new Date(row.getValue('createdAt')).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}
        </div>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetails(row.original)}
            className="hover:bg-medical-blue-50 h-6 w-6 p-0"
          >
            <Eye className="w-3 h-3 text-medical-blue-600" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => viewPatientAppointments(row.original)} className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Appointments
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => viewPatientPayments(row.original.id)} className="text-xs">
                <IndianRupee className="w-3 h-3 mr-1" />
                Payments
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] space-y-2 px-4 pt-0 bg-gray-50">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Patients</h2>
            <p className="text-sm text-gray-600">Manage and view patient records</p>
          </div>
          <Button 
            onClick={() => setShowPatientModal(true)}
            className="bg-medical-blue-500 hover:bg-medical-blue-600 text-white h-8 px-3 text-sm"
          >
            <Plus className="w-3 h-3 mr-1" />
            New Patient
          </Button>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'table' ? (
          <div className="h-full overflow-auto">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Loading patients...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8">
                <p className="text-red-500 text-sm">
                  {error instanceof Error ? error.message : 'Failed to load patients'}
                </p>
              </div>
            ) : (
              <EnhancedTable
                data={displayedPatients}
                columns={columns}
                searchPlaceholder="Search patients..."
                showFooter={true}
                footerProps={{
                  showFirstLastButtons: true,
                  labelRowsPerPage: "Per page:",
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}-${to} of ${count}`
                }}
                viewToggle={{
                  mode: viewMode,
                  onToggle: (mode) => setViewMode(mode)
                }}
              />
            )}
          </div>
        ) : (
          <Card className="h-full flex flex-col border border-gray-100">
            <CardHeader className="flex-shrink-0 border-b border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Patient Records
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-56">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                      <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={viewMode === ('table' as ViewMode) ? 'default' : 'ghost'}
                      onClick={() => setViewMode('table' as ViewMode)}
                      className="h-6 px-2"
                    >
                      <List className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant={viewMode === ('grid' as ViewMode) ? 'default' : 'ghost'}
                      onClick={() => setViewMode('grid' as ViewMode)}
                      className="h-6 px-2"
                    >
                      <Grid3X3 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Loading patients...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-8">
                  <p className="text-red-500 text-sm">
                    {error instanceof Error ? error.message : 'Failed to load patients'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pb-4">
                  {displayedPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="bg-white rounded-lg border border-gray-100 p-3 hover:border-medical-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-medical-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-medical-blue-600">
                              {getPatientInitials(patient.firstName, patient.lastName)}
                            </span>
                          </div>
                          <div className="ml-2">
                            <h3 className="text-xs font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-xs text-gray-500">P-{patient.id}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewDetails(patient)}
                          className="hover:bg-medical-blue-50 h-6 w-6 p-0"
                        >
                          <Eye className="w-3 h-3 text-medical-blue-600" />
                        </Button>
                      </div>

                      <div className="mt-3 space-y-1">
                        <div className="flex items-center text-xs text-gray-600">
                          <Phone className="w-3 h-3 mr-1" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <Mail className="w-3 h-3 mr-1" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        <div className="flex items-center text-xs text-gray-600">
                          <CalendarDays className="w-3 h-3 mr-1" />
                          {new Date(patient.dateOfBirth).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center space-x-1">
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          {patient.gender}
                        </Badge>
                        <Badge variant="secondary" className="text-xs px-1 py-0">
                          {new Date(patient.createdAt).getFullYear()}
                        </Badge>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center justify-center space-x-1 h-6 text-xs"
                          onClick={() => viewPatientAppointments(patient)}
                        >
                          <Calendar className="w-3 h-3" />
                          <span>Appts</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center justify-center space-x-1 h-6 text-xs"
                          onClick={() => viewPatientPayments(patient.id)}
                        >
                          <IndianRupee className="w-3 h-3" />
                          <span>Pay</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {displayedPatients.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">
                        {searchQuery.length > 2 
                          ? 'No patients found matching your search' 
                          : 'No patients registered yet'
                        }
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

          {showPatientModal && (
            <PatientRegistrationModal
              isOpen={showPatientModal}
              onClose={() => setShowPatientModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
                queryClient.invalidateQueries({ queryKey: ['/api/patients/search'] });
              }}
            />
          )}

          {/* Patient Appointments Modal */}
          <Dialog open={showAppointmentsModal} onOpenChange={setShowAppointmentsModal}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-medical-blue-600" />
                  {selectedPatientForAppointments && (
                    <>Appointments for {selectedPatientForAppointments.firstName} {selectedPatientForAppointments.lastName}</>
                  )}
                </DialogTitle>
              </DialogHeader>

              {selectedPatientForAppointments && (
                <div className="space-y-4">
                  {/* Patient Info Summary */}
                  <div className="bg-medical-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-medical-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-medical-blue-600 font-medium">
                          {getPatientInitials(selectedPatientForAppointments.firstName, selectedPatientForAppointments.lastName)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {selectedPatientForAppointments.firstName} {selectedPatientForAppointments.lastName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {selectedPatientForAppointments.phone} • {selectedPatientForAppointments.email}
                        </p>
                      </div>
                      <div className="ml-auto">
                        <Button
                          onClick={() => openBookingModal(selectedPatientForAppointments)}
                          className="bg-medical-blue-600 hover:bg-medical-blue-700"
                        >
                          <CalendarPlus className="w-4 h-4 mr-2" />
                          Book Appointment
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Appointments List */}
                  {appointmentsLoading ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Loading appointments...</p>
                    </div>
                  ) : patientAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
                        <Calendar className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
                      <p className="text-gray-500 mb-4">
                        This patient hasn't booked any appointments yet.
                      </p>
                      <Button
                        onClick={() => openBookingModal(selectedPatientForAppointments)}
                        className="bg-medical-blue-600 hover:bg-medical-blue-700"
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" />
                        Book First Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientAppointments
                        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())
                        .map((appointment) => (
                          <Card key={appointment._id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                                {/* Date & Time */}
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      {formatDate(appointment.datetime)}
                                    </div>
                                    <div className="text-sm text-gray-500 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(appointment.datetime)}
                                    </div>
                                  </div>
                                </div>

                                {/* Doctor */}
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <Stethoscope className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900">
                                      Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {appointment.doctorId.specialization}
                                    </div>
                                  </div>
                                </div>

                                {/* Type & Token */}
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium text-gray-700">Type:</span>
                                    <Badge variant="outline" className="capitalize">
                                      {appointment.type}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-gray-700">Token:</span>
                                    <Badge className="bg-blue-100 text-blue-800">
                                      #{appointment.tokenNumber}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Status */}
                                <div className="flex flex-col items-end gap-2">
                                  <Badge className={getStatusColor(appointment.status)}>
                                    {appointment.status}
                                  </Badge>
                                  {appointment.notes && (
                                    <div className="text-xs text-gray-500 text-right">
                                      <FileText className="w-3 h-3 inline mr-1" />
                                      Has notes
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Notes */}
                              {appointment.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                  <div className="bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
                                    <div className="flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                      <div>
                                        <div className="text-sm font-medium text-yellow-800">Notes:</div>
                                        <div className="text-sm text-yellow-700">{appointment.notes}</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Book Appointment Modal */}
          <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CalendarPlus className="h-5 w-5 text-medical-blue-600" />
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
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id}>
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
                        {doctors.map((doctor) => (
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
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowBookingModal(false);
                      setNewAppointment({
                        patientId: "",
                        doctorId: "",
                        datetime: "",
                        type: "consultation",
                        notes: ""
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleBookAppointment}
                    className="bg-medical-blue-600 hover:bg-medical-blue-700"
                  >
                    Book Appointment
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-medical-blue-600" />
                  Patient Details
                </DialogTitle>
              </DialogHeader>

              {selectedPatient && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Full Name</p>
                        <p className="text-base font-medium text-gray-900">
                          {selectedPatient.firstName} {selectedPatient.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Patient ID</p>
                        <p className="text-base font-medium text-gray-900">P-{selectedPatient.id}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Date of Birth</p>
                        <p className="text-base font-medium text-gray-900">
                          {formatDate(selectedPatient.dateOfBirth)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Gender</p>
                        <p className="text-base font-medium text-gray-900">{selectedPatient.gender}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Phone className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Phone Number</p>
                          <p className="text-base font-medium text-gray-900">{selectedPatient.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <p className="text-sm text-gray-500">Email Address</p>
                          <p className="text-base font-medium text-gray-900">{selectedPatient.email}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPin className="w-5 h-5 text-gray-400 mr-2 mt-1" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="text-base font-medium text-gray-900">{selectedPatient.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient History</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-medical-blue-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-medical-blue-600">Total Appointments</p>
                            <p className="text-2xl font-bold text-medical-blue-700">
                              {selectedPatient.appointmentsCount || 0}
                            </p>
                          </div>
                          <Calendar className="w-8 h-8 text-medical-blue-500" />
                        </div>
                      </div>
                      <div className="bg-medical-green-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-medical-green-600">Total Payments</p>
                            <p className="text-2xl font-bold text-medical-green-700">
                              {formatAmount(selectedPatient.paymentsTotal || 0)}
                            </p>
                          </div>
                          <IndianRupee className="w-8 h-8 text-medical-green-500" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => viewPatientAppointments(selectedPatient)}
                      className="flex items-center"
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      View Appointments
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => viewPatientPayments(selectedPatient.id)}
                      className="flex items-center"
                    >
                      <IndianRupee className="w-4 h-4 mr-2" />
                      View Payments
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
  );
} 