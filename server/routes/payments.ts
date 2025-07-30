import { Router } from 'express';
import { Payment, Patient, Appointment, User, Receipt } from '../models';
import { insertPaymentSchema } from '../shared/schema';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { AuthRequest } from '../middleware/auth';
import { generateReceipt } from '../utils/receipt';

const router = Router();

// Get all payments with populated data
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const query = {} as any;
    if (req.query.patientId) query.patientId = req.query.patientId;
    if (req.query.appointmentId) query.appointmentId = req.query.appointmentId;

    const payments = await Payment.find(query)
      .populate('patientId', 'firstName lastName phone email')
      .populate({
        path: 'appointmentId',
        populate: {
          path: 'doctorId',
          select: 'firstName lastName specialization'
        }
      })
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ message: 'Error fetching payments' });
  }
});

// Get payment by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone')
      .populate('appointmentId')
      .populate('processedBy', 'firstName lastName');
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching payment' });
  }
});

// Create new payment and generate receipt
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { patientId, appointmentId, amount, method, status } = req.body;

    // Generate receipt number
    const date = new Date();
    const receiptNumber = `RCP${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Create payment
    const payment = new Payment({
      patientId,
      appointmentId,
      amount,
      method,
      status,
      receiptNumber,
      processedBy: req.user.id
    });

    await payment.save();

    // Populate payment with related data
    await payment.populate([
      { path: 'patientId', select: 'firstName lastName phone email' },
      { 
        path: 'appointmentId',
        populate: {
          path: 'doctorId',
          select: 'firstName lastName specialization'
        }
      },
      { path: 'processedBy', select: 'firstName lastName' }
    ]);

    // Create receipt
    const receipt = new Receipt({
      receiptNumber: payment.receiptNumber,
      paymentId: payment._id,
      patientId: payment.patientId._id,
      appointmentId: payment.appointmentId?._id,
      amount: payment.amount,
      paymentMethod: payment.method,
      paymentStatus: payment.status,
      generatedBy: req.user.id,
      metadata: {
        patientName: `${payment.patientId.firstName} ${payment.patientId.lastName}`,
        patientPhone: payment.patientId.phone,
        doctorName: payment.appointmentId ? 
          `Dr. ${payment.appointmentId.doctorId.firstName} ${payment.appointmentId.doctorId.lastName}` : 
          undefined,
        doctorSpecialization: payment.appointmentId?.doctorId.specialization,
        appointmentDate: payment.appointmentId?.datetime,
        appointmentType: payment.appointmentId?.type,
        receptionistName: `${payment.processedBy.firstName} ${payment.processedBy.lastName}`
      }
    });

    await receipt.save();

    res.status(201).json(payment);
  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({ message: 'Error creating payment' });
  }
});

// Update payment
router.put('/:id', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const paymentData = insertPaymentSchema.parse(req.body);
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      paymentData,
      { new: true }
    ).populate('patientId', 'firstName lastName phone')
     .populate('appointmentId')
     .populate('processedBy', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Invalid request data' });
  }
});

// Delete payment
router.delete('/:id', authenticateToken, authorizeRole(['receptionist']), async (req: AuthRequest, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting payment' });
  }
});

// Get payment receipt
router.get('/:id/receipt', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('patientId', 'firstName lastName phone email')
      .populate({
        path: 'appointmentId',
        populate: {
          path: 'doctorId',
          select: 'firstName lastName specialization'
        }
      })
      .populate('processedBy', 'firstName lastName');

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Generate PDF receipt
    const pdfBuffer = await generateReceipt({
      payment: {
        receiptNumber: payment.receiptNumber,
        createdAt: payment.createdAt,
        amount: payment.amount,
        method: payment.method,
        status: payment.status
      },
      patient: {
        firstName: payment.patientId.firstName,
        lastName: payment.patientId.lastName,
        phone: payment.patientId.phone,
        email: payment.patientId.email,
        id: payment.patientId._id.toString()
      },
      doctor: payment.appointmentId?.doctorId ? {
        firstName: payment.appointmentId.doctorId.firstName,
        lastName: payment.appointmentId.doctorId.lastName,
        specialization: payment.appointmentId.doctorId.specialization,
        id: payment.appointmentId.doctorId._id.toString()
      } : undefined,
      appointment: payment.appointmentId ? {
        id: payment.appointmentId._id.toString(),
        patientId: payment.appointmentId.patientId.toString(),
        doctorId: payment.appointmentId.doctorId.toString(),
        datetime: payment.appointmentId.datetime,
        type: payment.appointmentId.type,
        status: payment.appointmentId.status,
        notes: payment.appointmentId.notes || ''
      } : undefined,
      receptionist: {
        firstName: payment.processedBy.firstName,
        lastName: payment.processedBy.lastName,
        id: payment.processedBy._id.toString()
      }
    });

    // Find and update receipt with PDF URL if needed
    const receipt = await Receipt.findOne({ paymentId: payment._id });
    if (receipt && !receipt.pdfUrl) {
      // In a production environment, you would upload the PDF to a storage service
      // and store the URL. For now, we'll skip this step.
      // receipt.pdfUrl = uploadedPdfUrl;
      // await receipt.save();
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="receipt-${payment.receiptNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ message: 'Error generating receipt' });
  }
});

// Search payments
router.get('/search', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { q } = req.query;
    const query = {} as any;

    if (req.query.patientId) query.patientId = req.query.patientId;
    if (req.query.appointmentId) query.appointmentId = req.query.appointmentId;

    if (q) {
      query.$or = [
        { receiptNumber: new RegExp(q as string, 'i') },
        { 'patientId.firstName': new RegExp(q as string, 'i') },
        { 'patientId.lastName': new RegExp(q as string, 'i') },
        { method: new RegExp(q as string, 'i') }
      ];
    }

    const payments = await Payment.find(query)
      .populate('patientId', 'firstName lastName phone email')
      .populate({
        path: 'appointmentId',
        populate: {
          path: 'doctorId',
          select: 'firstName lastName specialization'
        }
      })
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error searching payments:', error);
    res.status(500).json({ message: 'Error searching payments' });
  }
});

// Get payments by hospital ID (for financial management)
router.get('/hospital/:hospitalId', authenticateToken, authorizeRole(['admin', 'master-admin', 'sub-admin']), async (req: AuthRequest, res) => {
  try {
    const { hospitalId } = req.params;
    const { from, to, status, method } = req.query;
    
    let query: any = { hospitalId };
    
    // Add date filter
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }
    
    // Add status filter
    if (status && status !== 'all') {
      query.status = status;
    }
    
    // Add method filter
    if (method && method !== 'all') {
      query.method = method;
    }
    
    const payments = await Payment.find(query)
      .populate('patient', 'firstName lastName phone email')
      .populate('appointmentId')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments by hospital:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

export default router; 