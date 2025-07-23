import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Search, 
  Eye, 
  Edit,
  CheckCircle,
  XCircle,
  AlertCircle,
  Stethoscope,
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

interface Appointment {
  _id: string;
  patientName: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'in-progress';
  department: string;
  notes: string;
  duration: number;
}

const Appointments: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Mock data for testing
  const appointments: Appointment[] = [
    {
      _id: '1',
      patientName: 'John Doe',
      doctorName: 'Dr. Smith',
      date: '2024-01-15',
      time: '10:00 AM',
      type: 'Consultation',
      status: 'scheduled',
      department: 'Cardiology',
      notes: 'Regular checkup',
      duration: 30
    },
    {
      _id: '2',
      patientName: 'Jane Smith',
      doctorName: 'Dr. Johnson',
      date: '2024-01-15',
      time: '2:00 PM',
      type: 'Follow-up',
      status: 'completed',
      department: 'Pediatrics',
      notes: 'Post-surgery follow-up',
      duration: 45
    },
    {
      _id: '3',
      patientName: 'Mike Brown',
      doctorName: 'Dr. Wilson',
      date: '2024-01-15',
      time: '4:00 PM',
      type: 'Emergency',
      status: 'cancelled',
      department: 'Emergency',
      notes: 'Patient cancelled',
      duration: 60
    },
    {
      _id: '4',
      patientName: 'Sarah Davis',
      doctorName: 'Dr. Anderson',
      date: '2024-01-16',
      time: '9:00 AM',
      type: 'Consultation',
      status: 'scheduled',
      department: 'Orthopedics',
      notes: 'Knee pain evaluation',
      duration: 30
    },
    {
      _id: '5',
      patientName: 'Robert Johnson',
      doctorName: 'Dr. Miller',
      date: '2024-01-16',
      time: '11:00 AM',
      type: 'Procedure',
      status: 'in-progress',
      department: 'Surgery',
      notes: 'Minor surgery',
      duration: 120
    },
    {
      _id: '6',
      patientName: 'Emily Wilson',
      doctorName: 'Dr. Brown',
      date: '2024-01-16',
      time: '3:00 PM',
      type: 'Follow-up',
      status: 'completed',
      department: 'Neurology',
      notes: 'Post-treatment check',
      duration: 45
    },
    {
      _id: '7',
      patientName: 'David Taylor',
      doctorName: 'Dr. Davis',
      date: '2024-01-17',
      time: '8:00 AM',
      type: 'Emergency',
      status: 'scheduled',
      department: 'Emergency',
      notes: 'Urgent care needed',
      duration: 90
    },
    {
      _id: '8',
      patientName: 'Lisa Martinez',
      doctorName: 'Dr. Garcia',
      date: '2024-01-17',
      time: '1:00 PM',
      type: 'Consultation',
      status: 'cancelled',
      department: 'Dermatology',
      notes: 'Rescheduled by patient',
      duration: 30
    }
  ];

  const stats = {
    today: appointments.filter(apt => {
      const today = new Date();
      const aptDate = new Date(apt.date);
      return aptDate.toDateString() === today.toDateString();
    }).length,
    completed: appointments.filter(apt => apt.status === 'completed').length,
    pending: appointments.filter(apt => apt.status === 'scheduled' || apt.status === 'in-progress').length,
    cancelled: appointments.filter(apt => apt.status === 'cancelled').length
  };

  const filteredAppointments = appointments.filter((appointment) => {
    const matchesSearch = 
      appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.doctorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appointment.notes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || appointment.status === statusFilter;
    const matchesType = typeFilter === 'all' || appointment.type.toLowerCase() === typeFilter.toLowerCase();
    
    // Add date range filtering
    let matchesDateRange = true;
    if (dateRange?.from && dateRange?.to) {
      const appointmentDate = new Date(appointment.date);
      matchesDateRange = appointmentDate >= dateRange.from && appointmentDate <= dateRange.to;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDateRange;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled': return <Clock className="w-3 h-3" />;
      case 'completed': return <CheckCircle className="w-3 h-3" />;
      case 'cancelled': return <XCircle className="w-3 h-3" />;
      case 'in-progress': return <AlertCircle className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  // Define columns for the enhanced table
  const columns: ColumnDef<Appointment>[] = [
    {
      accessorKey: "patientName",
      header: "Patient",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div className="flex items-center space-x-3">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                {appointment.patientName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{appointment.patientName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "doctorName",
      header: "Doctor",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Stethoscope className="w-4 h-4 text-gray-400" />
            <span>{appointment.doctorName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "date",
      header: "Date & Time",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <div>
            <div className="font-medium">{appointment.date}</div>
            <div className="text-sm text-gray-500">{appointment.time}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "department",
      header: "Department",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const appointment = row.original;
        return (
          <Badge className={`${getStatusColor(appointment.status)} border`}>
            <div className="flex items-center space-x-1">
              {getStatusIcon(appointment.status)}
              <span className="capitalize">{appointment.status}</span>
            </div>
          </Badge>
        );
      },
    },
    {
      accessorKey: "duration",
      header: "Duration",
      cell: ({ row }) => `${row.getValue("duration")} min`,
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
        { label: "Scheduled", value: "scheduled" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "In Progress", value: "in-progress" },
      ],
    },
    {
      label: "Type",
      value: "type",
      options: [
        { label: "All Types", value: "all" },
        { label: "Consultation", value: "consultation" },
        { label: "Follow-up", value: "follow-up" },
        { label: "Emergency", value: "emergency" },
        { label: "Procedure", value: "procedure" },
      ],
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appointments</h1>
          <p className="text-gray-600 mt-1">Manage and track all appointments</p>
        </div>
        
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Appointments</p>
                <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search appointments by patient, doctor, type, department, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Date Range Filter */}
            <div className="w-full md:w-64">
              <DatePickerWithRange
                value={dateRange}
                onChange={setDateRange}
                placeholder="Select date range for appointments"
                className="w-full"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="consultation">Consultation</SelectItem>
                <SelectItem value="follow-up">Follow-up</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="procedure">Procedure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Appointments</CardTitle>
              <CardDescription>
                {filteredAppointments.length} of {appointments.length} appointment(s) found
                {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateRange) && (
                  <span className="ml-2 text-blue-600">
                    (filtered)
                  </span>
                )}
              </CardDescription>
            </div>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateRange) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
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
          <Tabs defaultValue="cards" className="w-full">
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
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((appointment) => (
                    <div key={appointment._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-blue-100 text-blue-700">
                                {appointment.patientName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="font-semibold text-gray-900">{appointment.patientName}</h3>
                              <p className="text-sm text-gray-600 flex items-center">
                                <Stethoscope className="w-4 h-4 mr-1" />
                                {appointment.doctorName}
                              </p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Date & Time</p>
                              <p className="font-medium">{appointment.date} at {appointment.time}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Type</p>
                              <p className="font-medium">{appointment.type}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Department</p>
                              <p className="font-medium">{appointment.department}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Duration</p>
                              <p className="font-medium">{appointment.duration} min</p>
                            </div>
                          </div>
                          
                          {appointment.notes && (
                            <div className="mt-3">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Notes:</span> {appointment.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={`${getStatusColor(appointment.status)} border`}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(appointment.status)}
                              <span className="capitalize">{appointment.status}</span>
                            </div>
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
                    <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Appointments Found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateRange
                        ? 'Try adjusting your search or filter criteria' 
                        : 'No appointments scheduled yet'
                      }
                    </p>
                    {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateRange ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setTypeFilter('all');
                          setDateRange(undefined);
                        }}
                        className="mr-2"
                      >
                        Clear Filters
                      </Button>
                    ) : null}
                    <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="table" className="mt-6">
              <EnhancedTable
                columns={columns}
                data={filteredAppointments}
                searchPlaceholder="Search appointments..."
                filterOptions={filterOptions}
                showFooter={true}
                footerProps={{
                  showFirstLastButtons: true,
                  labelRowsPerPage: "Appointments per page:",
                  labelDisplayedRows: ({ from, to, count }) => 
                    `${from}-${to} of ${count} appointments`
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

export default Appointments; 