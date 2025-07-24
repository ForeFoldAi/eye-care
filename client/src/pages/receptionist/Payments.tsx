import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import ReceiptModal from "@/components/ReceiptModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ChatWidget } from '@/components/chat/ChatWidget';
import { 
  Search,
  IndianRupee,
  Download,
  User,
  Calendar,
  CreditCard,
  Clock,
  Plus,
  Eye,
  Grid3X3,
  List,
  MoreHorizontal
} from "lucide-react";
import { EnhancedTable } from "@/components/ui/enhanced-table";
import { type ColumnDef } from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ViewMode = 'table' | 'grid';

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
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  let url = `${API_URL}/api/payments`;
  const params = new URLSearchParams();
  if (patientId) params.append('patientId', patientId);
  if (appointmentId) params.append('appointmentId', appointmentId);
  params.append('include', 'patient,appointment,appointment.doctor');
  if (params.toString()) url += `?${params.toString()}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch payments: ${response.status}`);
  }

  const data = await response.json();
  console.log('Raw payments data:', data);
  
  // Handle different response formats
  const paymentsArray = Array.isArray(data) ? data : (data.payments || data.data || []);
  
  // Process payments with proper data transformation
  const processedPayments = [];
  for (const payment of paymentsArray) {
    console.log('Processing payment:', payment);
    
    // Extract patient data
    let patientData = payment.patient || payment.patientId;
    
    // If patientData is just an ID string, fetch the patient details
    if (typeof patientData === 'string' || !patientData?.firstName) {
      const patientId = typeof patientData === 'string' ? patientData : payment.patientId;
      if (patientId) {
      try {
          const patientResponse = await fetch(`${API_URL}/api/patients/${patientId}`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
        });
        if (patientResponse.ok) {
            const fetchedPatient = await patientResponse.json();
            patientData = fetchedPatient.data || fetchedPatient;
            console.log('Fetched patient data:', patientData);
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }
    }

    // Extract appointment data
    let appointmentData = payment.appointment || payment.appointmentId;
    
    // If appointmentData is just an ID string, fetch the appointment details
    if (typeof appointmentData === 'string' || (appointmentData && !appointmentData.datetime)) {
      const appointmentId = typeof appointmentData === 'string' ? appointmentData : payment.appointmentId;
      if (appointmentId) {
      try {
          const appointmentResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
        });
        if (appointmentResponse.ok) {
            const fetchedAppointment = await appointmentResponse.json();
            appointmentData = fetchedAppointment.data || fetchedAppointment;
            console.log('Fetched appointment data:', appointmentData);
            
            // If appointment has doctor ID but no doctor details, fetch doctor
            if (appointmentData.doctorId && !appointmentData.doctor?.firstName) {
              try {
                const doctorResponse = await fetch(`${API_URL}/api/users/${appointmentData.doctorId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (doctorResponse.ok) {
                  const fetchedDoctor = await doctorResponse.json();
                  appointmentData.doctor = fetchedDoctor.data || fetchedDoctor;
                }
              } catch (error) {
                console.error('Error fetching doctor data:', error);
              }
            }
        }
      } catch (error) {
        console.error('Error fetching appointment data:', error);
        }
      }
    }

    processedPayments.push({
      id: payment._id?.toString() || payment.id || '',
      appointmentId: payment.appointmentId?.toString() || undefined,
      patientId: payment.patientId?.toString() || '',
      amount: payment.amount || 0,
      method: payment.method || 'cash',
      status: payment.status || 'completed',
      receiptNumber: payment.receiptNumber || `RCP${payment._id || payment.id}`,
      createdAt: payment.createdAt || new Date().toISOString(),
      patient: patientData ? {
        id: patientData._id?.toString() || patientData.id || '',
        firstName: patientData.firstName || 'Unknown',
        lastName: patientData.lastName || 'Patient',
        phone: patientData.phone || 'N/A'
      } : {
        id: '',
        firstName: 'Unknown',
        lastName: 'Patient',
        phone: 'N/A'
      },
      appointment: appointmentData && appointmentData.datetime ? {
        id: appointmentData._id?.toString() || appointmentData.id || '',
        datetime: appointmentData.datetime,
        type: appointmentData.type || 'consultation',
        status: appointmentData.status || 'completed',
        patient: patientData ? {
          id: patientData._id?.toString() || patientData.id || '',
          firstName: patientData.firstName || 'Unknown',
          lastName: patientData.lastName || 'Patient',
          phone: patientData.phone || 'N/A'
        } : {
          id: '',
          firstName: 'Unknown',
          lastName: 'Patient',
          phone: 'N/A'
        },
        doctor: appointmentData.doctor ? {
          firstName: appointmentData.doctor.firstName || 'Unknown',
          lastName: appointmentData.doctor.lastName || 'Doctor',
          specialization: appointmentData.doctor.specialization || 'General'
        } : {
          firstName: 'Unknown',
          lastName: 'Doctor',
          specialization: 'General'
        }
      } : undefined
    });
  }

  console.log('Processed payments:', processedPayments);
  return processedPayments;
}

async function searchPayments(query: string, patientId?: string, appointmentId?: string): Promise<Payment[]> {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  let url = `${API_URL}/api/payments/search?q=${encodeURIComponent(query)}`;
  if (patientId) url += `&patientId=${patientId}`;
  if (appointmentId) url += `&appointmentId=${appointmentId}`;
  url += '&include=patient,appointment,appointment.doctor';

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search payments: ${response.status}`);
  }

  const data = await response.json();
  console.log('Search results:', data);
  
  // Handle different response formats
  const paymentsArray = Array.isArray(data) ? data : (data.payments || data.data || []);
  
  // Process payments with proper data transformation
  const processedPayments = [];
  for (const payment of paymentsArray) {
    // Extract patient data
    let patientData = payment.patient || payment.patientId;
    
    // If patientData is just an ID string, fetch the patient details
    if (typeof patientData === 'string' || !patientData?.firstName) {
      const patientId = typeof patientData === 'string' ? patientData : payment.patientId;
      if (patientId) {
      try {
          const patientResponse = await fetch(`${API_URL}/api/patients/${patientId}`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
        });
        if (patientResponse.ok) {
            const fetchedPatient = await patientResponse.json();
            patientData = fetchedPatient.data || fetchedPatient;
        }
      } catch (error) {
        console.error('Error fetching patient data:', error);
      }
    }
    }

    // Extract appointment data
    let appointmentData = payment.appointment || payment.appointmentId;
    
    // If appointmentData is just an ID string, fetch the appointment details
    if (typeof appointmentData === 'string' || (appointmentData && !appointmentData.datetime)) {
      const appointmentId = typeof appointmentData === 'string' ? appointmentData : payment.appointmentId;
      if (appointmentId) {
      try {
          const appointmentResponse = await fetch(`${API_URL}/api/appointments/${appointmentId}`, {
          headers: {
              'Authorization': `Bearer ${token}`,
          },
        });
        if (appointmentResponse.ok) {
            const fetchedAppointment = await appointmentResponse.json();
            appointmentData = fetchedAppointment.data || fetchedAppointment;
            
            // If appointment has doctor ID but no doctor details, fetch doctor
            if (appointmentData.doctorId && !appointmentData.doctor?.firstName) {
              try {
                const doctorResponse = await fetch(`${API_URL}/api/users/${appointmentData.doctorId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                });
                if (doctorResponse.ok) {
                  const fetchedDoctor = await doctorResponse.json();
                  appointmentData.doctor = fetchedDoctor.data || fetchedDoctor;
                }
              } catch (error) {
                console.error('Error fetching doctor data:', error);
              }
            }
        }
      } catch (error) {
        console.error('Error fetching appointment data:', error);
        }
      }
    }

    processedPayments.push({
      id: payment._id?.toString() || payment.id || '',
      appointmentId: payment.appointmentId?.toString() || undefined,
      patientId: payment.patientId?.toString() || '',
      amount: payment.amount || 0,
      method: payment.method || 'cash',
      status: payment.status || 'completed',
      receiptNumber: payment.receiptNumber || `RCP${payment._id || payment.id}`,
      createdAt: payment.createdAt || new Date().toISOString(),
      patient: patientData ? {
        id: patientData._id?.toString() || patientData.id || '',
        firstName: patientData.firstName || 'Unknown',
        lastName: patientData.lastName || 'Patient',
        phone: patientData.phone || 'N/A'
      } : {
        id: '',
        firstName: 'Unknown',
        lastName: 'Patient',
        phone: 'N/A'
      },
      appointment: appointmentData && appointmentData.datetime ? {
        id: appointmentData._id?.toString() || appointmentData.id || '',
        datetime: appointmentData.datetime,
        type: appointmentData.type || 'consultation',
        status: appointmentData.status || 'completed',
        patient: patientData ? {
          id: patientData._id?.toString() || patientData.id || '',
          firstName: patientData.firstName || 'Unknown',
          lastName: patientData.lastName || 'Patient',
          phone: patientData.phone || 'N/A'
        } : {
          id: '',
          firstName: 'Unknown',
          lastName: 'Patient',
          phone: 'N/A'
        },
        doctor: appointmentData.doctor ? {
          firstName: appointmentData.doctor.firstName || 'Unknown',
          lastName: appointmentData.doctor.lastName || 'Doctor',
          specialization: appointmentData.doctor.specialization || 'General'
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
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();

  const urlParams = new URLSearchParams(router.state.location.search);
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

  // Table columns definition
  const paymentColumns: ColumnDef<Payment>[] = [
    {
      accessorKey: 'receiptNumber',
      header: 'Receipt #',
      cell: ({ row }) => (
        <div className="font-medium text-xs">
          {row.getValue('receiptNumber')}
        </div>
      ),
    },
    {
      accessorKey: 'patient',
      header: 'Patient',
      cell: ({ row }) => {
        const patient = row.original.patient;
        return (
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-medical-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-medical-blue-600">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </span>
            </div>
            <div>
              <div className="font-medium text-xs">{patient.firstName} {patient.lastName}</div>
              <div className="text-xs text-gray-500">P-{patient.id}        </div>
      </div>
      
      {/* Chat Widget - Fixed Bottom Right */}
      <ChatWidget />
    </div>
  );
},
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => (
        <div className="font-semibold text-medical-green-600 text-xs">
          {formatAmount(row.getValue('amount'))}
        </div>
      ),
    },
    {
      accessorKey: 'method',
      header: 'Method',
      cell: ({ row }) => (
        <Badge className={`capitalize text-xs px-1 py-0 ${getMethodColor(row.getValue('method'))}`}>
          {row.getValue('method')}
        </Badge>
      ),
    },
    {
      accessorKey: 'appointment',
      header: 'Appointment',
      cell: ({ row }) => {
        const appointment = row.original.appointment;
        return appointment ? (
          <div>
            <div className="text-xs">{new Date(appointment.datetime).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}</div>
            <div className="text-xs text-gray-500">
              Dr. {appointment.doctor.firstName} {appointment.doctor.lastName}
            </div>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Processed',
      cell: ({ row }) => (
        <div>
          <div className="text-xs">{new Date(row.getValue('createdAt')).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })}</div>
          <div className="text-xs text-gray-500">{formatTime(row.getValue('createdAt'))}</div>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge 
          variant="outline" 
          className={`capitalize text-xs px-1 py-0 ${row.getValue('status') === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
        >
          {row.getValue('status')}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <div className="flex space-x-1">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => { setSelectedPayment(payment); setShowReceiptModal(true); }}
              className="h-6 w-6 p-0"
            >
              <Eye className="w-3 h-3" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                  <MoreHorizontal className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleDownloadReceipt(payment)} className="text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Download Receipt
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    },
  ];

  const renderPaymentCard = (payment: Payment) => {
    return (
      <Card key={payment.id} className="relative overflow-hidden">
        <CardContent className="p-3">
          <Badge variant="secondary" className={`absolute top-0 right-0 m-2 capitalize text-xs px-1 py-0 ${getMethodColor(payment.method)}`}>
                  {payment.method}
                </Badge>
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-medical-blue-600">{formatAmount(payment.amount)}</h3>
            <p className="text-xs text-gray-600">Receipt #: {payment.receiptNumber}</p>
            <p className="text-xs text-gray-600 flex items-center">
              <User className="w-3 h-3 mr-1 text-gray-500" />
              {payment.patient.firstName} {payment.patient.lastName} (P-{payment.patient.id})
            </p>
                {payment.appointment && (
              <p className="text-xs text-gray-600 flex items-center">
                <Calendar className="w-3 h-3 mr-1 text-gray-500" />
                {new Date(payment.appointment.datetime).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
                {payment.appointment.doctor && (
                  <span> (Dr. {payment.appointment.doctor.firstName} {payment.appointment.doctor.lastName})</span>
                )}
              </p>
                )}
            <p className="text-xs text-gray-600 flex items-center">
              <Clock className="w-3 h-3 mr-1 text-gray-500" />
              {new Date(payment.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
                </p>
            <Badge variant="outline" className={`capitalize text-xs px-1 py-0 ${payment.status === 'completed' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {payment.status}
            </Badge>
          </div>
          <div className="mt-3 flex space-x-1">
            <Button size="sm" variant="outline" onClick={() => { setSelectedPayment(payment); setShowReceiptModal(true); }} className="flex-1 text-xs h-6">
              <Eye className="w-3 h-3 mr-1" /> View
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleDownloadReceipt(payment)} className="flex-1 text-xs h-6">
              <Download className="w-3 h-3 mr-1" /> Download
          </Button>
        </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="flex-1 space-y-3 p-4 overflow-auto">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Payments</h2>
          <p className="text-sm text-gray-600">Manage payment records and receipts</p>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">Loading payments...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-8">
              <p className="text-red-500 text-sm">
                Error: {error?.message || 'Failed to fetch payments'}
              </p>
            </div>
          ) : (
            <EnhancedTable
              data={displayedPayments}
              columns={paymentColumns}
              searchPlaceholder="Search payments..."
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
        <Card className="border border-gray-100">
                      <CardHeader className="border-b border-gray-100 p-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-900">
                  Payment Records
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="w-56">
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Search payments..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8 text-sm"
                      />
                      <Search className="absolute left-2 top-2 w-3 h-3 text-gray-400" />
                    </div>
                  </div>
                  <Input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => setSelectedDate(e.target.value || undefined)}
                    className="w-[140px] h-8 text-sm"
                  />
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
            <CardContent className="p-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">Loading payments...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-8">
                <p className="text-red-500 text-sm">
                  Error: {error?.message || 'Failed to fetch payments'}
                </p>
              </div>
            ) : displayedPayments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {displayedPayments.map(renderPaymentCard)}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">
                  {searchQuery.length > 2 
                    ? 'No payments found matching your search' 
                    : 'No payments found'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        payment={selectedPayment}
        patient={selectedPayment?.patient}
      />
    </div>
  );
} 