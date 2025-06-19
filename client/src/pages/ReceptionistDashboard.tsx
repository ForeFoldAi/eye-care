// File: ReceptionistDashboard.tsx
// This file is part of a medical receptionist dashboard application
// that allows receptionists to manage patient registrations, appointments, and payments.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import PatientRegistrationModal from "@/components/PatientRegistrationModal";
import AppointmentBookingModal from "@/components/AppointmentBookingModal";
import ReceiptModal from "@/components/ReceiptModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  UserPlus, 
  IndianRupee, 
  XCircle,
  Search,
  CalendarPlus,
  Eye,
  Plus,
  X,
  Clock,
  Stethoscope,
  Activity,
  CalendarCheck,
  Loader2,
  Download,
} from "lucide-react";
import { useMutation, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { type User as AuthUser } from "@/lib/auth";

interface DashboardStats {
  todayAppointments: number;
  newPatients: number;
  paymentsToday: number;
  cancellations: number;
}

interface Patient {
  id: string;
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
}

interface Payment {
  id: number;
  patientId: string;
  amount: number;
  method: string;
  status: string;
  receiptNumber: string;
}

interface Appointment {
  id: string;
  patientId: {
    _id: string;
    firstName: string;
    lastName: string;
    phone: string;
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
}

export default function ReceptionistDashboard() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastPayment, setLastPayment] = useState<Payment | null>(null);
  const [paymentData, setPaymentData] = useState({
    patientId: "",
    amount: "",
    method: "",
  });
  const { toast } = useToast();

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: patients, isLoading: isLoadingPatients, error } = useQuery<Patient[], Error>({
    queryKey: ['/api/patients'],
    queryFn: async () => {
      const response = await fetch('/api/patients', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        console.error('Failed to fetch patients:', response.status);
        throw new Error('Failed to fetch patients');
      }
      const data = await response.json();
      console.log('Patients data:', data); // Debug log
      
      // Handle both array and object response formats
      const patientsArray = data.data?.patients || data.patients || data;
      return Array.isArray(patientsArray) ? patientsArray.map((p: any) => ({
        ...p,
        id: p._id?.toString() || p.id || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        email: p.email || '',
      })) : [];
    },
  });

  const { data: searchResults, isLoading: isLoadingSearch, error: searchError } = useQuery<Patient[], Error>({
    queryKey: ['/api/patients/search', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/patients/search?q=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        console.error('Failed to search patients:', response.status);
        throw new Error('Failed to search patients');
      }
      const data = await response.json();
      console.log('Search results:', data); // Debug log
      
      // Handle both array and object response formats
      const searchArray = data.data || data;
      return Array.isArray(searchArray) ? searchArray.map((p: any) => ({
        ...p,
        id: p._id?.toString() || p.id || '',
        firstName: p.firstName || '',
        lastName: p.lastName || '',
        phone: p.phone || '',
        email: p.email || '',
      })) : [];
    },
    enabled: searchQuery.length > 2,
    retry: 1,
    staleTime: 30000, // Consider results fresh for 30 seconds
  });

  const { data: doctors = [] } = useQuery<Doctor[]>({
    queryKey: ['/api/doctors'],
    queryFn: async () => {
      const response = await fetch('/api/doctors');
      if (!response.ok) throw new Error('Failed to fetch doctors');
      const data = await response.json();
      return data.map((doctor: any) => ({
        id: doctor._id?.toString() || doctor.id || '',
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization
      }));
    },
  });

  const { data: appointments = [], isLoading: isLoadingAppointments } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments'],
    queryFn: async () => {
      const response = await fetch('/api/appointments', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        // Handle 401 specifically if needed
        if (response.status === 401) {
          localStorage.removeItem('token');
          // navigate('/login'); // Assuming navigate is available
        }
        throw new Error('Failed to fetch appointments');
      }
      return response.json();
    },
  });

  // Helper function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Helper function to format time
  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const paymentMutation = useMutation<
    Payment,
    Error,
    {
      patientId: string;
      amount: string;
      method: string;
      status: string;
    }
  >({
    mutationFn: async (data) => {
      console.log('Making API request with data:', data);
      const token = localStorage.getItem('token');
      console.log('Using token:', token ? 'Token exists' : 'No token found');

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          patientId: data.patientId,
        }),
      });

      console.log('API Response status:', response.status);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Payment failed:', errorData);
        throw new Error(errorData.message || 'Failed to process payment');
      }

      const result = await response.json();
      console.log('Payment successful:', result);
      return result;
    },
    onSuccess: async (payment) => {
      console.log('Payment processed successfully:', payment);
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      
      // Download PDF receipt
      try {
        console.log('Attempting to generate receipt for payment:', payment.id);
        const response = await fetch(`/api/payments/${payment.id}/receipt`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        console.log('Receipt generation status:', response.status);
        if (!response.ok) {
          console.error('Receipt generation failed:', await response.text().catch(() => 'No error details'));
          throw new Error('Failed to generate receipt');
        }
        
        const blob = await response.blob();
        console.log('Receipt blob size:', blob.size);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt-${payment.receiptNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error in receipt generation:', error);
        toast({
          title: "Receipt Download Failed",
          description: "Payment was processed but receipt download failed. Please try downloading again.",
          variant: "destructive",
        });
      }

      setLastPayment(payment);
      setPaymentData({ patientId: "", amount: "", method: "" });
      setShowReceiptModal(true);
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully processed and receipt generated.",
      });
    },
    onError: (error) => {
      console.error('Payment mutation error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    }
  });

  const statsCards = [
    {
      title: "Today's Appointments",
      value: stats?.todayAppointments || 0,
      icon: Calendar,
      color: "text-medical-blue-600",
      bgColor: "bg-medical-blue-100",
      trend: "3 pending confirmations",
      trendColor: "text-medical-green-500"
    },
    {
      title: "New Patients",
      value: stats?.newPatients || 0,
      icon: UserPlus,
      color: "text-medical-green-600",
      bgColor: "bg-medical-green-100",
      trend: "5 this week",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Payments Today",
      value: stats?.paymentsToday || 0,
      icon: IndianRupee,
      color: "text-medical-orange-600",
      bgColor: "bg-medical-orange-100",
      trend: "",
      trendColor: ""
    },
    {
      title: "Cancellations",
      value: stats?.cancellations || 0,
      icon: XCircle,
      color: "text-medical-red-600",
      bgColor: "bg-medical-red-100",
      trend: "",
      trendColor: ""
    },
  ];

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleProcessPayment = () => {
    if (!selectedPatient) {
      toast({
        title: "Patient Required",
        description: "Please select a patient to process payment.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid payment amount.",
        variant: "destructive",
      });
      return;
    }

    if (!paymentData.method) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method.",
        variant: "destructive",
      });
      return;
    }

    // Get the latest appointment for this patient if it exists
    const latestAppointment = appointments
      .filter(app => app.patientId._id === selectedPatient.id)
      .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0];

    const paymentRequest = {
      patientId: selectedPatient.id,
      appointmentId: latestAppointment?.id,
      amount: paymentData.amount,
      method: paymentData.method,
      status: 'completed',
    };

    paymentMutation.mutate(paymentRequest);
  };

  const handleGenerateReceipt = async () => {
    if (!selectedPatient || !paymentData.amount || !paymentData.method) {
      toast({
        title: "Missing Information",
        description: "Please fill in all payment details before generating receipt.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First process the payment
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          appointmentId: appointments
            .filter(app => app.patientId._id === selectedPatient.id)
            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]?.id,
          amount: parseFloat(paymentData.amount),
          method: paymentData.method,
          status: 'completed',
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to process payment');
      }

      const payment = await paymentResponse.json();

      // Then generate and download receipt
      const receiptResponse = await fetch(`/api/payments/${payment.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!receiptResponse.ok) {
        throw new Error('Failed to generate receipt');
      }

      const blob = await receiptResponse.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Update UI state
      setLastPayment(payment);
      setPaymentData({ patientId: "", amount: "", method: "" });
      setShowReceiptModal(true);

      // Show success message
      toast({
        title: "Success",
        description: "Payment processed and receipt generated successfully.",
      });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment and generate receipt",
        variant: "destructive",
      });
    }
  };

  const displayedPatients = searchQuery.length > 2 
    ? (isLoadingSearch ? [] : searchResults) 
    : (isLoadingPatients ? [] : patients);

  const isLoading = searchQuery.length > 2 ? isLoadingSearch : isLoadingPatients;
  const currentError = searchQuery.length > 2 ? searchError : error;

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setPaymentData(prev => ({ ...prev, patientId: patient.id }));
  };

  return (
    <ProtectedRoute requiredRole="receptionist">
      {(currentUser: AuthUser) => (
        <Layout user={currentUser}>
          <div className="space-y-8 p-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {statsCards.map((card, index) => (
                <Card key={index} className="overflow-hidden border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-1">{card.title}</p>
                        <h3 className="text-3xl font-bold text-gray-900">{card.value}</h3>
                        {card.trend && (
                          <p className={`mt-2 text-sm font-medium ${card.trendColor}`}>
                            {card.trend}
                          </p>
                        )}
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bgColor}`}>
                        <card.icon className={`w-6 h-6 ${card.color}`} />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="col-span-2 border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <CardTitle className="text-xl font-semibold text-gray-900">Patient Management</CardTitle>
                  <Button 
                    onClick={() => setShowPatientModal(true)} 
                    size="sm"
                    className="bg-medical-blue-600 hover:bg-medical-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Register Patient
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search patients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full rounded-lg border-gray-200 focus:border-medical-blue-500 focus:ring-medical-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {isLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-medical-blue-500 mr-2" />
                        <p className="text-gray-500">Loading patients...</p>
                      </div>
                    ) : currentError ? (
                      <div className="text-center py-8">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
                        <p className="text-gray-500">{currentError instanceof Error ? currentError.message : 'Failed to load patients'}</p>
                      </div>
                    ) : !displayedPatients?.length ? (
                      <div className="text-center py-8">
                        <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No patients found</p>
                      </div>
                    ) : (
                      displayedPatients.map((patient) => (
                        <div 
                          key={patient.id} 
                          className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:border-medical-blue-200 hover:bg-medical-blue-50 transition-all duration-200"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-medical-blue-100 rounded-xl flex items-center justify-center">
                              <span className="text-lg font-semibold text-medical-blue-600">
                                {getPatientInitials(patient.firstName, patient.lastName)}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-base font-medium text-gray-900">
                                {patient.firstName} {patient.lastName}
                              </h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-sm text-gray-500">{patient.phone}</p>
                                <span className="text-gray-300">•</span>
                                <p className="text-sm text-gray-500">ID: P-{patient.id}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => handlePatientSelect(patient)}
                              className="hover:bg-medical-blue-100 hover:text-medical-blue-600"
                            >
                              <IndianRupee className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPatient(patient);
                                setShowAppointmentModal(true);
                              }}
                              className="border-medical-green-200 text-medical-green-600 hover:bg-medical-green-50"
                            >
                              <CalendarPlus className="w-4 h-4 mr-2" />
                              Book
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <CardTitle className="text-xl font-semibold text-gray-900">Process Payment</CardTitle>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleProcessPayment} 
                      size="sm"
                      disabled={paymentMutation.isPending || !selectedPatient || !paymentData.amount || !paymentData.method}
                      className="bg-medical-green-600 hover:bg-medical-green-700 text-white"
                    >
                      {paymentMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <IndianRupee className="w-4 h-4 mr-2" />
                          Process Payment
                        </>
                      )}
                    </Button>
                    
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="patient" className="text-sm font-medium text-gray-700">Patient</Label>
                    <Select 
                      onValueChange={(value) => {
                        const patient = displayedPatients?.find(p => p.id === value);
                        if (patient) {
                          setSelectedPatient(patient);
                          setPaymentData(prev => ({ ...prev, patientId: value }));
                        }
                      }}
                      value={paymentData.patientId}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {displayedPatients?.map((patient) => (
                          <SelectItem 
                            key={patient.id} 
                            value={patient.id || 'unknown'} 
                          >
                            {patient.firstName} {patient.lastName} ({patient.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium text-gray-700">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <Input 
                        id="amount"
                        type="number" 
                        placeholder="Enter amount"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="method" className="text-sm font-medium text-gray-700">Payment Method</Label>
                    <Select 
                      onValueChange={(value) => setPaymentData({ ...paymentData, method: value })} 
                      value={paymentData.method}
                    >
                      <SelectTrigger id="method" className="w-full">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedPatient && (
                    <div className="pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Latest Appointment</h4>
                      {appointments
                        .filter(app => app.patientId._id === selectedPatient.id)
                        .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0] ? (
                        <div className="text-sm text-gray-600">
                          <p>Dr. {appointments
                            .filter(app => app.patientId._id === selectedPatient.id)
                            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]
                            .doctorId.firstName} {appointments
                            .filter(app => app.patientId._id === selectedPatient.id)
                            .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]
                            .doctorId.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(appointments
                              .filter(app => app.patientId._id === selectedPatient.id)
                              .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]
                              .datetime)} at {formatTime(appointments
                              .filter(app => app.patientId._id === selectedPatient.id)
                              .sort((a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime())[0]
                              .datetime)}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No recent appointments</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="col-span-2 border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <CardTitle className="text-xl font-semibold text-gray-900">Upcoming Appointments</CardTitle>
                  <Button 
                    onClick={() => setShowAppointmentModal(true)} 
                    size="sm"
                    className="bg-medical-blue-600 hover:bg-medical-blue-700 text-white"
                  >
                    <CalendarPlus className="w-4 h-4 mr-2" /> Book Appointment
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {isLoadingAppointments ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500 mr-2" />
                      <p className="text-gray-500">Loading appointments...</p>
                    </div>
                  ) : appointments.length === 0 ? (
                    <div className="text-center py-8">
                      <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">No upcoming appointments</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {appointments
                        .filter(app => ['scheduled', 'confirmed', 'in-progress'].includes(app.status))
                        .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
                        .map((appointment) => (
                          <div key={appointment.id} className="p-4 border rounded-lg shadow-sm flex items-center justify-between">
                            <div className="flex-1 space-y-1">
                              <p className="font-semibold text-gray-900">
                                {appointment.patientId.firstName} {appointment.patientId.lastName}
                              </p>
                              <p className="text-sm text-gray-600">
                                Dr. {appointment.doctorId.firstName} {appointment.doctorId.lastName} ({appointment.doctorId.specialization})
                              </p>
                              <div className="flex items-center text-sm text-gray-500 space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(appointment.datetime)}</span>
                                <Clock className="h-4 w-4" />
                                <span>{formatTime(appointment.datetime)}</span>
                                <Badge variant="outline">#{appointment.tokenNumber}</Badge>
                                <Badge variant="secondary">{appointment.type}</Badge>
                              </div>
                            </div>
                            <Badge
                              className={
                                appointment.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }
                            >
                              {appointment.status}
                            </Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                  <CardTitle className="text-xl font-semibold text-gray-900">Recent Payments</CardTitle>
                  <Button 
                    onClick={() => setShowReceiptModal(true)} 
                    size="sm" 
                    variant="outline" 
                    disabled={!lastPayment}
                    className="border-medical-blue-200 text-medical-blue-600 hover:bg-medical-blue-50"
                  >
                    <Eye className="w-4 h-4 mr-2" /> View Last Receipt
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {lastPayment ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Receipt Number</p>
                        <p className="text-sm font-medium text-gray-900">{lastPayment.receiptNumber}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Amount</p>
                        <p className="text-sm font-medium text-gray-900">₹{lastPayment.amount}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Method</p>
                        <p className="text-sm font-medium text-gray-900 capitalize">{lastPayment.method}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">Status</p>
                        <Badge 
                          variant="outline" 
                          className={`text-xs capitalize ${
                            lastPayment.status === 'completed' 
                              ? 'border-medical-green-200 text-medical-green-600 bg-medical-green-50' 
                              : 'border-medical-orange-200 text-medical-orange-600 bg-medical-orange-50'
                          }`}
                        >
                          {lastPayment.status}
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <IndianRupee className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No recent payments</p>
                      <p className="text-sm mt-2">Process a payment to see it here</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <PatientRegistrationModal
              isOpen={showPatientModal}
              onClose={() => setShowPatientModal(false)}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
                toast({
                  title: "Patient Registered",
                  description: "New patient has been successfully registered.",
                });
              }}
            />

            <AppointmentBookingModal
              isOpen={showAppointmentModal}
              onClose={() => setShowAppointmentModal(false)}
              selectedPatient={selectedPatient}
              onSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
                queryClient.invalidateQueries({ queryKey: ['/api/doctor/availability'] });
                queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
                toast({
                  title: "Appointment Booked",
                  description: "New appointment has been successfully booked.",
                });
              }}
            />

            <ReceiptModal
              isOpen={showReceiptModal}
              onClose={() => setShowReceiptModal(false)}
              payment={lastPayment}
              patient={lastPayment && patients ? patients.find(p => p.id === lastPayment.patientId) : undefined}
            />
          </div>
        </Layout>
      )}
    </ProtectedRoute>
  );
}
