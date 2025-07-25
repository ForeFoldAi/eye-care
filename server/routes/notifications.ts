import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { Notification, NotificationGroup } from '../models';
import { z } from 'zod';
import mongoose from 'mongoose';

const router = Router();

// Role-based notification permissions
const NOTIFICATION_PERMISSIONS: Record<string, string[]> = {
  master_admin: ['admin', 'sub_admin', 'doctor', 'receptionist'], // Can notify everyone
  admin: ['master_admin', 'doctor', 'receptionist', 'sub_admin'], // Can notify everyone including master admin
  sub_admin: ['doctor', 'receptionist'],
  doctor: ['doctor', 'receptionist'], // Can notify other doctors and receptionists
  receptionist: ['doctor'] // Can notify doctors
};

// Create notification schema
const createNotificationSchema = z.object({
  type: z.enum(['individual', 'group', 'role', 'system']),
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  recipients: z.array(z.string()).optional(), // For individual notifications
  roleTargets: z.array(z.enum(['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist'])).optional(),
  groupTargets: z.array(z.string()).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  category: z.enum(['appointment', 'announcement', 'alert', 'reminder', 'system', 'chat', 'general']).default('general'),
  actions: z.array(z.object({
    label: z.string(),
    action: z.string(),
    url: z.string().optional(),
    data: z.any().optional()
  })).optional(),
  expiresAt: z.string().optional() // ISO date string
});

// Get user's notifications
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    if (!userId) {
      return res.status(400).json({ message: 'User context required' });
    }

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    const skip = (Number(page) - 1) * Number(limit);
    const query: any = {
      recipients: userId,
      isActive: true
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    if (unreadOnly === 'true') {
      query.readBy = { $ne: userId };
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'firstName lastName role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query)
    ]);

    res.json({
      success: true,
      notifications,
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
      message: 'Error fetching notifications' 
    });
  }
});

// Get unread notification count
router.get('/unread-count', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;
    const userRole = req.user?.role;

    console.log('unread-count: Request from user:', { userId, hospitalId, userRole });

    if (!userId) {
      console.log('unread-count: No user ID provided');
      return res.status(400).json({ message: 'User context required' });
    }

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && userRole !== 'master_admin') {
      console.log('unread-count: No hospitalId and user is not master_admin');
      // Instead of returning 400, return 0 count for users without hospital context
      return res.json({
        success: true,
        count: 0
      });
    }

    const query: any = {
      recipients: userId,
      readBy: { $ne: userId },
      isActive: true
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    console.log('unread-count: Query:', query);

    const count = await Notification.countDocuments(query);

    console.log('unread-count: Found count:', count);

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('unread-count: Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching unread count' 
    });
  }
});

// Create notification
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = createNotificationSchema.parse(req.body);
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;
    const userRole = req.user?.role;

    if (!userId || !hospitalId || !userRole) {
      return res.status(400).json({ message: 'User context required' });
    }

    // Check if user has permission to send notifications
    const allowedRoles = NOTIFICATION_PERMISSIONS[userRole as keyof typeof NOTIFICATION_PERMISSIONS];
    if (!allowedRoles || allowedRoles.length === 0) {
      return res.status(403).json({ message: 'Insufficient permissions to send notifications' });
    }

    const { User } = await import('../models');
    let recipients: mongoose.Types.ObjectId[] = [];

    // Determine recipients based on notification type
    switch (validatedData.type) {
      case 'individual':
        if (!validatedData.recipients || validatedData.recipients.length === 0) {
          return res.status(400).json({ message: 'Recipients required for individual notifications' });
        }
        recipients = validatedData.recipients.map(id => new mongoose.Types.ObjectId(id));
        break;

      case 'role':
        if (!validatedData.roleTargets || validatedData.roleTargets.length === 0) {
          return res.status(400).json({ message: 'Role targets required for role-based notifications' });
        }
        // Filter roles based on user permissions
        const permittedRoles = validatedData.roleTargets.filter(role => 
          allowedRoles.includes(role)
        );
        if (permittedRoles.length === 0) {
          return res.status(403).json({ message: 'No permitted roles selected' });
        }
        const roleUsers = await User.find({
          hospitalId,
          role: { $in: permittedRoles },
          isActive: true
        }).select('_id');
        recipients = roleUsers.map(user => user._id);
        break;

      case 'group':
        if (!validatedData.groupTargets || validatedData.groupTargets.length === 0) {
          return res.status(400).json({ message: 'Group targets required for group notifications' });
        }
        const groups = await NotificationGroup.find({
          hospitalId,
          groupId: { $in: validatedData.groupTargets },
          isActive: true
        });
        recipients = groups.flatMap(group => group.members);
        break;

      case 'system':
        // System notifications go to all users in the hospital
        const allUsers = await User.find({
          hospitalId,
          isActive: true
        }).select('_id');
        recipients = allUsers.map(user => user._id);
        break;
    }

    if (recipients.length === 0) {
      return res.status(400).json({ message: 'No recipients found for the specified criteria' });
    }

    const notification = new Notification({
      hospitalId,
      type: validatedData.type,
      title: validatedData.title,
      message: validatedData.message,
      sender: userId,
      recipients,
      roleTargets: validatedData.roleTargets,
      groupTargets: validatedData.groupTargets,
      priority: validatedData.priority,
      category: validatedData.category,
      actions: validatedData.actions,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined
    });

    await notification.save();
    await notification.populate('sender', 'firstName lastName role');

    res.status(201).json({
      success: true,
      notification
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Error creating notification' 
    });
  }
});

