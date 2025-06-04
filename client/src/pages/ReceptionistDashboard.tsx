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
  DollarSign, 
  XCircle,
  Search,
  CalendarPlus,
  Eye,
  Plus
} from "lucide-react";
import { useMutation, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReceptionistDashboard() {
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastPayment, setLastPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    patientId: "",
    amount: "",
    method: "",
  });
  const { toast } = useToast();

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const { data: patients } = useQuery({
    queryKey: ['/api/patients'],
  });

  const { data: searchResults } = useQuery({
    queryKey: ['/api/patients/search', searchQuery],
    enabled: searchQuery.length > 2,
  });

  const { data: doctors } = useQuery({
    queryKey: ['/api/doctors'],
  });

  const paymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to process payment');
      return response.json();
    },
    onSuccess: (payment) => {
      queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      setLastPayment(payment);
      setPaymentData({ patientId: "", amount: "", method: "" });
      setShowReceiptModal(true);
      toast({
        title: "Payment Processed",
        description: "Payment has been successfully processed and receipt generated.",
      });
    },
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
      trend: "This week",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Payments Today",
      value: `$${stats?.paymentsToday || 0}`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      trend: "12 transactions",
      trendColor: "text-medical-green-500"
    },
    {
      title: "Cancellations",
      value: stats?.cancellations || 0,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-100",
      trend: "Need rescheduling",
      trendColor: "text-red-500"
    }
  ];

  const handleProcessPayment = () => {
    if (!paymentData.patientId || !paymentData.amount || !paymentData.method) {
      toast({
        title: "Invalid Payment Data",
        description: "Please fill in all payment fields.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(paymentData.amount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0.",
        variant: "destructive",
      });
      return;
    }

    paymentMutation.mutate({
      patientId: parseInt(paymentData.patientId),
      amount: paymentData.amount,
      method: paymentData.method,
      status: "completed",
    });
  };

  const getPatientInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const displayedPatients = searchQuery.length > 2 ? searchResults : patients?.slice(0, 5);

  return (
    <ProtectedRoute requiredRole="receptionist">
      {(user) => (
        <Layout user={user}>
          {/* Header Actions */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dashboard Overview</h2>
              <p className="text-gray-600">Manage patients and appointments efficiently</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowPatientModal(true)}
                className="bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Patient
              </Button>
              <Button 
                onClick={() => setShowAppointmentModal(true)}
                className="bg-medical-green-500 hover:bg-medical-green-600 text-white"
              >
                <CalendarPlus className="w-4 h-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          </div>

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patient Search & Management */}
            <div className="lg:col-span-2">
              <Card className="border border-gray-100">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    Patient Search & Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search patients by name, phone, or ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {displayedPatients?.map((patient: any) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-medical-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-medical-blue-600">
                              {getPatientInitials(patient.firstName, patient.lastName)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-900">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{patient.phone}</p>
                            <p className="text-xs text-gray-500">ID: P-{patient.id}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button size="sm" variant="outline" className="text-medical-blue-700 border-medical-blue-200 hover:bg-medical-blue-50">
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-medical-green-700 border-medical-green-200 hover:bg-medical-green-50"
                            onClick={() => setShowAppointmentModal(true)}
                          >
                            <CalendarPlus className="w-3 h-3 mr-1" />
                            Book
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {!displayedPatients?.length && (
                      <p className="text-gray-500 text-center py-8">
                        {searchQuery.length > 2 ? 'No patients found matching your search' : 'No patients registered yet'}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <Button 
                      onClick={() => setShowPatientModal(true)}
                      className="w-full bg-medical-blue-500 hover:bg-medical-blue-600 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Register New Patient
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              {/* Quick Appointment Booking */}
              <Card className="border border-gray-100">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-900">Quick Booking</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Patient</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients?.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Doctor</Label>
                    <Select>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors?.map((doctor: any) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            Dr. {doctor.firstName} {doctor.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Date & Time</Label>
                    <Input type="datetime-local" className="mt-2" />
                  </div>

                  <Button 
                    className="w-full bg-medical-green-500 hover:bg-medical-green-600 text-white"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>

              {/* Payment Processing */}
              <Card className="border border-gray-100">
                <CardHeader className="border-b border-gray-100">
                  <CardTitle className="text-lg font-semibold text-gray-900">Process Payment</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Patient</Label>
                    <Select 
                      value={paymentData.patientId}
                      onValueChange={(value) => setPaymentData({...paymentData, patientId: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients?.map((patient: any) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Amount</Label>
                    <div className="relative mt-2">
                      <div className="absolute left-3 top-2 text-gray-500">$</div>
                      <Input 
                        type="number" 
                        placeholder="0.00" 
                        className="pl-8"
                        value={paymentData.amount}
                        onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700">Payment Method</Label>
                    <Select 
                      value={paymentData.method}
                      onValueChange={(value) => setPaymentData({...paymentData, method: value})}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="insurance">Insurance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    className="w-full bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleProcessPayment}
                    disabled={paymentMutation.isPending}
                  >
                    {paymentMutation.isPending ? "Processing..." : "Process & Generate Receipt"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Modals */}
          {showPatientModal && (
            <PatientRegistrationModal
              isOpen={showPatientModal}
              onClose={() => setShowPatientModal(false)}
            />
          )}

          {showAppointmentModal && (
            <AppointmentBookingModal
              isOpen={showAppointmentModal}
              onClose={() => setShowAppointmentModal(false)}
            />
          )}

          {showReceiptModal && lastPayment && (
            <ReceiptModal
              isOpen={showReceiptModal}
              onClose={() => setShowReceiptModal(false)}
              payment={lastPayment}
              patient={patients?.find((p: any) => p.id === lastPayment.patientId)}
            />
          )}
        </Layout>
      )}
    </ProtectedRoute>
  );
}
