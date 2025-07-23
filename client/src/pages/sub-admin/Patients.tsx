import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Eye, 
  Edit,
  UserPlus,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Heart,
  AlertTriangle,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EnhancedTable } from '@/components/ui/enhanced-table';
import { DatePickerWithRange } from '@/components/ui/date-picker-with-range';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: 'male' | 'female' | 'other';
  age: number;
  bloodGroup: string;
  address: string;
  emergencyContact: string;
  allergies: string[];
  chronicConditions: string[];
  lastVisit: string;
  totalVisits: number;
  status: 'active' | 'inactive' | 'critical';
  registrationDate: string;
}

const Patients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [bloodGroupFilter, setBloodGroupFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Mock data for testing
  const patients: Patient[] = [
    {
      _id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@email.com',
      phone: '+1234567890',
      gender: 'male',
      age: 35,
      bloodGroup: 'A+',
      address: '123 Main St, City',
      emergencyContact: '+1234567891',
      allergies: ['Penicillin'],
      chronicConditions: ['Hypertension'],
      lastVisit: '2024-01-10',
      totalVisits: 8,
      status: 'active',
      registrationDate: '2023-06-15'
    },
    {
      _id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@email.com',
      phone: '+1234567892',
      gender: 'female',
      age: 28,
      bloodGroup: 'B-',
      address: '456 Oak Ave, City',
      emergencyContact: '+1234567893',
      allergies: [],
      chronicConditions: [],
      lastVisit: '2024-01-12',
      totalVisits: 3,
      status: 'active',
      registrationDate: '2023-12-01'
    },
    {
      _id: '3',
      firstName: 'Mike',
      lastName: 'Johnson',
      email: 'mike.johnson@email.com',
      phone: '+1234567894',
      gender: 'male',
      age: 42,
      bloodGroup: 'O+',
      address: '789 Pine St, City',
      emergencyContact: '+1234567895',
      allergies: ['Shellfish'],
      chronicConditions: ['Diabetes'],
      lastVisit: '2023-12-20',
      totalVisits: 15,
      status: 'inactive',
      registrationDate: '2022-03-10'
    },
    {
      _id: '4',
      firstName: 'Sarah',
      lastName: 'Williams',
      email: 'sarah.williams@email.com',
      phone: '+1234567896',
      gender: 'female',
      age: 31,
      bloodGroup: 'AB+',
      address: '321 Elm St, City',
      emergencyContact: '+1234567897',
      allergies: ['Nuts'],
      chronicConditions: [],
      lastVisit: '2024-01-15',
      totalVisits: 5,
      status: 'active',
      registrationDate: '2023-09-20'
    },
    {
      _id: '5',
      firstName: 'Robert',
      lastName: 'Brown',
      email: 'robert.brown@email.com',
      phone: '+1234567898',
      gender: 'male',
      age: 67,
      bloodGroup: 'O-',
      address: '654 Maple Ave, City',
      emergencyContact: '+1234567899',
      allergies: ['Latex'],
      chronicConditions: ['Heart Disease', 'Arthritis'],
      lastVisit: '2024-01-08',
      totalVisits: 22,
      status: 'critical',
      registrationDate: '2021-11-05'
    },
    {
      _id: '6',
      firstName: 'Emily',
      lastName: 'Davis',
      email: 'emily.davis@email.com',
      phone: '+1234567900',
      gender: 'female',
      age: 25,
      bloodGroup: 'A-',
      address: '987 Cedar St, City',
      emergencyContact: '+1234567901',
      allergies: [],
      chronicConditions: [],
      lastVisit: '2024-01-14',
      totalVisits: 2,
      status: 'active',
      registrationDate: '2024-01-01'
    },
    {
      _id: '7',
      firstName: 'David',
      lastName: 'Wilson',
      email: 'david.wilson@email.com',
      phone: '+1234567902',
      gender: 'male',
      age: 54,
      bloodGroup: 'B+',
      address: '159 Birch Lane, City',
      emergencyContact: '+1234567903',
      allergies: ['Aspirin'],
      chronicConditions: ['High Cholesterol'],
      lastVisit: '2023-11-30',
      totalVisits: 12,
      status: 'inactive',
      registrationDate: '2022-08-12'
    },
    {
      _id: '8',
      firstName: 'Lisa',
      lastName: 'Anderson',
      email: 'lisa.anderson@email.com',
      phone: '+1234567904',
      gender: 'female',
      age: 44,
      bloodGroup: 'AB-',
      address: '753 Willow Dr, City',
      emergencyContact: '+1234567905',
      allergies: ['Sulfa drugs'],
      chronicConditions: ['Asthma'],
      lastVisit: '2024-01-09',
      totalVisits: 18,
      status: 'critical',
      registrationDate: '2022-05-18'
    }
  ];

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    new: patients.filter(p => {
      const registrationDate = new Date(p.registrationDate);
      const currentDate = new Date();
      const oneMonthAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
      return registrationDate >= oneMonthAgo;
    }).length,
    critical: patients.filter(p => p.status === 'critical').length
  };

  // Remove duplicate patients by _id
  const uniquePatients = Array.from(
    new Map(patients.map(patient => [patient._id, patient])).values()
  );

  const filteredPatients = uniquePatients.filter((patient) => {
    const matchesSearch = 
      patient.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.bloodGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.allergies.some(allergy => allergy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      patient.chronicConditions.some(condition => condition.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    const matchesGender = genderFilter === 'all' || patient.gender === genderFilter;
    const matchesBloodGroup = bloodGroupFilter === 'all' || patient.bloodGroup === bloodGroupFilter;
    
    // Add date range filtering for registration date
    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to) {
      const registrationDate = new Date(patient.registrationDate);
      matchesDateRange = registrationDate >= dateRange.from && registrationDate <= dateRange.to;
    }
    
    return matchesSearch && matchesStatus && matchesGender && matchesBloodGroup && matchesDateRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Define columns for the enhanced table
  const columns: ColumnDef<Patient>[] = [
    {
      accessorKey: "firstName",
      header: "Patient",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {patient.firstName[0]}{patient.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{patient.firstName} {patient.lastName}</div>
              <div className="text-sm text-gray-500">{patient.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Contact",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Phone className="w-3 h-3 text-gray-400" />
              <span className="text-sm">{patient.phone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-3 h-3 text-gray-400" />
              <span className="text-sm truncate max-w-32">{patient.address}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "age",
      header: "Age/Gender",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <div>
            <div className="font-medium">{patient.age} years</div>
            <div className="text-sm text-gray-500 capitalize">{patient.gender}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "bloodGroup",
      header: "Blood Group",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <Badge variant="outline" className="font-medium">
            {patient.bloodGroup}
          </Badge>
        );
      },
    },
    {
      accessorKey: "lastVisit",
      header: "Last Visit",
      cell: ({ row }) => {
        const patient = row.original;
        return <div className="text-sm">{patient.lastVisit}</div>;
      },
    },
    {
      accessorKey: "totalVisits",
      header: "Total Visits",
      cell: ({ row }) => {
        const patient = row.original;
        return <div className="font-medium">{patient.totalVisits}</div>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const patient = row.original;
        return (
          <Badge className={`${getStatusColor(patient.status)} border`}>
            <span className="capitalize">{patient.status}</span>
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        return (
          <div className="flex items-center justify-end space-x-2">
            <Button variant="ghost" size="sm">
              <Eye className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Edit className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  const filterOptions = [
    {
      label: "Status",
      value: "status",
      options: [
        { label: "All Statuses", value: "all" },
        { label: "Active", value: "active" },
        { label: "Inactive", value: "inactive" },
        { label: "Critical", value: "critical" },
      ],
    },
    {
      label: "Gender",
      value: "gender",
      options: [
        { label: "All Genders", value: "all" },
        { label: "Male", value: "male" },
        { label: "Female", value: "female" },
        { label: "Other", value: "other" },
      ],
    },
    {
      label: "Blood Group",
      value: "bloodGroup",
      options: [
        { label: "All Blood Groups", value: "all" },
        { label: "A+", value: "A+" },
        { label: "A-", value: "A-" },
        { label: "B+", value: "B+" },
        { label: "B-", value: "B-" },
        { label: "AB+", value: "AB+" },
        { label: "AB-", value: "AB-" },
        { label: "O+", value: "O+" },
        { label: "O-", value: "O-" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Patients</h1>
          <p className="text-gray-600 mt-1">Manage patient records and information</p>
        </div>
       
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Patients</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Patients</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <Heart className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-purple-600">{stats.new}</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Cases</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search patients by name, email, phone, address, blood group, allergies, or conditions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Filters Row */}
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Date Range Filter */}
              <div className="w-full lg:w-64">
                <DatePickerWithRange
                  value={dateRange}
                  onChange={setDateRange}
                  placeholder="Select registration date range"
                  className="w-full"
                />
              </div>
              
              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Gender Filter */}
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Blood Group Filter */}
              <Select value={bloodGroupFilter} onValueChange={setBloodGroupFilter}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue placeholder="Filter by blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Blood Groups</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Patients Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Patient Records</CardTitle>
              <CardDescription>
                {filteredPatients.length} of {patients.length} patient(s) found
                {(searchTerm || statusFilter !== 'all' || genderFilter !== 'all' || bloodGroupFilter !== 'all' || dateRange) && (
                  <span className="ml-2 text-blue-600">
                    (filtered)
                  </span>
                )}
              </CardDescription>
            </div>
            {(searchTerm || statusFilter !== 'all' || genderFilter !== 'all' || bloodGroupFilter !== 'all' || dateRange) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setGenderFilter('all');
                  setBloodGroupFilter('all');
                  setDateRange(undefined);
                }}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="table" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4" />
                Card View
              </TabsTrigger>
              <TabsTrigger value="table" className="flex items-center gap-2">
                <TableIcon className="w-4 h-4" />
                Table View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="cards" className="mt-6">
              <div className="space-y-4">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <div key={patient._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                {patient.firstName[0]}{patient.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {patient.age} years old • {patient.gender} • {patient.bloodGroup}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{patient.email}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Phone className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">{patient.phone}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600 truncate">{patient.address}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-600">Last visit: {patient.lastVisit}</span>
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <span className="text-gray-500">Total visits:</span>
                                <span className="ml-2 font-medium">{patient.totalVisits}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Emergency contact:</span>
                                <span className="ml-2 font-medium">{patient.emergencyContact}</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Medical Information */}
                          <div className="mt-4 pt-3 border-t">
                            <div className="flex flex-wrap gap-4 text-sm">
                              {patient.allergies.length > 0 && (
                                <div>
                                  <span className="text-red-600 font-medium">Allergies:</span>
                                  <span className="ml-2 text-red-700">{patient.allergies.join(', ')}</span>
                                </div>
                              )}
                              {patient.chronicConditions.length > 0 && (
                                <div>
                                  <span className="text-orange-600 font-medium">Chronic conditions:</span>
                                  <span className="ml-2 text-orange-700">{patient.chronicConditions.join(', ')}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(patient.status)} border`}>
                            <span className="capitalize">{patient.status}</span>
                          </Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Patients Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || genderFilter !== 'all' || bloodGroupFilter !== 'all' || dateRange
                        ? 'Try adjusting your search or filter criteria' 
                        : 'No patients registered yet'
                      }
                    </p>
                    {searchTerm || statusFilter !== 'all' || genderFilter !== 'all' || bloodGroupFilter !== 'all' || dateRange ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setGenderFilter('all');
                          setBloodGroupFilter('all');
                          setDateRange(undefined);
                        }}
                        className="mr-2"
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                   
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <EnhancedTable
                columns={columns}
                data={filteredPatients}
                searchPlaceholder="Search patients..."
                filterOptions={filterOptions}
                showFooter={true}
                footerProps={{
                  showFirstLastButtons: true,
                  labelRowsPerPage: "Patients per page:",
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}-${to} of ${count} patients`
                }}
                viewToggle={{
                  mode: viewMode,
                  onToggle: setViewMode
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Patients; 