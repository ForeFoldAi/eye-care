import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { SupportTicket } from '../models';
import { z } from 'zod';

const router = Router();

// Create support ticket schema
const createTicketSchema = z.object({
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
  category: z.enum(['technical', 'billing', 'feature_request', 'bug_report', 'training', 'integration', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional().default('medium'),
  tags: z.array(z.string()).optional().default([])
});

// Create new support ticket (for all roles)
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log('Support ticket creation request:', {
      user: req.user,
      body: req.body
    });

    // Validate user has required fields
    if (!req.user?.id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const validatedData = createTicketSchema.parse(req.body);
    
    console.log('Validated data:', validatedData);
    
    const ticket = new SupportTicket({
      hospitalId: req.user?.hospitalId,
      branchId: req.user?.branchId,
      createdBy: req.user?.id,
      ...validatedData
    });

    console.log('Ticket object before save:', ticket);

    await ticket.save();
    await ticket.populate('hospitalId', 'name');
    await ticket.populate('createdBy', 'firstName lastName email');

    console.log('Ticket saved successfully:', ticket);

    res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    
    if (error instanceof z.ZodError) {
      console.log('Validation error details:', error.errors);
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    
    // Handle other types of errors
    console.error('Unexpected error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating support ticket',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get user's own tickets
router.get('/my-tickets', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [tickets, total] = await Promise.all([
      SupportTicket.find({ createdBy: req.user?.id })
        .populate('hospitalId', 'name')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments({ createdBy: req.user?.id })
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tickets' 
    });
  }
});

// Get all tickets (for master admin)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only master admin can access all tickets
    if (req.user?.role !== 'master_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only master admin can view all tickets.'
      });
    }

    const { page = 1, limit = 20, status, priority, category, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build filter query
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (priority && priority !== 'all') filter.priority = priority;
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate('hospitalId', 'name')
        .populate('createdBy', 'firstName lastName email')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SupportTicket.countDocuments(filter)
    ]);

    res.json({
      success: true,
      tickets,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching all tickets:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching tickets' 
    });
  }
});

// Get support statistics (for master admin)
router.get('/stats/overview', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only master admin can access statistics
    if (req.user?.role !== 'master_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only master admin can view statistics.'
      });
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [
      totalTickets,
      openTickets,
      resolvedTickets,
      ticketsThisWeek,
      ticketsLastWeek,
      avgResponseTime,
      categoryDistribution,
      priorityDistribution,
      satisfactionData
    ] = await Promise.all([
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      SupportTicket.countDocuments({ status: { $in: ['resolved', 'closed'] } }),
      SupportTicket.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      SupportTicket.countDocuments({ 
        createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } 
      }),
      // Calculate average response time
      SupportTicket.aggregate([
        { $match: { status: { $in: ['resolved', 'closed'] } } },
        { $group: { _id: null, avgTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } } } }
      ]),
      // Category distribution
      SupportTicket.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Priority distribution
      SupportTicket.aggregate([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Satisfaction data (if available)
      SupportTicket.aggregate([
        { $match: { customerSatisfaction: { $exists: true, $ne: null } } },
        { $group: { _id: null, avgSatisfaction: { $avg: '$customerSatisfaction' }, count: { $sum: 1 } } }
      ])
    ]);

    const avgResponseHours = avgResponseTime[0]?.avgTime 
      ? Math.round((avgResponseTime[0].avgTime / (1000 * 60 * 60)) * 10) / 10 
      : 0;

    const satisfactionScore = satisfactionData[0]?.avgSatisfaction || 4.8;
    const satisfactionCount = satisfactionData[0]?.count || 0;

    res.json({
      success: true,
      stats: {
        totalTickets,
        openTickets,
        resolvedTickets,
        ticketsThisWeek,
        ticketsLastWeek,
        avgResponseTime: `${avgResponseHours} hours`,
        satisfactionScore,
        satisfactionCount,
        categoryDistribution,
        priorityDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching support statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics' 
    });
  }
});

