import express from 'express';
import { Subscription } from '../models/subscription';
import { Hospital } from '../models/hospital';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Get subscription for a specific hospital
router.get('/hospital/:hospitalId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { hospitalId } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if user has access to this hospital
    if (user.role === 'admin' && user.hospitalId !== hospitalId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Find the hospital
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ message: 'Hospital not found' });
    }

    // Find the subscription for this hospital
    const subscription = await Subscription.findOne({ hospitalId })
      .populate('subscriptionPlanId', 'name description price features');

    if (!subscription) {
      // Return a default subscription status if no subscription exists
      return res.json({
        id: null,
        hospitalId,
        status: 'inactive',
        planName: 'No Plan',
        planDescription: 'No subscription plan assigned',
        price: 0,
        features: [],
        startDate: null,
        endDate: null,
        isActive: false
      });
    }

    res.json({
      id: subscription._id,
      hospitalId: subscription.hospitalId,
      status: subscription.status,
      planName: subscription.subscriptionPlanId?.name || 'Unknown Plan',
      planDescription: subscription.subscriptionPlanId?.description || '',
      price: subscription.subscriptionPlanId?.price || 0,
      features: subscription.subscriptionPlanId?.features || [],
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      isActive: subscription.status === 'active' || subscription.status === 'trial'
    });
  } catch (error) {
    console.error('Error fetching hospital subscription:', error);
    res.status(500).json({ message: 'Error fetching subscription' });
  }
});

// Get all subscriptions (admin only)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (user.role !== 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const subscriptions = await Subscription.find()
      .populate('hospitalId', 'name email')
      .populate('subscriptionPlanId', 'name price features')
      .sort({ createdAt: -1 });

    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions' });
  }
});

// Create a new subscription
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (user.role !== 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { hospitalId, subscriptionPlanId, status = 'active' } = req.body;

    // Check if subscription already exists for this hospital
    const existingSubscription = await Subscription.findOne({ hospitalId });
    if (existingSubscription) {
      return res.status(400).json({ message: 'Hospital already has a subscription' });
    }

    const subscription = new Subscription({
      hospitalId,
      subscriptionPlanId,
      status,
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
    });

    await subscription.save();

    const populatedSubscription = await Subscription.findById(subscription._id)
      .populate('hospitalId', 'name email')
      .populate('subscriptionPlanId', 'name price features');

    res.status(201).json(populatedSubscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription' });
  }
});

// Update subscription
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (user.role !== 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;
    const { status, subscriptionPlanId } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      id,
      { status, subscriptionPlanId },
      { new: true }
    ).populate('hospitalId', 'name email')
     .populate('subscriptionPlanId', 'name price features');

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Error updating subscription' });
  }
});

// Delete subscription
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (user.role !== 'admin' && user.role !== 'master_admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { id } = req.params;

    const subscription = await Subscription.findByIdAndDelete(id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ message: 'Error deleting subscription' });
  }
});

export default router; 