import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search,
  Eye,
  Phone,
  Mail,
  CalendarDays,
  Calendar,
  FileText,
  Stethoscope,
  ClipboardList,
  Filter,
  Plus,
  Users,
  Clock,
  AlertCircle,
  MapPin,
  Download,
  Grid3X3,
  List,
  SortAsc,
  ChevronDown
} from "lucide-react";
import { type User } from "@/lib/auth";

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
  lastVisit?: string;
  medicalConditions?: string[];
  urgentFlags?: string[];
  status?: 'active' | 'inactive' | 'critical';
}

async function fetchPatients(): Promise<Patient[]> {
  const response = await fetch('/api/patients');
  if (!response.ok) {
    throw new Error('Failed to fetch patients');
  }
  const responseData = await response.json();
  
  const patientsArray = responseData.data?.patients || [];
  
  return patientsArray.map((patient: any) => ({
    id: patient._id || patient.id || '',
    firstName: patient.firstName || 'Unknown',
    lastName: patient.lastName || 'Patient',
    email: patient.email || 'N/A',
    phone: patient.phone || 'N/A',
    dateOfBirth: patient.dateOfBirth || new Date().toISOString(),
    gender: patient.gender || 'Not Specified',
    address: patient.address || 'N/A',
    createdAt: patient.createdAt || new Date().toISOString(),
    appointmentsCount: patient.appointmentsCount || 0,
    lastVisit: patient.lastVisit || null,
    medicalConditions: patient.medicalConditions || [],
    urgentFlags: patient.urgentFlags || [],
    status: patient.status || 'active'
  }));
}

