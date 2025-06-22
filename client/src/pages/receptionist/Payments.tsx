import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import ReceiptModal from "@/components/ReceiptModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  IndianRupee,
  Download,
  User,
  Calendar,
  CreditCard,
  Clock,
  Plus,
  Eye
} from "lucide-react";
import { type User as AuthUser } from "@/lib/auth";
import { useLocation, useNavigate } from "react-router-dom";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface Appointment {
  id: string;
  datetime: string;
  type: string;
  status: string;
  patient: Patient;
  doctor: {
    firstName: string;
    lastName: string;
    specialization: string;
  };
}

interface Payment {
  id: string;
  appointmentId?: string;
  patientId: string;
  amount: number;
  method: string;
  status: string;
  receiptNumber: string;
  createdAt: string;
  patient: Patient;
  appointment?: Appointment;
}
const API_URL = import.meta.env.VITE_API_URL;
async function fetchPayments(patientId?: string, appointmentId?: string): Promise<Payment[]> {
  let url = `${API_URL}/api/payments`;
  const params = new URLSearchParams();
  if (patientId) params.append('patientId', patientId);
  if (appointmentId) params.append('appointmentId', appointmentId);
  params.append('include', 'patient,appointment,appointment.doctor');
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payments');
  }

  const data = await response.json();
  
  // Process payments sequentially to maintain data consistency
  const processedPayments = [];
  for (const payment of data) {
    // First try to get the linked patient data
    let patientData = payment.patient;
    
    // If no linked patient data but we have patientId, fetch it
    if (!patientData && payment.patientId) {
      try {
        const patientResponse = await fetch(`${API_URL}/api/patients/${payment.patientId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (patientResponse.ok) {
          patientData = await patientResponse.json();
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }

    // Get appointment data if needed
    let appointmentData = payment.appointment;
    if (!appointmentData && payment.appointmentId) {
      try {
        const appointmentResponse = await fetch(`${API_URL}/api/appointments/${payment.appointmentId}?include=doctor`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (appointmentResponse.ok) {
          appointmentData = await appointmentResponse.json();
        }
      } catch (error) {
        console.error('Error fetching appointment data:', error);
      }
    }

    processedPayments.push({
      id: payment._id?.toString() || payment.id || '',
      appointmentId: payment.appointmentId?.toString() || undefined,
      patientId: payment.patientId?.toString() || '',
      amount: payment.amount || 0,
      method: payment.method || 'cash',
      status: payment.status || 'completed',
      receiptNumber: payment.receiptNumber || `RCP${payment.id}`,
      createdAt: payment.createdAt || new Date().toISOString(),
      patient: patientData ? {
        id: patientData._id?.toString() || patientData.id || '',
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phone: patientData.phone
      } : {
        id: '',
        firstName: 'Unknown',
        lastName: 'Patient',
        phone: 'N/A'
      },
      appointment: appointmentData ? {
        id: appointmentData._id?.toString() || appointmentData.id || '',
        datetime: appointmentData.datetime,
        type: appointmentData.type || 'Regular',
        status: appointmentData.status || 'completed',
        patient: patientData ? {
          id: patientData._id?.toString() || patientData.id || '',
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          phone: patientData.phone
        } : {
          id: '',
          firstName: 'Unknown',
          lastName: 'Patient',
          phone: 'N/A'
        },
        doctor: appointmentData.doctor ? {
          firstName: appointmentData.doctor.firstName,
          lastName: appointmentData.doctor.lastName,
          specialization: appointmentData.doctor.specialization
        } : {
          firstName: 'Unknown',
          lastName: 'Doctor',
          specialization: 'General'
        }
      } : undefined
    });
  }

  return processedPayments;
}

async function searchPayments(query: string, patientId?: string, appointmentId?: string): Promise<Payment[]> {
  let url = `/api/payments/search?q=${encodeURIComponent(query)}`;
  if (patientId) url += `&patientId=${patientId}`;
  if (appointmentId) url += `&appointmentId=${appointmentId}`;
  url += '&include=patient,appointment,appointment.doctor';

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to search payments');
  }

  const data = await response.json();
  
  // Process payments sequentially to maintain data consistency
  const processedPayments = [];
  for (const payment of data) {
    // First try to get the linked patient data
    let patientData = payment.patient;
    
    // If no linked patient data but we have patientId, fetch it
    if (!patientData && payment.patientId) {
      try {
        const patientResponse = await fetch(`${API_URL}/api/patients/${payment.patientId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (patientResponse.ok) {
          patientData = await patientResponse.json();
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }

    // Get appointment data if needed
    let appointmentData = payment.appointment;
    if (!appointmentData && payment.appointmentId) {
      try {
        const appointmentResponse = await fetch(`${API_URL}/api/appointments/${payment.appointmentId}?include=doctor`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        if (appointmentResponse.ok) {
          appointmentData = await appointmentResponse.json();
        }
      } catch (error) {
        console.error('Error fetching appointment data:', error);
      }
    }

    processedPayments.push({
      id: payment._id?.toString() || payment.id || '',
      appointmentId: payment.appointmentId?.toString() || undefined,
      patientId: payment.patientId?.toString() || '',
      amount: payment.amount || 0,
      method: payment.method || 'cash',
      status: payment.status || 'completed',
      receiptNumber: payment.receiptNumber || `RCP${payment.id}`,
      createdAt: payment.createdAt || new Date().toISOString(),
      patient: patientData ? {
        id: patientData._id?.toString() || patientData.id || '',
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        phone: patientData.phone
      } : {
        id: '',
        firstName: 'Unknown',
        lastName: 'Patient',
        phone: 'N/A'
      },
      appointment: appointmentData ? {
        id: appointmentData._id?.toString() || appointmentData.id || '',
        datetime: appointmentData.datetime,
        type: appointmentData.type || 'Regular',
        status: appointmentData.status || 'completed',
        patient: patientData ? {
          id: patientData._id?.toString() || patientData.id || '',
          firstName: patientData.firstName,
          lastName: patientData.lastName,
          phone: patientData.phone
        } : {
          id: '',
          firstName: 'Unknown',
          lastName: 'Patient',
          phone: 'N/A'
        },
        doctor: appointmentData.doctor ? {
          firstName: appointmentData.doctor.firstName,
          lastName: appointmentData.doctor.lastName,
          specialization: appointmentData.doctor.specialization
        } : {
          firstName: 'Unknown',
          lastName: 'Doctor',
          specialization: 'General'
        }
      } : undefined
    });
  }

  return processedPayments;
}

export default function PaymentsPage() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(location.search);
  const patientIdParam = urlParams.get('patientId');
  const appointmentIdParam = urlParams.get('appointmentId');

  const { data: payments = [], isLoading, isError, error } = useQuery<Payment[]>({
    queryKey: ['/api/payments', patientIdParam, appointmentIdParam, selectedDate],
    queryFn: () => fetchPayments(patientIdParam || undefined, appointmentIdParam || undefined),
  });

  const { data: searchResults = [] } = useQuery<Payment[]>({
    queryKey: ['/api/payments/search', searchQuery, patientIdParam, appointmentIdParam],
    queryFn: () => searchPayments(searchQuery, patientIdParam || undefined, appointmentIdParam || undefined),
    enabled: searchQuery.length > 2,
  });

  const displayedPayments = searchQuery.length > 2 ? searchResults : payments;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'insurance': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${API_URL}/api/payments/${payment.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to download receipt');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Receipt Downloaded",
        description: "Receipt has been successfully downloaded.",
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download receipt.",
        variant: "destructive",
      });
    }
  };

  const renderPaymentCard = (payment: Payment) => {
    return (
      <Card key={payment.id} className="relative overflow-hidden">
        <CardContent className="p-6">
          <Badge variant="secondary" className={`absolute top-0 right-0 m-3 capitalize ${getMethodColor(payment.method)}`}>
                  {payment.method}
                </Badge>
          <div className="space-y-3">
            <h3 className="text-xl font-bold text-medical-blue-600">{formatAmount(payment.amount)}</h3>
            <p className="text-sm text-gray-600">Receipt #: {payment.receiptNumber}</p>
            <p className="text-sm text-gray-600 flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-500" />
              Patient: {payment.patient.firstName} {payment.patient.lastName} (ID: P-{payment.patient.id})
            </p>
                {payment.appointment && (
              <p className="text-sm text-gray-600 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                Appointment: {formatDate(payment.appointment.datetime)} at {formatTime(payment.appointment.datetime)}
                {payment.appointment.doctor && (
                  <span> (Dr. {payment.appointment.doctor.firstName} {payment.appointment.doctor.lastName})</span>
                )}
              </p>
                )}
            <p className="text-sm text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-500" />
              Processed: {formatDate(payment.createdAt)} {formatTime(payment.createdAt)}
                </p>
            <Badge variant="outline" className={`capitalize ${payment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {payment.status}
            </Badge>
          </div>
          <div className="mt-4 flex space-x-2">
            <Button size="sm" variant="outline" onClick={() => { setSelectedPayment(payment); setShowReceiptModal(true); }}>
              <Eye className="w-4 h-4 mr-2" /> View Receipt
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(payment)}>
              <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <ProtectedRoute requiredRole="receptionist">
      {(currentUser: AuthUser) => (
        <Layout user={currentUser}>
          <div className="p-6 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">Payments</CardTitle>
                <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search payments..."
                    className="max-w-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value || undefined)}
                    className="w-[180px]"
                  />
              </div>
            </CardHeader>
              <CardContent>
              {isLoading ? (
                  <div className="text-center py-8">Loading payments...</div>
              ) : isError ? (
                  <div className="text-center py-8 text-red-600">Error: {error?.message || 'Failed to fetch payments'}</div>
                ) : displayedPayments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedPayments.map(renderPaymentCard)}
                </div>
              ) : (
                  <div className="text-center py-8 text-gray-500">No payments found.</div>
              )}
            </CardContent>
          </Card>
          </div>

            <ReceiptModal
              isOpen={showReceiptModal}
            onClose={() => setShowReceiptModal(false)}
              payment={selectedPayment}
            patient={selectedPayment?.patient}
            />
        </Layout>
      )}
    </ProtectedRoute>
  );
} 