// Mark notification as read
router.patch('/:notificationId/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId || !hospitalId) {
      return res.status(400).json({ message: 'User context required' });
    }

    const notification = await Notification.findOne({
      notificationId,
      hospitalId,
      recipients: userId,
      isActive: true
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead(userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error marking notification as read' 
    });
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId || !hospitalId) {
      return res.status(400).json({ message: 'User context required' });
    }

    await Notification.updateMany(
      {
        hospitalId,
        recipients: userId,
        readBy: { $ne: userId },
        isActive: true
      },
      { $addToSet: { readBy: userId } }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error marking notifications as read' 
    });
  }
});

// Delete notification (for sender only)
router.delete('/:notificationId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId || !hospitalId) {
      return res.status(400).json({ message: 'User context required' });
    }

    const notification = await Notification.findOne({
      notificationId,
      hospitalId,
      sender: userId,
      isActive: true
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found or access denied' });
    }

    notification.isActive = false;
    await notification.save();

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error deleting notification' 
    });
  }
});

// Get notification groups
router.get('/groups', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    const query: any = {
      isActive: true
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    const groups = await NotificationGroup.find(query)
    .populate('members', 'firstName lastName role')
    .populate('createdBy', 'firstName lastName')
    .sort({ name: 1 });

    res.json({
      success: true,
      groups
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notification groups' 
    });
  }
});

// Create notification group
router.post('/groups', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, description, members } = req.body;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId || !hospitalId || !name || !members) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const group = new NotificationGroup({
      hospitalId,
      name,
      description,
      members: members.map((id: string) => new mongoose.Types.ObjectId(id)),
      createdBy: userId
    });

    await group.save();
    await group.populate('members', 'firstName lastName role');
    await group.populate('createdBy', 'firstName lastName');

    res.status(201).json({
      success: true,
      group
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error creating notification group' 
    });
  }
});

// Get notification statistics (for admin users)
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;
    const userRole = req.user?.role;

    if (!hospitalId) {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    // Only admin users can view stats
    if (!['master_admin', 'admin', 'sub_admin'].includes(userRole || '')) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const [totalNotifications, unreadNotifications, notificationsByCategory] = await Promise.all([
      Notification.countDocuments({ hospitalId, isActive: true }),
      Notification.countDocuments({ 
        hospitalId, 
        isActive: true,
        readBy: { $size: 0 } // No one has read
      }),
      Notification.aggregate([
        { $match: { hospitalId: new mongoose.Types.ObjectId(hospitalId), isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ])
    ]);

    res.json({
      success: true,
      stats: {
        total: totalNotifications,
        unread: unreadNotifications,
        byCategory: notificationsByCategory
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching notification statistics' 
    });
  }
});

// Send message to specific user
router.post('/send-message', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { userId, message } = req.body;
    const senderId = req.user?.id;
    const hospitalId = req.user?.hospitalId;
    const userRole = req.user?.role;

    if (!senderId || !userId || !message) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields: userId and message are required' 
      });
    }

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && userRole !== 'master_admin') {
      return res.status(400).json({ 
        success: false,
        message: 'Hospital context required' 
      });
    }

    // Validate message length
    if (message.trim().length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'Message cannot be empty' 
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ 
        success: false,
        message: 'Message too long (max 1000 characters)' 
      });
    }

    // Check if recipient user exists
    const { User } = await import('../models');
    const recipient = await User.findById(userId);
    
    if (!recipient) {
      return res.status(404).json({ 
        success: false,
        message: 'Recipient user not found' 
      });
    }

    // For master_admin, they can send to any user
    // For other users, check if they have permission to send to this user
    if (userRole !== 'master_admin') {
      const allowedRoles = NOTIFICATION_PERMISSIONS[userRole as keyof typeof NOTIFICATION_PERMISSIONS];
      if (!allowedRoles || !allowedRoles.includes(recipient.role)) {
        return res.status(403).json({ 
          success: false,
          message: 'Insufficient permissions to send message to this user' 
        });
      }

      // Check if recipient is in the same hospital (for non-master_admin users)
      if (recipient.hospitalId?.toString() !== hospitalId) {
        return res.status(403).json({ 
          success: false,
          message: 'Can only send messages to users in the same hospital' 
        });
      }
    }

    // Get sender details for the notification title
    const sender = await User.findById(senderId).select('firstName lastName');
    const senderName = sender ? `${sender.firstName} ${sender.lastName}` : 'System';

    // Create the notification
    const notification = new Notification({
      notificationId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hospitalId: hospitalId || recipient.hospitalId,
      type: 'individual',
      title: `Message from ${senderName}`,
      message: message.trim(),
      sender: senderId,
      recipients: [new mongoose.Types.ObjectId(userId)],
      priority: 'medium',
      category: 'chat',
      isActive: true
    });

    await notification.save();
    await notification.populate('sender', 'firstName lastName role');

    // Broadcast via WebSocket if available
    try {
      // Note: WebSocket broadcasting is handled by the notification service
      // The notification will be automatically broadcasted when saved
      console.log(`Message sent to user ${userId}: ${message.substring(0, 50)}...`);
    } catch (socketError) {
      console.log('WebSocket broadcast failed (non-critical):', socketError);
    }

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      notification
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error sending message' 
    });
  }
});

export default router; 