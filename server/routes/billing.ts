import express from 'express';
import { Billing } from '../models/billing';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Create a new invoice
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Set default values for required fields
    const invoiceData = {
      ...req.body,
      dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: req.body.status || 'draft',
      currency: req.body.currency || 'INR',
      taxAmount: req.body.taxAmount || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };
    
    const invoice = new Billing(invoiceData);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to create invoice', error: error.message });
  }
});

// Fetch invoices (with optional hospitalId, status, pagination)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hospitalId, status, page = 1, limit = 10 } = req.query;
    const query: any = {};
    if (hospitalId) query['hospitalId'] = hospitalId;
    if (status && status !== 'all') query['status'] = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [invoices, total] = await Promise.all([
      Billing.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Billing.countDocuments(query)
    ]);
    res.json({
      invoices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Failed to fetch invoices', error: error.message });
  }
});

export default router; 