async function searchPatients(query: string): Promise<Patient[]> {
  const response = await fetch(`/api/patients/search?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to search patients');
  }
  const responseData = await response.json();
  
  const patientsArray = Array.isArray(responseData) ? responseData : responseData.data?.patients || [];
  
  return patientsArray.map((patient: any) => ({
    id: patient._id || patient.id || '',
    firstName: patient.firstName || 'Unknown',
    lastName: patient.lastName || 'Patient',
    email: patient.email || 'N/A',
    phone: patient.phone || 'N/A',
    dateOfBirth: patient.dateOfBirth || new Date().toISOString(),
    gender: patient.gender || 'Not Specified',
    address: patient.address || 'N/A',
    createdAt: patient.createdAt || new Date().toISOString(),
    appointmentsCount: patient.appointmentsCount || 0,
    lastVisit: patient.lastVisit || null,
    medicalConditions: patient.medicalConditions || [],
    urgentFlags: patient.urgentFlags || [],
    status: patient.status || 'active'
  }));
}

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'lastVisit' | 'age'>('name');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'critical' | 'recent'>('all');
  const navigate = useNavigate();

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

  // Filter and sort patients
  const filteredAndSortedPatients = displayedPatients
    .filter(patient => {
      switch (filterBy) {
        case 'active':
          return patient.status === 'active';
        case 'critical':
          return patient.status === 'critical' || (patient.urgentFlags && patient.urgentFlags.length > 0);
        case 'recent':
          return patient.lastVisit && new Date(patient.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'lastVisit':
          return new Date(b.lastVisit || 0).getTime() - new Date(a.lastVisit || 0).getTime();
        case 'age':
          return calculateAge(a.dateOfBirth) - calculateAge(b.dateOfBirth);
        default:
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      }
    });

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const viewPatientDetails = (patientId: string) => {
    navigate(`/patient/${patientId}`);
  };

  const viewPatientHistory = (patientId: string) => {
    navigate(`/patient/${patientId}/history`);
  };

  const viewPatientAppointments = (patientId: string) => {
    navigate(`/appointments?patientId=${patientId}`);
  };

  const scheduleAppointment = (patientId: string) => {
    navigate(`/appointments/new?patientId=${patientId}`);
  };

  const addNewPatient = () => {
    navigate('/patients/new');
  };

  const exportPatients = () => {
    // Export functionality
    console.log('Exporting patients...');
  };

  const PatientCard = ({ patient }: { patient: Patient }) => (
    <div 
      className="bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => viewPatientDetails(patient.id)}
                    >
      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
          <div className="relative">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white font-semibold text-lg">
                              {getPatientInitials(patient.firstName, patient.lastName)}
                            </span>
                          </div>
            {patient.urgentFlags && patient.urgentFlags.length > 0 && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {patient.firstName} {patient.lastName}
                            </h3>
            <p className="text-sm text-gray-500">
                              {calculateAge(patient.dateOfBirth)} years • {patient.gender}
                            </p>
            <Badge className={`mt-1 text-xs ${getStatusColor(patient.status || 'active')}`}>
              {patient.status || 'Active'}
            </Badge>
                          </div>
                        </div>
                      </div>

      <div className="space-y-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
          <Phone className="w-4 h-4 mr-3 text-gray-400" />
          <span className="font-medium">{patient.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
          <Mail className="w-4 h-4 mr-3 text-gray-400" />
                          <span className="truncate">{patient.email}</span>
                        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-3 text-gray-400" />
          <span className="truncate">{patient.address}</span>
                        </div>
                        {patient.lastVisit && (
                          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-3 text-gray-400" />
                            <span>Last visit: {formatDate(patient.lastVisit)}</span>
                          </div>
                        )}
                      </div>

      <div className="flex items-center space-x-2 mb-4 flex-wrap gap-2">
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {patient.appointmentsCount} visits
                        </Badge>
                        {patient.medicalConditions && patient.medicalConditions.length > 0 && (
          <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {patient.medicalConditions.length} condition{patient.medicalConditions.length > 1 ? 's' : ''}
                          </Badge>
                        )}
        {patient.urgentFlags && patient.urgentFlags.length > 0 && (
          <Badge variant="destructive" className="text-xs">
            Urgent
                          </Badge>
                        )}
                      </div>

      <div className="grid grid-cols-4 gap-2">
        
                        
                        
      </div>
    </div>
  );

  const PatientListItem = ({ patient }: { patient: Patient }) => (
    <div 
      className="bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
      onClick={() => viewPatientDetails(patient.id)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-medium">
                {getPatientInitials(patient.firstName, patient.lastName)}
              </span>
            </div>
            {patient.urgentFlags && patient.urgentFlags.length > 0 && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <h3 className="text-sm font-semibold text-gray-900 truncate">
                {patient.firstName} {patient.lastName}
              </h3>
              <Badge className={`text-xs ${getStatusColor(patient.status || 'active')}`}>
                {patient.status || 'Active'}
              </Badge>
            </div>
            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
              <span>{calculateAge(patient.dateOfBirth)} years</span>
              <span>{patient.gender}</span>
              <span>{patient.phone}</span>
              {patient.lastVisit && (
                <span>Last visit: {formatDate(patient.lastVisit)}</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="text-xs">
            {patient.appointmentsCount} visits
          </Badge>
          <div className="flex space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                viewPatientDetails(patient.id);
              }}
            >
              <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
              variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            scheduleAppointment(patient.id);
                          }}
                        >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              My Patients
            </h1>
            <p className="text-gray-600 mt-1">Manage your patient records and appointments</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={exportPatients}
              className="flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={addNewPatient}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Patient
            </Button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Input
                  type="text"
                  placeholder="Search patients by name, phone, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Patients</option>
                <option value="active">Active</option>
                <option value="critical">Critical</option>
                <option value="recent">Recent Visits</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="lastVisit">Sort by Last Visit</option>
                <option value="age">Sort by Age</option>
              </select>
              
              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="px-3 py-2 rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="px-3 py-2 rounded-l-none border-l"
                >
                  <List className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-gray-900">{patients.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Critical Cases</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.status === 'critical' || (p.urgentFlags && p.urgentFlags.length > 0)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center">
              <CalendarDays className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Recent Visits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {patients.filter(p => p.lastVisit && new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Patient List */}
      <Card className="shadow-sm border-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center justify-between">
            <span>Patient Records ({filteredAndSortedPatients.length})</span>
            <div className="text-sm font-normal text-gray-500">
              {searchQuery.length > 2 ? `Search results for "${searchQuery}"` : 'All patients'}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-blue-500 mr-2 animate-pulse" />
                <p className="text-gray-500">Loading patients...</p>
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 font-medium">
                {error instanceof Error ? error.message : 'Failed to load patients'}
              </p>
              <p className="text-gray-500 text-sm mt-2">Please try refreshing the page</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredAndSortedPatients.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredAndSortedPatients.map((patient) => (
                    <PatientListItem key={patient.id} patient={patient} />
                  ))}
                </div>
              )}

              {filteredAndSortedPatients.length === 0 && (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery.length > 2 
                      ? 'No patients found' 
                      : 'No patients yet'
                    }
                  </h3>
                  <p className="text-gray-500 mb-6">
                        {searchQuery.length > 2 
                      ? 'Try adjusting your search criteria or filters' 
                      : 'Start by adding your first patient to begin building your practice'
                        }
                      </p>
                  {searchQuery.length <= 2 && (
                    <Button
                      onClick={addNewPatient}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Patient
                    </Button>
                  )}
                </div>
              )}
            </>
              )}
            </CardContent>
          </Card>
    </div>
  );
}