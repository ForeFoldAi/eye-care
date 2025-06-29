import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PatientRegistrationModal from "@/components/PatientRegistrationModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  User
} from "lucide-react";
import { type User as AuthUser } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";

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
const API_URL = import.meta.env.VITE_API_URL;
async function fetchPatients(): Promise<Patient[]> {
  const response = await fetch(`${API_URL}/api/patients`);
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  const data = await response.json();
  
  // Validate and transform the data
  return data.map((patient: any) => ({
    id: patient.id || '',
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
  const response = await fetch(`${API_URL}/api/patients/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search patients');
  }
  const data = await response.json();
  
  return data.map((patient: any) => ({
    id: patient.id || '',
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

export default function PatientsPage() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const displayedPatients = searchQuery.length > 2 ? searchResults : patients;

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const viewPatientAppointments = (patientId: string) => {
    navigate({ to: `/appointments?patientId=${patientId}` });
  };

  const viewPatientPayments = (patientId: string) => {
    navigate({ to: `/payments?patientId=${patientId}` });
  };

  const handleViewDetails = (patient: Patient) => {
    setSelectedPatient(patient);
    setShowDetailsModal(true);
  };

  return (
    <ProtectedRoute requiredRole="receptionist">
      {(currentUser: AuthUser) => (
        <Layout user={currentUser}>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Patients</h2>
              <p className="text-gray-600">Manage and view patient records</p>
            </div>
            <Button 
              onClick={() => setShowPatientModal(true)}
              className="bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Patient
            </Button>
          </div>

          <Card className="border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">
                  Patient Records
                </CardTitle>
                <div className="w-72">
                  <div className="relative">
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
            </CardHeader>
            <CardContent className="p-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Loading patients...</p>
                </div>
              ) : isError ? (
                <div className="text-center py-12">
                  <p className="text-red-500">
                    {error instanceof Error ? error.message : 'Failed to load patients'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayedPatients.map((patient) => (
                    <div 
                      key={patient.id} 
                      className="bg-white rounded-lg border border-gray-100 p-4 hover:border-medical-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-medical-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-medical-blue-600">
                              {getPatientInitials(patient.firstName, patient.lastName)}
                            </span>
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </h3>
                            <p className="text-xs text-gray-500">ID: P-{patient.id}</p>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleViewDetails(patient)}
                          className="hover:bg-medical-blue-50"
                        >
                          <Eye className="w-4 h-4 text-medical-blue-600" />
                        </Button>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2" />
                          {patient.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {patient.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDays className="w-4 h-4 mr-2" />
                          {formatDate(patient.dateOfBirth)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {patient.gender}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Patient since {formatDate(patient.createdAt)}
                        </Badge>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center justify-center space-x-2"
                          onClick={() => viewPatientAppointments(patient.id)}
                        >
                          <Calendar className="w-4 h-4" />
                          <span>Appointments</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full flex items-center justify-center space-x-2"
                          onClick={() => viewPatientPayments(patient.id)}
                        >
                          <IndianRupee className="w-4 h-4" />
                          <span>Payments</span>
                        </Button>
                      </div>
                    </div>
                  ))}

                  {displayedPatients.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-gray-500">
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
                      onClick={() => viewPatientAppointments(selectedPatient.id)}
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
        </Layout>
      )}
    </ProtectedRoute>
  );
} 