import { Router } from 'express';
import { authenticateToken, authorizeRole, AuthRequest } from '../middleware/auth';
import { SubscriptionPlan } from '../models';
import { z } from 'zod';

const router = Router();

// All routes require master admin role
router.use(authenticateToken);
router.use(authorizeRole(['master_admin']));

// Validation schema
const createSubscriptionPlanSchema = z.object({
  planName: z.string().min(1, 'Plan name is required'),
  planType: z.enum(['trial', 'basic', 'standard', 'premium', 'enterprise', 'custom']),
  description: z.string().max(500).optional(),
  monthlyCost: z.number().min(0),
  yearlyCost: z.number().min(0),
  currency: z.enum(['INR', 'USD', 'EUR', 'GBP']).default('INR'),
  trialDays: z.number().min(0).default(0),
  maxUsers: z.number().min(1),
  maxBranches: z.number().min(1),
  maxPatients: z.number().min(0),
  maxStorage: z.number().min(1),
  features: z.array(z.string()).min(1, 'At least one feature is required'),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
  isCustom: z.boolean().default(false),
  autoRenew: z.boolean().default(true),
  billingCycle: z.enum(['monthly', 'quarterly', 'yearly']),
  gracePeriod: z.number().min(0).default(7),
  setupFee: z.number().min(0).default(0),
  notes: z.string().max(1000).optional()
});

// Get all subscription plans
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      planType, 
      isActive, 
      isPopular,
      search 
    } = req.query;

    const query: any = {};

    // Apply filters
    if (planType && planType !== 'all') {
      query.planType = planType;
    }
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    if (isPopular !== undefined) {
      query.isPopular = isPopular === 'true';
    }
    if (search) {
      query.$or = [
        { planName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [plans, total] = await Promise.all([
      SubscriptionPlan.find(query)
        .populate('createdBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      SubscriptionPlan.countDocuments(query)
    ]);

    res.json({
      plans,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ message: 'Error fetching subscription plans' });
  }
});

// Get active subscription plans (for hospital selection)
router.get('/active', async (req: AuthRequest, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .select('planName planType description monthlyCost yearlyCost currency trialDays maxUsers maxBranches maxPatients maxStorage features isPopular')
      .sort({ isPopular: -1, monthlyCost: 1 });

    res.json(plans);
  } catch (error) {
    console.error('Error fetching active subscription plans:', error);
    res.status(500).json({ message: 'Error fetching active subscription plans' });
  }
});

// Get subscription plan by ID
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findById(id)
      .populate('createdBy', 'firstName lastName email');

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json(plan);
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({ message: 'Error fetching subscription plan' });
  }
});

// Create new subscription plan
router.post('/', async (req: AuthRequest, res) => {
  try {
    const validatedData = createSubscriptionPlanSchema.parse(req.body);

    const plan = new SubscriptionPlan({
      ...validatedData,
      createdBy: req.user?.id
    });

    await plan.save();

    const populatedPlan = await SubscriptionPlan.findById(plan._id)
      .populate('createdBy', 'firstName lastName email');

    res.status(201).json(populatedPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    console.error('Error creating subscription plan:', error);
    res.status(500).json({ message: 'Error creating subscription plan' });
  }
});

// Update subscription plan
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const validatedData = createSubscriptionPlanSchema.parse(req.body);

    const plan = await SubscriptionPlan.findByIdAndUpdate(
      id,
      validatedData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    console.error('Error updating subscription plan:', error);
    res.status(500).json({ message: 'Error updating subscription plan' });
  }
});

// Delete subscription plan
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if plan is being used by any active subscriptions
    const { Subscription } = require('../models');
    const activeSubscriptions = await Subscription.countDocuments({
      subscriptionPlanId: id,
      status: { $in: ['active', 'trial'] }
    });

    if (activeSubscriptions > 0) {
      return res.status(400).json({ 
        message: `Cannot delete plan. It has ${activeSubscriptions} active subscription(s).` 
      });
    }

    const plan = await SubscriptionPlan.findByIdAndDelete(id);

    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    res.json({ message: 'Subscription plan deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({ message: 'Error deleting subscription plan' });
  }
});

