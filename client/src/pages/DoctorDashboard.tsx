import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Calendar, 
  Users, 
  FileText, 
  Search,
  CalendarPlus,
  Clock,
  CheckCircle2,
  Phone,
  ClipboardList,
  Save,
  Check
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { type User as AuthUser } from "@/lib/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import PrescriptionModal from "@/components/PrescriptionModal";
import { authService } from "@/lib/auth";
import Layout from "@/components/Layout";
interface DashboardStats {
  todayAppointments: number;
  totalPatients: number;
  prescriptions: number;
  completedToday: number;
  pendingToday: number;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  gender: string;
  phone: string;
  email: string;
  lastVisit?: string;
}

type AppointmentStatus = 'pending' | 'completed' | 'follow-up-required' | 'cancelled';

interface Appointment {
  id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    phone: string;
    email: string;
    lastVisit?: string;
  };
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  datetime: string;
  tokenNumber: number;
  type: 'consultation' | 'follow-up' | 'emergency';
  status: AppointmentStatus;
  symptoms?: string;
  notes?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface Prescription {
  id: string;
  patientId: string;
  doctorId: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration?: string;
  quantity?: number;
  instructions?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
}

interface AppointmentModification {
  status?: AppointmentStatus;
  approved?: boolean;
  notes?: string;
}

interface AppointmentState extends Omit<Appointment, 'status'> {
  status: AppointmentStatus;
  isModified: boolean;
  isPendingSave: boolean;
  originalStatus: AppointmentStatus;
  isApproved: boolean;
}

