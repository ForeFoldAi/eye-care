import { Router } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { enforceTenantIsolation, buildTenantFilter, TenantRequest } from '../middleware/tenant';
import mongoose from 'mongoose';

const router = Router();

// Get compliance items (admin and master_admin only)
router.get('/items', authenticateToken, enforceTenantIsolation, authorizeRole(['admin', 'master_admin']), async (req: TenantRequest, res) => {
  try {
    const { hospitalId, category } = req.query;
    
    // Mock compliance items for now
    const mockComplianceItems = [
      {
        id: '1',
        title: 'Patient Data Encryption',
        description: 'All patient data must be encrypted at rest and in transit',
        category: 'HIPAA',
        status: 'compliant',
        lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days ago
        nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString(), // 90 days from now
        assignedTo: 'Security Team',
        priority: 'high'
      },
      {
        id: '2',
        title: 'Access Control Policies',
        description: 'Role-based access control implementation',
        category: 'Internal',
        status: 'partial',
        lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(), // 15 days ago
        nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString(), // 60 days from now
        assignedTo: 'IT Department',
        priority: 'medium'
      },
      {
        id: '3',
        title: 'Data Processing Consent',
        description: 'Patient consent for data processing and storage',
        category: 'GDPR',
        status: 'non_compliant',
        lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days ago
        nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
        assignedTo: 'Legal Team',
        priority: 'critical'
      },
      {
        id: '4',
        title: 'Financial Controls',
        description: 'Internal financial controls and audit procedures',
        category: 'SOX',
        status: 'pending',
        lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(), // 10 days ago
        nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days from now
        assignedTo: 'Finance Team',
        priority: 'high'
      },
      {
        id: '5',
        title: 'Payment Card Security',
        description: 'PCI DSS compliance for payment processing',
        category: 'PCI',
        status: 'compliant',
        lastReview: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20 days ago
        nextReview: new Date(Date.now() + 1000 * 60 * 60 * 24 * 120).toISOString(), // 120 days from now
        assignedTo: 'Payment Team',
        priority: 'high'
      }
    ];

    // Filter by category if specified
    let filteredItems = mockComplianceItems;
    if (category && category !== 'all') {
      filteredItems = mockComplianceItems.filter(item => item.category === category);
    }

    res.json(filteredItems);
  } catch (error) {
    console.error('Error fetching compliance items:', error);
    res.status(500).json({ message: 'Error fetching compliance items' });
  }
});

export default router; 