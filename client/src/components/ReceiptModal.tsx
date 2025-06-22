import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Download, Printer } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
}

export default function ReceiptModal({ isOpen, onClose, payment, patient }: ReceiptModalProps) {
  if (!payment || !patient) return null;

  const handlePrint = () => {
    window.print();
  };
  const API_URL = import.meta.env.VITE_API_URL;
  const handleDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/api/payments/${payment.id}/receipt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${payment.receiptNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Payment Receipt
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download PDF
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Card className="border-2 border-dashed border-gray-300 print:border-none">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h3 className="text-2xl font-bold text-medical-blue-600">HealthCare Management System</h3>
              <p className="text-sm text-gray-600 mt-1">Official Payment Receipt</p>
            </div>

            {/* Receipt Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Receipt Number:</p>
                <p className="text-sm font-mono font-semibold">{payment.receiptNumber}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Date & Time:</p>
                <p className="text-sm">
                  {formatDate(payment.createdAt)} at {formatTime(payment.createdAt)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Patient Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name:</p>
                  <p className="text-sm font-medium">{patient.firstName} {patient.lastName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Patient ID:</p>
                  <p className="text-sm font-mono">P-{patient.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone:</p>
                  <p className="text-sm">{patient.phone || 'N/A'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Doctor & Appointment Information (if available) */}
            {payment.appointment && (
              <>
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900">Appointment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Doctor:</p>
                      <p className="text-sm font-medium">
                        Dr. {payment.appointment.doctor.firstName} {payment.appointment.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{payment.appointment.doctor.specialization}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Appointment Type:</p>
                      <p className="text-sm capitalize">{payment.appointment.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date & Time:</p>
                      <p className="text-sm">
                        {formatDate(payment.appointment.datetime)} at {formatTime(payment.appointment.datetime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Status:</p>
                      <p className="text-sm capitalize">{payment.appointment.status}</p>
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Payment Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Payment Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount:</p>
                  <p className="text-lg font-bold text-medical-green-600">{formatAmount(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Method:</p>
                  <p className="text-sm capitalize">{payment.method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status:</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-medical-green-100 text-medical-green-800">
                    {payment.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Footer */}
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">Thank you for choosing our services!</p>
              <p className="text-xs text-gray-500 mt-1">This is a computer-generated receipt.</p>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}