export default function DoctorDashboard() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const navigate = useNavigate();
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // All hooks must be called here, unconditionally!
  const API_URL = import.meta.env.VITE_API_URL;
  const { data: stats = {
    todayAppointments: 0,
    totalPatients: 0,
    prescriptions: 0,
    completedToday: 0,
    pendingToday: 0,
  } } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await response.json();
      return {
        todayAppointments: parseInt(data.todayAppointments) || 0,
        totalPatients: parseInt(data.totalPatients) || 0,
        prescriptions: parseInt(data.prescriptions) || 0,
        completedToday: parseInt(data.completedToday) || 0,
        pendingToday: parseInt(data.pendingToday) || 0,
      };
    },
  });

  const user = authService.getStoredUser();
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments', user?.id, todayStr],
    queryFn: async () => {
      if (!user) return [];
      const params = new URLSearchParams({ doctorId: user.id, date: todayStr });
      const response = await fetch(`${API_URL}/api/appointments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch appointments');
      const data = await response.json();
      return data.map((apt: any) => ({
        id: apt._id?.toString() || apt.id || '',
        patientId: {
          _id: apt.patientId._id?.toString() || '',
          firstName: apt.patientId.firstName || '',
          lastName: apt.patientId.lastName || '',
          age: parseInt(apt.patientId.age) || 0,
          gender: apt.patientId.gender || '',
          phone: apt.patientId.phone || '',
          email: apt.patientId.email || '',
          lastVisit: apt.patientId.lastVisit,
        },
        doctorId: {
          _id: apt.doctorId._id?.toString() || '',
          firstName: apt.doctorId.firstName || '',
          lastName: apt.doctorId.lastName || '',
          specialization: apt.doctorId.specialization || '',
        },
        datetime: apt.datetime,
        tokenNumber: parseInt(apt.tokenNumber) || 0,
        type: apt.type || 'consultation',
        status: apt.status || 'pending',
        symptoms: apt.symptoms,
        notes: apt.notes,
        followUpDate: apt.followUpDate,
        createdAt: apt.createdAt,
        updatedAt: apt.updatedAt,
      }));
    },
  });

  const { data: prescriptions = [] } = useQuery<Prescription[]>({
    queryKey: ['/api/prescriptions'],
    queryFn: async () => {
      const token = authService.getToken(); // Make sure this method exists and works
    
      const response = await fetch(`${API_URL}/api/prescriptions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    
      if (!response.ok) throw new Error('Failed to fetch prescriptions');
    
      const data = await response.json();
      return data.map((pres: any) => ({
        id: pres._id?.toString() || pres.id || '',
        patientId: pres.patientId?.toString() || '',
        doctorId: pres.doctorId?.toString() || '',
        medication: pres.medication,
        dosage: pres.dosage,
        frequency: pres.frequency,
        duration: pres.duration,
        quantity: pres.quantity,
        instructions: pres.instructions,
        notes: pres.notes,
        isActive: pres.isActive,
        createdAt: pres.createdAt,
      }));
    }
    });

  const { data: patients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const token = authService.getToken(); // Or use your helper for token retrieval
    
      const response = await fetch(`${API_URL}/api/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
    
      if (!response.ok) throw new Error('Failed to fetch patients');
    
      const data = await response.json();
      const patientsArray = data.data?.patients || data.patients || data;
    
      return Array.isArray(patientsArray)
        ? patientsArray.map((p: any) => ({
            id: p._id?.toString() || p.id || '',
            firstName: p.firstName || '',
            lastName: p.lastName || '',
            age: parseInt(p.age) || 0,
            gender: p.gender || '',
            phone: p.phone || '',
            email: p.email || '',
            lastVisit: p.lastVisit,
          }))
        : [];
    }
    
  });

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats.todayAppointments,
      icon: Calendar,
      color: "text-medical-blue-600",
      bgColor: "bg-medical-blue-100",
      trend: `${stats.pendingToday} pending`,
      trendColor: "text-medical-orange-500"
    },
    {
      title: "Completed Today",
      value: stats.completedToday,
      icon: CheckCircle2,
      color: "text-medical-green-600",
      bgColor: "bg-medical-green-100",
      trend: "Finished consultations",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Active Prescriptions",
      value: stats.prescriptions,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      trend: "Currently active",
      trendColor: "text-medical-blue-500"
    },
    {
      title: "Total Patients",
      value: stats.totalPatients,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      trend: "Registered patients",
      trendColor: "text-purple-500"
    }
  ];

  const quickActions = [
    {
      title: "Appointments",
      description: "View and manage appointments",
      icon: Calendar,
      color: "bg-medical-blue-50 hover:bg-medical-blue-100",
      iconColor: "bg-medical-blue-500",
      action: () => navigate('/doctor/appointments'),
    },
    {
      title: "Patients",
      description: "View and manage patients",
      icon: Users,
      color: "bg-medical-green-50 hover:bg-medical-green-100",
      iconColor: "bg-medical-green-500",
      action: () => navigate('/doctor/patients'),
    },
    {
      title: "Prescriptions",
      description: "View and manage prescriptions",
      icon: FileText,
      color: "bg-blue-50 hover:bg-blue-100",
      iconColor: "bg-blue-500",
      action: () => navigate('/doctor/prescriptions'),
    },
    {
      title: "Availability",
      description: "Set your availability",
      icon: Clock,
      color: "bg-purple-50 hover:bg-purple-100",
      iconColor: "bg-purple-500",
      action: () => navigate('/doctor/availability'),
    },
  ];

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getPatientData = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    return patient || { firstName: 'Unknown', lastName: 'Patient' };
  };

  // Filter today's appointments
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const todaysAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(apt.datetime);
      return aptDate >= todayStart && aptDate < todayEnd;
    })
    .sort((a, b) => a.tokenNumber - b.tokenNumber);

  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>();
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [appointmentStates, setAppointmentStates] = useState<{ [key: string]: AppointmentState }>({});

  // Initialize appointment states when appointments data changes
  useEffect(() => {
    const initialStates = todaysAppointments.reduce((acc, appointment) => ({
      ...acc,
      [appointment.id]: {
          ...appointment,
          isModified: false,
          isPendingSave: false,
          originalStatus: appointment.status,
          isApproved: false
      }
    }), {} as { [key: string]: AppointmentState });
    
    setAppointmentStates(initialStates);
  }, [todaysAppointments]);

  // Mutation for updating appointment
  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ 
      appointmentId, 
      modifications 
    }: { 
      appointmentId: string; 
      modifications: AppointmentModification;
    }) => {
      const response = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(modifications),
      });
      if (!response.ok) throw new Error('Failed to update appointment');
      return response.json();
    },
    onSuccess: (_, { appointmentId }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Update local state
      setAppointmentStates(prev => ({
        ...prev,
        [appointmentId]: {
          ...prev[appointmentId],
          isModified: false,
          isPendingSave: false
        }
      }));

      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  // Handler for status changes
  const handleStatusChange = (appointmentId: string, newStatus: AppointmentStatus) => {
    setAppointmentStates(prev => {
      const currentState = prev[appointmentId];
      if (!currentState) return prev;

      return {
        ...prev,
        [appointmentId]: {
          ...currentState,
          status: newStatus,
          isModified: true,
          isPendingSave: true
        }
      };
    });
  };

  // Handler for approval
  const handleApprove = (appointmentId: string) => {
    setAppointmentStates(prev => {
      const currentState = prev[appointmentId];
      if (!currentState) return prev;

      return {
        ...prev,
        [appointmentId]: {
          ...currentState,
          isApproved: true,
          isModified: true,
          isPendingSave: true
        }
      };
    });
  };

  // Handler for saving changes
  const handleSave = async (appointmentId: string) => {
    const state = appointmentStates[appointmentId];
    if (!state?.isModified) return;

    const modifications: AppointmentModification = {};
    if (state.status !== state.originalStatus) {
      modifications.status = state.status;
    }
    if (state.isApproved) {
      modifications.approved = true;
    }

    await updateAppointmentMutation.mutateAsync({
      appointmentId,
      modifications
    });
  };

  // Render a loading state if user is not set yet
  if (!currentUser) {
    return (
      <ProtectedRoute requiredRole="doctor">
        {(user: AuthUser) => {
          setCurrentUser(user);
          return null;
        }}
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="doctor">
    {(currentUser: AuthUser) => (
      <Layout user={currentUser}>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="border border-gray-100">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                        <Icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className={`text-sm font-medium ${stat.trendColor}`}>
                        {stat.trend}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Today's Appointments Section */}
          <Card className="mb-8 border border-gray-100">
            <CardHeader className="border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold text-gray-900">
                      Today's Appointments
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-medical-blue-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-medical-blue-500"></div>
                      <span className="text-sm font-medium text-medical-blue-700">
                        {todaysAppointments.length} Total
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      <span className="text-sm font-medium text-yellow-700">
                        {todaysAppointments.filter(apt => apt.status === 'pending').length} Pending
                      </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-700">
                        {todaysAppointments.filter(apt => apt.status === 'completed').length} Completed
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {todaysAppointments.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Appointments Today</h3>
                    <p className="text-gray-500">You have no scheduled appointments for today.</p>
                  </div>
                ) : (
                  todaysAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className={`bg-white rounded-xl border transition-all duration-200 ${
                        appointmentStates[appointment.id]?.isApproved 
                          ? 'border-green-200 shadow-sm shadow-green-50' 
                          : 'border-gray-100 hover:border-medical-blue-200'
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="flex flex-col items-center space-y-1">
                              <div className="w-14 h-14 bg-medical-blue-50 rounded-xl flex items-center justify-center">
                                <span className="text-xl font-bold text-medical-blue-600">
                                  #{appointment.tokenNumber}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-gray-500">Token</span>
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="text-lg font-semibold text-gray-900">
                                  {appointment.patientId.firstName} {appointment.patientId.lastName}
                                </h3>
                                <Badge 
                                  className={
                                    appointment.status === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                                    appointment.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                    appointment.status === 'follow-up-required' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                    'bg-gray-50 text-gray-700 border-gray-200'
                                  }
                                >
                                  {appointment.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </Badge>
                                {appointmentStates[appointment.id]?.isApproved && (
                                  <Badge className="bg-green-50 text-green-700 border-green-200">
                                    <Check className="w-3 h-3 mr-1" />
                                    Approved
                                  </Badge>
                                )}
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                  {new Date(appointment.datetime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                  <span className="mx-2">•</span>
                                  <Badge variant="outline" className="font-normal border-medical-blue-200 text-medical-blue-700">
                                    {appointment.type}
                                  </Badge>
                                </div>
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400" />
                                  {appointment.patientId.phone}
                                  {appointment.patientId.age && (
                                    <>
                                      <span className="mx-2">•</span>
                                      <span className="px-2 py-0.5 rounded bg-gray-50 text-gray-600 text-xs font-medium">
                                        {appointment.patientId.age} yrs, {appointment.patientId.gender}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {appointment.symptoms && (
                                  <div className="flex items-start text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mt-3">
                                    <ClipboardList className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" />
                                    <p className="line-clamp-2">{appointment.symptoms}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end space-y-3">
                            <Select
                              value={appointmentStates[appointment.id]?.status || appointment.status}
                              onValueChange={(value: AppointmentStatus) => handleStatusChange(appointment.id, value)}
                            >
                              <SelectTrigger className="w-[180px] bg-white">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                                    Pending
                                  </div>
                                </SelectItem>
                                <SelectItem value="completed">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                                    Completed
                                  </div>
                                </SelectItem>
                                <SelectItem value="follow-up-required">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2"></div>
                                    Follow-up Required
                                  </div>
                                </SelectItem>
                                <SelectItem value="cancelled">
                                  <div className="flex items-center">
                                    <div className="w-2 h-2 rounded-full bg-gray-500 mr-2"></div>
                                    Cancelled
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="flex flex-col space-y-2 w-[180px]">
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    setSelectedAppointment(appointment);
                                    setShowFollowUpModal(true);
                                  }}
                                >
                                  <CalendarPlus className="w-4 h-4 mr-1.5" />
                                  Follow-up
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => {
                                    const patient = patients.find(p => p.id === appointment.patientId._id);
                                    if (patient) {
                                      setShowPrescriptionModal(true);
                                    }
                                  }}
                                >
                                  <FileText className="w-4 h-4 mr-1.5" />
                                  Prescribe
                                </Button>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  size="sm"
                                  variant={appointmentStates[appointment.id]?.isApproved ? "secondary" : "outline"}
                                  className="w-full"
                                  onClick={() => handleApprove(appointment.id)}
                                  disabled={appointmentStates[appointment.id]?.isApproved}
                                >
                                  <Check className="w-4 h-4 mr-1.5" />
                                  {appointmentStates[appointment.id]?.isApproved ? 'Approved' : 'Approve'}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="w-full"
                                  onClick={() => handleSave(appointment.id)}
                                  disabled={!appointmentStates[appointment.id]?.isModified}
                                >
                                  <Save className="w-4 h-4 mr-1.5" />
                                  Save
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Modal */}
          <Dialog open={showFollowUpModal} onOpenChange={setShowFollowUpModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Follow-up</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Date</label>
                  <CalendarComponent
                    mode="single"
                    selected={followUpDate}
                    onSelect={setFollowUpDate}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Notes</label>
                  <Textarea
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    placeholder="Add notes for the follow-up appointment..."
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowFollowUpModal(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => {
                    handleApprove(selectedAppointment?.id || '');
                    setShowFollowUpModal(false);
                  }} disabled={!selectedAppointment || !followUpDate}>
                    Schedule Follow-up
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Actions */}
          <Card className="mb-8 border border-gray-100">
            <CardHeader className="border-b border-gray-100">
                <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`flex flex-col items-center justify-center p-6 ${action.color} transition-colors h-auto text-center`}
                      onClick={action.action}
                    >
                      <div className={`w-12 h-12 ${action.iconColor} rounded-full flex items-center justify-center mb-3`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <p className="text-sm font-medium text-gray-900">{action.title}</p>
                      <p className="text-xs text-gray-500 mt-1">{action.description}</p>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Recent Prescriptions */}
          <Card className="mt-8 border border-gray-100">
            <CardHeader className="border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Prescriptions</CardTitle>
                <Button variant="ghost" size="sm" className="text-medical-blue-500 hover:text-medical-blue-600">
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Medication
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Dosage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {prescriptions.slice(0, 5).map((prescription) => {
                      const patientData = getPatientData(prescription.patientId);
                      return (
                        <tr key={prescription.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {getPatientInitials(patientData.firstName, patientData.lastName)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {`${patientData.firstName} ${patientData.lastName}`}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {prescription.medication}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {prescription.dosage}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(prescription.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={prescription.isActive ? 'bg-medical-green-100 text-medical-green-800' : 'bg-gray-100 text-gray-800'}>
                              {prescription.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                    {prescriptions.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                          No prescriptions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Prescription Modal */}
          {showPrescriptionModal && (
            <PrescriptionModal
              isOpen={showPrescriptionModal}
              onClose={() => setShowPrescriptionModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
                queryClient.invalidateQueries({ queryKey: ['/api/prescriptions'] });
                queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
                setShowPrescriptionModal(false);
              }}
            />
          )}
           </Layout>
        )}
      </ProtectedRoute>
        );
}
