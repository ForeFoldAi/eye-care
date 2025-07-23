import { Router } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ChatRoom, Message, UserStatus } from '../models';
import { z } from 'zod';
import mongoose from 'mongoose';

const router = Router();

// Role-based messaging rules
const MESSAGING_RULES = {
  master_admin: ['admin'], // Only admins can chat with master admin (service channel)
  admin: ['master_admin', 'doctor', 'receptionist', 'sub_admin'],
  sub_admin: ['doctor', 'receptionist'],
  doctor: ['admin', 'sub_admin', 'doctor', 'receptionist'], // Can message other doctors and receptionists
  receptionist: ['admin', 'sub_admin', 'doctor'] // Can message doctors
};

// Helper function to check if user can message another user
const canMessageUser = (senderRole: string, recipientRole: string): boolean => {
  const allowedRoles = MESSAGING_RULES[senderRole as keyof typeof MESSAGING_RULES] || [];
  return allowedRoles.includes(recipientRole);
};

// Helper function to get users user can message
const getMessageableUsers = (userRole: string, hospitalId: string) => {
  const allowedRoles = MESSAGING_RULES[userRole as keyof typeof MESSAGING_RULES] || [];
  return { role: { $in: allowedRoles }, hospitalId, isActive: true };
};

// Create chat room schema
const createRoomSchema = z.object({
  type: z.enum(['direct', 'group']),
  participants: z.array(z.string()).min(1, 'At least one participant required'),
  name: z.string().optional() // Required for group chats
});

// Send message schema
const sendMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
  messageType: z.enum(['text', 'file', 'image', 'system']).default('text'),
  attachments: z.array(z.object({
    filename: z.string(),
    url: z.string(),
    size: z.number(),
    type: z.string()
  })).optional(),
  replyTo: z.string().optional()
});

// Get user's chat rooms
router.get('/rooms', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    console.log('=== GET ROOMS DEBUG ===');
    console.log('Request details:', {
      userId,
      hospitalId,
      userRole: req.user?.role
    });

    if (!userId) {
      return res.status(400).json({ message: 'User context required' });
    }

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    const query: any = {
      participants: new mongoose.Types.ObjectId(userId),
      isActive: true
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      query.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    console.log('Rooms query:', JSON.stringify(query, null, 2));

    const rooms = await ChatRoom.find(query)
    .populate('participants', 'firstName lastName role email')
    .populate('lastMessage.sender', 'firstName lastName')
    .populate('createdBy', 'firstName lastName')
    .sort({ updatedAt: -1 });

    console.log('Found rooms:', rooms.map(room => ({
      _id: room._id,
      roomId: room.roomId,
      type: room.type,
      participants: room.participants.map((p: any) => ({ _id: p._id, firstName: p.firstName, lastName: p.lastName, role: p.role })),
      hospitalId: room.hospitalId
    })));

    console.log('=== END GET ROOMS DEBUG ===');

    res.json({
      success: true,
      rooms
    });
  } catch (error) {
    console.error('Error in get rooms route:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching chat rooms' 
    });
  }
});

