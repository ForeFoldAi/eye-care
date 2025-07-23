import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { verifyToken } from './middleware/auth';
import { ChatRoom, Message, UserStatus, Notification } from './models';
import mongoose from 'mongoose';

interface AuthenticatedSocket {
  userId: string;
  hospitalId: string;
  branchId?: string;
  role: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<string, string> = new Map(); // userId -> socketId
  private socketUsers: Map<string, AuthenticatedSocket> = new Map(); // socketId -> user

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          console.log('WebSocket connection rejected: No token provided');
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = await verifyToken(token);
        if (!decoded) {
          console.log('WebSocket connection rejected: Invalid token');
          return next(new Error('Authentication error: Invalid token'));
        }

        console.log(`WebSocket authentication successful for user: ${decoded.userId}`);
        socket.data.user = decoded;
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication error: ' + (error instanceof Error ? error.message : 'Unknown error')));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as AuthenticatedSocket;
      
      console.log(`User ${user.userId} connected with socket ID: ${socket.id}`);
      
      this.handleConnection(socket, user);
      this.handleDisconnection(socket, user);
      this.handleChatEvents(socket, user);
      this.handleTypingEvents(socket, user);
      this.handleStatusEvents(socket, user);
    });
  }

  private async handleConnection(socket: any, user: AuthenticatedSocket) {
    // Store socket mappings
    this.userSockets.set(user.userId, socket.id);
    this.socketUsers.set(socket.id, user);

    // Update user status to online
    await UserStatus.findOneAndUpdate(
      { userId: user.userId },
      {
        userId: user.userId,
        hospitalId: user.hospitalId,
        branchId: user.branchId,
        status: 'online',
        lastSeen: new Date(),
        socketId: socket.id
      },
      { upsert: true }
    );

    // Join hospital room for tenant isolation
    socket.join(`hospital:${user.hospitalId}`);
    
    // Join user's personal room for direct messages
    socket.join(`user:${user.userId}`);

    // Emit user online status to hospital
    this.io.to(`hospital:${user.hospitalId}`).emit('user_status_change', {
      userId: user.userId,
      status: 'online',
      timestamp: new Date()
    });

    // Send unread counts
    this.sendUnreadCounts(socket, user);
  }

  private async handleDisconnection(socket: any, user: AuthenticatedSocket) {
    socket.on('disconnect', async (reason: string) => {
      console.log(`User ${user.userId} disconnected (socket: ${socket.id}, reason: ${reason})`);

      // Update user status to offline
      await UserStatus.findOneAndUpdate(
        { userId: user.userId },
        {
          status: 'offline',
          lastSeen: new Date(),
          socketId: null
        }
      );

      // Remove socket mappings
      this.userSockets.delete(user.userId);
      this.socketUsers.delete(socket.id);

      // Emit user offline status to hospital
      this.io.to(`hospital:${user.hospitalId}`).emit('user_status_change', {
        userId: user.userId,
        status: 'offline',
        timestamp: new Date()
      });
    });
  }

  private handleChatEvents(socket: any, user: AuthenticatedSocket) {
    // Join chat room
    socket.on('join_room', async (roomId: string) => {
      try {
        const room = await ChatRoom.findOne({
          roomId,
          hospitalId: user.hospitalId,
          participants: user.userId,
          isActive: true
        });

        if (room) {
          socket.join(`room:${roomId}`);
          socket.emit('room_joined', { roomId });
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

    // Leave chat room
    socket.on('leave_room', (roomId: string) => {
      socket.leave(`room:${roomId}`);
      socket.emit('room_left', { roomId });
    });

    // Send message
    socket.on('send_message', async (data: {
      roomId: string;
      content: string;
      messageType?: string;
      replyTo?: string;
    }) => {
      try {
        const room = await ChatRoom.findOne({
          roomId: data.roomId,
          hospitalId: user.hospitalId,
          participants: user.userId,
          isActive: true
        });

        if (!room) {
          socket.emit('error', { message: 'Room not found or access denied' });
          return;
        }

        const message = new Message({
          roomId: room._id,
          sender: user.userId,
          content: data.content,
          messageType: data.messageType || 'text',
          replyTo: data.replyTo,
          deliveredTo: [user.userId]
        });

        await message.save();
        await message.populate('sender', 'firstName lastName role');
        await message.populate('replyTo', 'content sender');

        // Update room's last message
        room.lastMessage = {
          content: data.content,
          sender: user.userId,
          timestamp: new Date()
        };
        await room.save();

        // Emit message to room participants
        const messageData = {
          ...message.toObject(),
          roomId: data.roomId
        };

        this.io.to(`room:${data.roomId}`).emit('new_message', messageData);

        // Send delivery receipts to participants
        const participants = room.participants.filter((p: any) => p.toString() !== user.userId);
        participants.forEach((participantId: any) => {
          const participantSocketId = this.userSockets.get(participantId.toString());
          if (participantSocketId) {
            this.io.to(participantSocketId).emit('message_delivered', {
              messageId: message.messageId,
              roomId: data.roomId
            });
          }
        });

      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    // Mark messages as read
    socket.on('mark_read', async (data: { roomId: string }) => {
      try {
        const room = await ChatRoom.findOne({
          roomId: data.roomId,
          hospitalId: user.hospitalId,
          participants: user.userId,
          isActive: true
        });

        if (!room) {
          return;
        }

        // Mark messages as read
        await Message.updateMany(
          {
            roomId: room._id,
            sender: { $ne: user.userId },
            readBy: { $ne: user.userId }
          },
          { $addToSet: { readBy: user.userId } }
        );

        // Emit read receipts to message senders
        const unreadMessages = await Message.find({
          roomId: room._id,
          sender: { $ne: user.userId },
          readBy: { $ne: user.userId }
        });

        unreadMessages.forEach(msg => {
          const senderSocketId = this.userSockets.get(msg.sender.toString());
          if (senderSocketId) {
            this.io.to(senderSocketId).emit('message_read', {
              messageId: msg.messageId,
              roomId: data.roomId,
              readBy: user.userId
            });
          }
        });

      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });
  }

  private handleTypingEvents(socket: any, user: AuthenticatedSocket) {
    socket.on('typing_start', async (data: { roomId: string }) => {
      try {
        const room = await ChatRoom.findOne({
          roomId: data.roomId,
          hospitalId: user.hospitalId,
          participants: user.userId,
          isActive: true
        });

        if (room) {
          // Update typing status
          await UserStatus.findOneAndUpdate(
            { userId: user.userId },
            {
              isTyping: {
                roomId: room._id,
                timestamp: new Date()
              }
            }
          );

          // Emit typing indicator to room
          socket.to(`room:${data.roomId}`).emit('user_typing', {
            userId: user.userId,
            roomId: data.roomId,
            isTyping: true
          });
        }
      } catch (error) {
        console.error('Error handling typing start:', error);
      }
    });

    socket.on('typing_stop', async (data: { roomId: string }) => {
      try {
        const room = await ChatRoom.findOne({
          roomId: data.roomId,
          hospitalId: user.hospitalId,
          participants: user.userId,
          isActive: true
        });

        if (room) {
          // Clear typing status
          await UserStatus.findOneAndUpdate(
            { userId: user.userId },
            {
              isTyping: {
                roomId: null,
                timestamp: new Date()
              }
            }
          );

          // Emit typing stop to room
          socket.to(`room:${data.roomId}`).emit('user_typing', {
            userId: user.userId,
            roomId: data.roomId,
            isTyping: false
          });
        }
      } catch (error) {
        console.error('Error handling typing stop:', error);
      }
    });
  }

  private handleStatusEvents(socket: any, user: AuthenticatedSocket) {
    socket.on('status_change', async (data: { status: string }) => {
      try {
        await UserStatus.findOneAndUpdate(
          { userId: user.userId },
          {
            status: data.status,
            lastSeen: new Date()
          }
        );

        // Emit status change to hospital
        this.io.to(`hospital:${user.hospitalId}`).emit('user_status_change', {
          userId: user.userId,
          status: data.status,
          timestamp: new Date()
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });
  }

  private async sendUnreadCounts(socket: any, user: AuthenticatedSocket) {
    try {
      // Get unread message count
      const unreadMessages = await Message.aggregate([
        {
          $lookup: {
            from: 'chatrooms',
            localField: 'roomId',
            foreignField: '_id',
            as: 'room'
          }
        },
        {
          $match: {
            'room.hospitalId': new mongoose.Types.ObjectId(user.hospitalId),
            'room.participants': new mongoose.Types.ObjectId(user.userId),
            sender: { $ne: new mongoose.Types.ObjectId(user.userId) },
            readBy: { $ne: new mongoose.Types.ObjectId(user.userId) }
          }
        },
        {
          $group: {
            _id: '$roomId',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get unread notification count
      const unreadNotifications = await Notification.countDocuments({
        hospitalId: user.hospitalId,
        recipients: user.userId,
        readBy: { $ne: user.userId },
        isActive: true
      });

      socket.emit('unread_counts', {
        messages: unreadMessages.reduce((total, item) => total + item.count, 0),
        notifications: unreadNotifications
      });
    } catch (error) {
      console.error('Error sending unread counts:', error);
    }
  }

  // Public methods for sending notifications
  public async sendNotification(notification: any) {
    try {
      const notificationData = {
        id: notification.notificationId,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        priority: notification.priority,
        sender: notification.sender,
        timestamp: notification.createdAt,
        actions: notification.actions
      };

      // Send to all recipients
      notification.recipients.forEach((recipientId: string) => {
        const socketId = this.userSockets.get(recipientId);
        if (socketId) {
          this.io.to(socketId).emit('new_notification', notificationData);
        }
      });

      // Update unread counts for recipients
      notification.recipients.forEach((recipientId: string) => {
        const socketId = this.userSockets.get(recipientId);
        if (socketId) {
          this.sendUnreadCounts(this.io.sockets.sockets.get(socketId), {
            userId: recipientId,
            hospitalId: notification.hospitalId,
            role: ''
          });
        }
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  public async sendMessageToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public async broadcastToHospital(hospitalId: string, event: string, data: any) {
    this.io.to(`hospital:${hospitalId}`).emit(event, data);
  }
} 