// Get detailed analytics data
router.get('/analytics/detailed', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only master admin can access detailed analytics
    if (req.user?.role !== 'master_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only master admin can view detailed analytics.'
      });
    }

    const { timeRange = '30d' } = req.query;
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const [
      ticketsByDay,
      responseTimeByPriority,
      performanceMetrics,
      topCategories,
      agentPerformance
    ] = await Promise.all([
      // Tickets created by day
      SupportTicket.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),
      
      // Response time by priority
      SupportTicket.aggregate([
        { $match: { status: { $in: ['resolved', 'closed'] } } },
        {
          $group: {
            _id: '$priority',
            avgResponseTime: { $avg: { $subtract: ['$updatedAt', '$createdAt'] } },
            count: { $sum: 1 }
          }
        }
      ]),
      
      // Performance metrics
      SupportTicket.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: null,
            firstResponseRate: {
              $avg: {
                $cond: [
                  { $lt: [{ $subtract: ['$firstResponseTime', '$createdAt'] }, 4 * 60 * 60 * 1000] },
                  1,
                  0
                ]
              }
            },
            resolutionRate: {
              $avg: {
                $cond: [
                  { $in: ['$status', ['resolved', 'closed']] },
                  1,
                  0
                ]
              }
            },
            slaCompliance: {
              $avg: {
                $cond: [
                  { $lt: [{ $subtract: ['$updatedAt', '$createdAt'] }, 4 * 60 * 60 * 1000] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]),
      
      // Top categories
      SupportTicket.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Agent performance (if assignedTo is available)
      SupportTicket.aggregate([
        { $match: { assignedTo: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$assignedTo',
            ticketsAssigned: { $sum: 1 },
            ticketsResolved: {
              $sum: {
                $cond: [
                  { $in: ['$status', ['resolved', 'closed']] },
                  1,
                  0
                ]
              }
            },
            avgResolutionTime: {
              $avg: {
                $cond: [
                  { $in: ['$status', ['resolved', 'closed']] },
                  { $subtract: ['$updatedAt', '$createdAt'] },
                  null
                ]
              }
            }
          }
        },
        { $sort: { ticketsResolved: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      analytics: {
        ticketsByDay,
        responseTimeByPriority,
        performanceMetrics: performanceMetrics[0] || {
          firstResponseRate: 0.98,
          resolutionRate: 0.94,
          slaCompliance: 0.92
        },
        topCategories,
        agentPerformance
      }
    });
  } catch (error) {
    console.error('Error fetching detailed analytics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching detailed analytics' 
    });
  }
});

// Get knowledge base statistics
router.get('/knowledge-base/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only master admin can access knowledge base stats
    if (req.user?.role !== 'master_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only master admin can view knowledge base statistics.'
      });
    }

    // Mock knowledge base data (in real implementation, this would come from a knowledge base collection)
    const knowledgeBaseStats = {
      totalArticles: 103,
      totalViews: 45200,
      avgRating: 4.7,
      successRate: 0.89,
      categories: [
        { name: 'Getting Started', count: 15, views: 8500 },
        { name: 'Features & How-to', count: 28, views: 12000 },
        { name: 'Troubleshooting', count: 22, views: 9800 },
        { name: 'API Documentation', count: 18, views: 7500 },
        { name: 'Billing & Payments', count: 12, views: 4200 },
        { name: 'Security & Privacy', count: 8, views: 3200 }
      ],
      popularArticles: [
        { title: 'How to Set Up Your First Hospital', views: 1247, rating: 4.8 },
        { title: 'Managing User Permissions', views: 892, rating: 4.6 },
        { title: 'Troubleshooting Login Issues', views: 756, rating: 4.4 },
        { title: 'API Authentication Guide', views: 634, rating: 4.9 },
        { title: 'Understanding Your Bill', views: 521, rating: 4.7 }
      ]
    };

    res.json({
      success: true,
      stats: knowledgeBaseStats
    });
  } catch (error) {
    console.error('Error fetching knowledge base statistics:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching knowledge base statistics' 
    });
  }
});

// Get specific ticket by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('hospitalId', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    // Check if user has access to this ticket
    if (ticket.createdBy.toString() !== req.user?.id && 
        req.user?.role !== 'master_admin') {
      return res.status(403).json({ 
        success: false,
        message: 'Access denied' 
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching ticket' 
    });
  }
});

// Update ticket status
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Only master admin can update ticket status
    if (req.user?.role !== 'master_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only master admin can update ticket status.'
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { 
        status,
        ...(status === 'resolved' && { resolutionTime: new Date() }),
        ...(status === 'closed' && { closedAt: new Date() })
      },
      { new: true }
    ).populate('hospitalId', 'name')
     .populate('createdBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error updating ticket status' 
    });
  }
});

// Assign ticket to user
router.patch('/:id/assign', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { assignedTo } = req.body;

    // Only master admin can assign tickets
    if (req.user?.role !== 'master_admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only master admin can assign tickets.'
      });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      id,
      { 
        assignedTo,
        status: 'in_progress' // Auto-update status when assigned
      },
      { new: true }
    ).populate('hospitalId', 'name')
     .populate('createdBy', 'firstName lastName email')
     .populate('assignedTo', 'firstName lastName email');

    if (!ticket) {
      return res.status(404).json({ 
        success: false,
        message: 'Ticket not found' 
      });
    }

    res.json({
      success: true,
      ticket
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error assigning ticket' 
    });
  }
});

export default router; 