// Create or get direct chat room
router.post('/rooms/direct', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId || !participantId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    // Check if room already exists
    const roomQuery: any = {
      type: 'direct',
      participants: { $all: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(participantId)] },
      isActive: true
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      roomQuery.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    const existingRoom = await ChatRoom.findOne(roomQuery).populate('participants', 'firstName lastName role email');

    if (existingRoom) {
      return res.json({
        success: true,
        room: existingRoom
      });
    }

    // Create new room
    const roomData: any = {
      type: 'direct',
      participants: [new mongoose.Types.ObjectId(userId), new mongoose.Types.ObjectId(participantId)],
      createdBy: new mongoose.Types.ObjectId(userId)
    };

    // Add hospitalId only if it exists
    if (hospitalId) {
      roomData.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    const room = new ChatRoom(roomData);

    console.log('Creating room before save:', room);
    await room.save();
    console.log('Room after save:', room);
    await room.populate('participants', 'firstName lastName role email');

    res.status(201).json({
      success: true,
      room
    });
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating chat room',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Create group chat room
router.post('/rooms/group', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const validatedData = createRoomSchema.parse(req.body);
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId || !hospitalId) {
      return res.status(400).json({ message: 'User context required' });
    }

    if (validatedData.type === 'group' && !validatedData.name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    // Add current user to participants if not already included
    const participants = validatedData.participants.includes(userId) 
      ? validatedData.participants 
      : [userId, ...validatedData.participants];

    const room = new ChatRoom({
      hospitalId: new mongoose.Types.ObjectId(hospitalId),
      type: validatedData.type,
      name: validatedData.name,
      participants: participants.map(p => new mongoose.Types.ObjectId(p)),
      createdBy: new mongoose.Types.ObjectId(userId)
    });

    await room.save();
    await room.populate('participants', 'firstName lastName role email');

    res.status(201).json({
      success: true,
      room
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
      message: 'Error creating group chat room' 
    });
  }
});

// Get room messages
router.get('/rooms/:roomId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    console.log('=== GET MESSAGES DEBUG ===');
    console.log('Request details:', {
      roomId,
      userId,
      hospitalId,
      userRole: req.user?.role,
      page,
      limit
    });

    if (!userId) {
      return res.status(400).json({ message: 'User context required' });
    }
    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    // Verify user is participant in the room
    const roomQuery: any = {
      roomId,
      participants: new mongoose.Types.ObjectId(userId),
      isActive: true
    };
    if (hospitalId) {
      roomQuery.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    
    console.log('Room query for messages:', JSON.stringify(roomQuery, null, 2));
    const room = await ChatRoom.findOne(roomQuery);
    console.log('Found room for messages:', room ? {
      _id: room._id,
      roomId: room.roomId,
      participants: room.participants,
      hospitalId: room.hospitalId
    } : 'null');

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total] = await Promise.all([
      Message.find({
        roomId: room._id,
        isDeleted: false
      })
      .populate('sender', 'firstName lastName role')
      .populate('replyTo', 'content sender')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
      Message.countDocuments({
        roomId: room._id,
        isDeleted: false
      })
    ]);

    console.log('Messages found:', {
      count: messages.length,
      total,
      roomId: room._id
    });

    // Mark messages as delivered
    const unreadMessages = messages.filter(msg => 
      !msg.deliveredTo.includes(new mongoose.Types.ObjectId(userId)) && msg.sender.toString() !== userId
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(msg => msg._id) } },
        { $addToSet: { deliveredTo: new mongoose.Types.ObjectId(userId) } }
      );
      console.log('Marked', unreadMessages.length, 'messages as delivered');
    }

    console.log('=== END GET MESSAGES DEBUG ===');

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error in get messages route:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching messages' 
    });
  }
});

