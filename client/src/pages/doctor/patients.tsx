import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
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
  ChevronDown,
  MoreHorizontal
} from "lucide-react";
import { type User as AuthUser, authService } from "@/lib/auth";
import LoadingEye from '@/components/ui/LoadingEye';
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/ui/data-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { EnhancedTable } from "@/components/ui/enhanced-table";
import { cn } from "@/lib/utils";
import { ChatWidget } from '@/components/chat/ChatWidget';

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
const API_URL = import.meta.env.VITE_API_URL;
async function fetchPatients(): Promise<Patient[]> {
  const token = authService.getToken();
  const response = await fetch(`${API_URL}/api/patients`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
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
  const token = authService.getToken();
  const response = await fetch(`${API_URL}/api/patients/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
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

const patientColumns: ColumnDef<Patient>[] = [
  {
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: "Patient Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-1.5">
        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium text-xs">
          {row.original.firstName[0]}{row.original.lastName[0]}
        </div>
        <div>
          <div className="font-medium text-sm">{row.original.firstName} {row.original.lastName}</div>
          <div className="text-xs text-gray-500">{calculateAge(row.original.dateOfBirth)}y • {row.original.gender}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "phone",
    header: "Contact",
    cell: ({ row }) => (
      <div>
        <div className="flex items-center gap-1 text-sm">
          <Phone className="h-3 w-3 text-gray-500" />
          <span>{row.original.phone}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 truncate max-w-32">
          <Mail className="h-3 w-3" />
          <span>{row.original.email}</span>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "lastVisit",
    header: "Last Visit",
    cell: ({ row }) => {
      const date = row.original.lastVisit;
      return date ? (
        <span className="text-sm">{format(new Date(date), "MMM dd, yyyy")}</span>
      ) : (
        <span className="text-xs text-gray-500">No visits</span>
      );
    },
  },
  {
    accessorKey: "appointmentsCount",
    header: "Visits",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono text-xs px-2 py-0.5">
        {row.original.appointmentsCount}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const urgentFlags = row.original.urgentFlags || [];
      return (
        <div className="flex items-center gap-1">
          <Badge className={cn(
            "capitalize text-xs px-1.5 py-0.5",
            status === "active" && "bg-green-100 text-green-800",
            status === "inactive" && "bg-gray-100 text-gray-800",
            status === "critical" && "bg-red-100 text-red-800"
          )}>
            {status}
          </Badge>
          {urgentFlags.length > 0 && (
            <Badge variant="destructive" className="text-xs px-1 py-0.5">
              {urgentFlags.length}
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const patient = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-6 w-6 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => viewPatientDetails(patient.id)}
              className="cursor-pointer text-xs"
            >
              <Eye className="mr-2 h-3 w-3" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => viewPatientHistory(patient.id)}
              className="cursor-pointer text-xs"
            >
              <FileText className="mr-2 h-3 w-3" />
              View History
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => scheduleAppointment(patient.id)}
              className="cursor-pointer text-xs"
            >
              <Calendar className="mr-2 h-3 w-3" />
              Schedule Appointment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

// Helper functions
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

const viewPatientDetails = (patientId: string) => {
  // TODO: Navigate to patient details page when route is added
  console.log('View patient details:', patientId);
  // navigate({ to: `/patient/${patientId}` });
};

const viewPatientHistory = (patientId: string) => {
  // TODO: Navigate to patient history page when route is added
  console.log('View patient history:', patientId);
  // navigate({ to: `/patient/${patientId}/history` });
};

const scheduleAppointment = (patientId: string) => {
  // TODO: Open appointment booking modal instead of navigation
  console.log('Schedule appointment for patient:', patientId);
  // navigate({ to: `/appointments/new?patientId=${patientId}` });
};

export default function DoctorPatientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
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

  const viewPatientAppointments = (patientId: string) => {
    // Navigate to appointments page with patient filter
    navigate({ to: '/doctor/appointments', search: { patientId } });
  };

  const addNewPatient = () => {
    // TODO: Open patient registration modal instead of navigation
    // For now, we'll just log the action
    console.log('Add new patient - should open modal');
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
              {patient.status === 'active' ? 'Active' : 'Inactive'}
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
                {patient.status === 'active' ? 'Active' : 'Inactive'}
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
      
      {/* Chat Widget - Fixed Bottom Right */}
      <ChatWidget />
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-gray-50">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0 px-3 pt-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between py-1">
          <div>
            <h2 className="text-lg font-bold text-gray-900">My Patients</h2>
            <p className="text-xs text-gray-600">
              Manage your patient records and appointments
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportPatients}
              className="flex items-center h-7"
            >
              <Download className="w-3 h-3 mr-1" />
              Export
            </Button>
            <Button 
              onClick={addNewPatient} 
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 h-7"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Patient
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-2">
              <div className="flex items-center">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-lg font-bold text-gray-900">{patients.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-2">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-green-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-lg font-bold text-gray-900">
                    {patients.filter(p => p.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-2">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Critical</p>
                  <p className="text-lg font-bold text-gray-900">
                    {patients.filter(p => p.status === 'critical' || (p.urgentFlags && p.urgentFlags.length > 0)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-sm border-gray-200">
            <CardContent className="p-2">
              <div className="flex items-center">
                <CalendarDays className="w-5 h-5 text-purple-600" />
                <div className="ml-2">
                  <p className="text-xs font-medium text-gray-600">Recent</p>
                  <p className="text-lg font-bold text-gray-900">
                    {patients.filter(p => p.lastVisit && new Date(p.lastVisit) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-hidden px-3 mt-1">
        {viewMode === 'table' ? (
          <Card className="h-full overflow-hidden flex flex-col">
            <CardContent className="p-0 flex-1 overflow-hidden">
              <div className="h-full overflow-auto">
                <EnhancedTable
                  columns={patientColumns}
                  data={filteredAndSortedPatients}
                  searchPlaceholder="Search patients by name, phone, email..."
                  filterOptions={[
                    {
                      label: "Status",
                      value: "status",
                      options: [
                        { label: "All", value: "all" },
                        { label: "Active", value: "active" },
                        { label: "Inactive", value: "inactive" },
                        { label: "Critical", value: "critical" },
                      ],
                    },
                    {
                      label: "Sort By",
                      value: "sortBy",
                      options: [
                        { label: "Name", value: "name" },
                        { label: "Last Visit", value: "lastVisit" },
                        { label: "Age", value: "age" },
                      ],
                    },
                  ]}
                  showFooter={true}
                  rowsPerPageOptions={[10, 20, 50, 100]}
                  defaultRowsPerPage={10}
                  footerProps={{
                    className: "border-t bg-white py-1 px-3",
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
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full overflow-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
              {filteredAndSortedPatients.map((patient) => (
                <PatientCard key={patient.id} patient={patient} />
              ))}
            </div>
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
      </div>
    </div>
  );
}