import PDFDocument from 'pdfkit';
import { Document } from 'mongoose';
import { Payment, User, Patient, Appointment } from '@shared/schema';

type PaymentDoc = {
  receiptNumber: string;
  createdAt: Date;
  amount: number;
  method: string;
  status: string;
};

type PatientDoc = {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  id?: string;
};

type UserDoc = {
  firstName: string;
  lastName: string;
  specialization?: string;
  id?: string;
};

type AppointmentDoc = {
  id?: string;
  patientId: string;
  doctorId: string;
  datetime: Date;
  status: string;
  type: string;
  notes?: string;
};

interface ReceiptData {
  payment: PaymentDoc;
  patient: PatientDoc;
  doctor?: UserDoc;
  appointment?: AppointmentDoc;
  receptionist: UserDoc;
}

export async function generateReceipt(data: ReceiptData): Promise<Buffer> {
  const { payment, patient, doctor, receptionist } = data;
  
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50
      });

      const chunks: Buffer[] = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));

      // Header
      doc.fontSize(20).text('Medical Receipt', { align: 'center' });
      doc.moveDown();

      // Receipt details
      doc.fontSize(12);
      doc.text(`Receipt Number: ${payment.receiptNumber}`);
      doc.text(`Date: ${payment.createdAt ? payment.createdAt.toLocaleDateString() : new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Patient details
      doc.text('Patient Information:');
      doc.text(`Name: ${patient.firstName} ${patient.lastName}`);
      doc.text(`ID: ${patient.id}`);
      doc.text(`Phone: ${patient.phone}`);
      doc.moveDown();

      // Doctor details if available
      if (doctor) {
        doc.text('Doctor Information:');
        doc.text(`Name: Dr. ${doctor.firstName} ${doctor.lastName}`);
        doc.text(`Specialization: ${doctor.specialization}`);
        doc.moveDown();
      }

      // Payment details
      doc.text('Payment Details:');
      doc.text(`Amount: ₹${payment.amount}`);
      doc.text(`Payment Method: ${payment.method}`);
      doc.text(`Status: ${payment.status}`);
      doc.moveDown();

      // Footer
      doc.text(`Processed by: ${receptionist.firstName} ${receptionist.lastName}`);
      doc.text('Thank you for choosing our services!', { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
} 