// Send message
router.post('/rooms/:roomId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const validatedData = sendMessageSchema.parse(req.body);
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    console.log('=== SEND MESSAGE DEBUG ===');
    console.log('Request details:', {
      roomId,
      userId,
      hospitalId,
      userRole: req.user?.role,
      content: validatedData.content
    });

    if (!userId) {
      return res.status(400).json({ message: 'User context required' });
    }
    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    // Verify user is participant in the room
    const roomQuery: any = {
      roomId,
      participants: new mongoose.Types.ObjectId(userId),
      isActive: true
    };
    if (hospitalId) {
      roomQuery.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    
    console.log('Room query:', JSON.stringify(roomQuery, null, 2));
    const room = await ChatRoom.findOne(roomQuery);
    console.log('Found room:', room ? {
      _id: room._id,
      roomId: room.roomId,
      participants: room.participants,
      hospitalId: room.hospitalId
    } : 'null');

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    const message = new Message({
      roomId: room._id,
      sender: new mongoose.Types.ObjectId(userId),
      content: validatedData.content,
      messageType: validatedData.messageType,
      attachments: validatedData.attachments,
      replyTo: validatedData.replyTo ? new mongoose.Types.ObjectId(validatedData.replyTo) : undefined,
      deliveredTo: [new mongoose.Types.ObjectId(userId)] // Sender has delivered to themselves
    });

    console.log('Creating message with data:', {
      roomId: room._id,
      sender: new mongoose.Types.ObjectId(userId),
      content: validatedData.content,
      messageId: message.messageId
    });

    await message.save();
    console.log('Message saved successfully:', message._id);
    
    await message.populate('sender', 'firstName lastName role');
    await message.populate('replyTo', 'content sender');

    console.log('Message populated:', {
      messageId: message._id,
      sender: message.sender,
      roomId: message.roomId
    });

    // Update room's last message
    room.lastMessage = {
      content: validatedData.content,
      sender: new mongoose.Types.ObjectId(userId),
      timestamp: new Date()
    };
    await room.save();
    console.log('Room last message updated');

    console.log('=== END SEND MESSAGE DEBUG ===');

    res.status(201).json({
      success: true,
      message
    });
  } catch (error) {
    console.error('Error in send message route:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ 
      success: false,
      message: 'Error sending message',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Mark messages as read
router.patch('/rooms/:roomId/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId) {
      return res.status(400).json({ message: 'User context required' });
    }
    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    // Verify user is participant in the room
    const roomQuery: any = {
      roomId,
      participants: new mongoose.Types.ObjectId(userId),
      isActive: true
    };
    if (hospitalId) {
      roomQuery.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }
    const room = await ChatRoom.findOne(roomQuery);

    if (!room) {
      return res.status(404).json({ message: 'Room not found or access denied' });
    }

    // Mark all unread messages in the room as read
    await Message.updateMany(
      {
        roomId: room._id,
        sender: { $ne: new mongoose.Types.ObjectId(userId) },
        readBy: { $ne: new mongoose.Types.ObjectId(userId) }
      },
      { $addToSet: { readBy: new mongoose.Types.ObjectId(userId) } }
    );

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error marking messages as read' 
    });
  }
});

// Get messageable users (users the current user can message)
router.get('/messageable-users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(400).json({ message: 'User context required' });
    }

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    const { User } = await import('../models');
    
    const userQuery: any = {
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
      isActive: true,
      role: { $in: MESSAGING_RULES[userRole as keyof typeof MESSAGING_RULES] || [] }
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      userQuery.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    const messageableUsers = await User.find(userQuery)
    .select('firstName lastName role email')
    .sort({ firstName: 1, lastName: 1 });

    res.json({
      success: true,
      users: messageableUsers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching messageable users' 
    });
  }
});

// Update user status
router.patch('/status', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { status } = req.body;
    const userId = req.user?.id;
    const hospitalId = req.user?.hospitalId;

    if (!userId) {
      return res.status(400).json({ message: 'User context required' });
    }
    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    const statusData: any = {
      userId: new mongoose.Types.ObjectId(userId),
      status: status || 'online',
      lastSeen: new Date()
    };

    // Add hospitalId only if it exists
    if (hospitalId) {
      statusData.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    const userStatus = await UserStatus.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      statusData,
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      status: userStatus
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error updating user status' 
    });
  }
});

// Get online users in the hospital
router.get('/online-users', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const hospitalId = req.user?.hospitalId;

    // For master_admin, they might not have a hospitalId
    if (!hospitalId && req.user?.role !== 'master_admin') {
      return res.status(400).json({ message: 'Hospital context required' });
    }

    const query: any = {
      status: { $in: ['online', 'away', 'busy'] }
    };

    // Add hospitalId filter only if it exists
    if (hospitalId) {
      query.hospitalId = new mongoose.Types.ObjectId(hospitalId);
    }

    const onlineUsers = await UserStatus.find(query)
    .populate('userId', 'firstName lastName role')
    .sort({ lastSeen: -1 });

    res.json({
      success: true,
      users: onlineUsers
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching online users' 
    });
  }
});

export default router; 