// Toggle plan status
router.patch('/:id/toggle-status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    plan.isActive = !plan.isActive;
    await plan.save();

    const populatedPlan = await SubscriptionPlan.findById(id)
      .populate('createdBy', 'firstName lastName email');

    res.json(populatedPlan);
  } catch (error) {
    console.error('Error toggling subscription plan status:', error);
    res.status(500).json({ message: 'Error toggling subscription plan status' });
  }
});

// Get subscription plan statistics
router.get('/stats/overview', async (req: AuthRequest, res) => {
  try {
    const [
      totalPlans,
      activePlans,
      popularPlans,
      plansByType
    ] = await Promise.all([
      SubscriptionPlan.countDocuments(),
      SubscriptionPlan.countDocuments({ isActive: true }),
      SubscriptionPlan.countDocuments({ isPopular: true, isActive: true }),
      SubscriptionPlan.aggregate([
        {
          $group: {
            _id: '$planType',
            count: { $sum: 1 },
            avgMonthlyCost: { $avg: '$monthlyCost' },
            avgYearlyCost: { $avg: '$yearlyCost' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    res.json({
      totalPlans,
      activePlans,
      popularPlans,
      plansByType
    });
  } catch (error) {
    console.error('Error fetching subscription plan statistics:', error);
    res.status(500).json({ message: 'Error fetching subscription plan statistics' });
  }
});

// Get subscribers for a specific subscription plan
router.get('/:id/subscribers', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if plan exists
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    // Get all subscriptions for this plan
    const { Subscription } = require('../models');
    const subscriptions = await Subscription.find({ subscriptionPlanId: id })
      .populate('hospitalId', 'name email')
      .populate('adminId', 'firstName lastName email')
      .sort({ createdAt: -1 });

    // Transform data for frontend
    const subscribers = subscriptions.map((sub: any) => ({
      hospitalName: sub.hospitalId?.name || 'Unknown Hospital',
      email: sub.hospitalId?.email || sub.adminId?.email || 'No email',
      status: sub.status,
      startDate: sub.startDate,
      endDate: sub.endDate,
      nextBillingDate: sub.nextBillingDate,
      totalPaid: sub.totalPaid || 0,
      outstandingAmount: sub.outstandingAmount || 0,
      currency: sub.currency || 'INR',
      adminName: sub.adminId ? `${sub.adminId.firstName} ${sub.adminId.lastName}` : 'Unknown Admin'
    }));

    res.json({ subscribers });
  } catch (error) {
    console.error('Error fetching subscribers:', error);
    res.status(500).json({ message: 'Error fetching subscribers' });
  }
});

// Get analytics for a specific subscription plan
router.get('/:id/analytics', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if plan exists
    const plan = await SubscriptionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Subscription plan not found' });
    }

    // Get all subscriptions for this plan
    const { Subscription, Payment } = require('../models');
    
    const subscriptions = await Subscription.find({ subscriptionPlanId: id });
    const activeSubscriptions = subscriptions.filter((sub: any) => sub.status === 'active').length;
    const activeTrials = subscriptions.filter((sub: any) => sub.status === 'trial').length;
    const totalSubscriptions = subscriptions.length;

    // Calculate total revenue from this plan
    const totalRevenue = subscriptions.reduce((sum: number, sub: any) => sum + (sub.totalPaid || 0), 0);
    
    // Calculate average monthly cost
    const avgMonthlyCost = totalSubscriptions > 0 ? totalRevenue / totalSubscriptions : 0;

    // Calculate customer retention (simplified - active subscriptions / total subscriptions)
    const customerRetention = totalSubscriptions > 0 ? Math.round((activeSubscriptions / totalSubscriptions) * 100) : 0;

    // Get currency from plan
    const currency = plan.currency || 'INR';

    res.json({
      totalRevenue,
      totalSubscriptions,
      activeSubscriptions,
      activeTrials,
      avgMonthlyCost,
      customerRetention,
      currency
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});



export default router; 