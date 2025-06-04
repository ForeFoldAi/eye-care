import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Download, Printer } from "lucide-react";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: any;
  patient: any;
}

export default function ReceiptModal({ isOpen, onClose, payment, patient }: ReceiptModalProps) {
  if (!payment || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple receipt text
    const receiptText = `
HEALTHCARE MANAGEMENT SYSTEM
Payment Receipt

Receipt Number: ${payment.receiptNumber}
Date: ${new Date(payment.createdAt).toLocaleDateString()}
Time: ${new Date(payment.createdAt).toLocaleTimeString()}

Patient Information:
Name: ${patient.firstName} ${patient.lastName}
Patient ID: P-${patient.id}
Phone: ${patient.phone}

Payment Details:
Amount: $${payment.amount}
Method: ${payment.method.toUpperCase()}
Status: ${payment.status.toUpperCase()}

Thank you for your payment!
    `;

    const blob = new Blob([receiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.receiptNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl font-semibold text-gray-900">
            Payment Receipt
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-6 space-y-4">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-4">
              <h3 className="text-lg font-bold text-gray-900">HealthCare Management</h3>
              <p className="text-sm text-gray-600">Payment Receipt</p>
            </div>

            {/* Receipt Details */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Receipt #:</span>
                <span className="text-sm font-mono font-semibold">{payment.receiptNumber}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Date:</span>
                <span className="text-sm">{new Date(payment.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Time:</span>
                <span className="text-sm">{new Date(payment.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>

            <Separator />

            {/* Patient Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Patient Information</h4>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm">{patient.firstName} {patient.lastName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Patient ID:</span>
                <span className="text-sm font-mono">P-{patient.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="text-sm">{patient.phone}</span>
              </div>
            </div>

            <Separator />

            {/* Payment Information */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-900">Payment Details</h4>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Amount:</span>
                <span className="text-lg font-bold text-medical-green-600">${payment.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Method:</span>
                <span className="text-sm capitalize">{payment.method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className="text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-medical-green-100 text-medical-green-800">
                    {payment.status.toUpperCase()}
                  </span>
                </span>
              </div>
            </div>

            <Separator />

            <div className="text-center pt-2">
              <p className="text-xs text-gray-500">Thank you for your payment!</p>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={handlePrint}
            className="flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
          <Button
            onClick={handleDownload}
            className="flex items-center space-x-2 bg-medical-blue-500 hover:bg-medical-blue-600"
          >
            <Download className="w-4 h-4" />
            <span>Download</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}