import { Notification } from '../models';
import { WebSocketServer as SocketService } from '../websocket';

interface NotificationData {
  type: 'individual' | 'group' | 'role' | 'system';
  title: string;
  message: string;
  recipients?: string[];
  roleTargets?: string[];
  groupTargets?: string[];
  sender?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: 'appointment' | 'announcement' | 'alert' | 'reminder' | 'system' | 'chat' | 'general';
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    data?: any;
  }>;
  hospitalId: string;
  branchId?: string;
  expiresAt?: Date;
}

export class NotificationService {
  static async createAndBroadcast(data: NotificationData): Promise<void> {
    try {
      // Create the notification
      const notification = new Notification({
        type: data.type,
        title: data.title,
        message: data.message,
        sender: data.sender,
        recipients: data.recipients || [],
        priority: data.priority || 'medium',
        category: data.category || 'general',
        actions: data.actions || [],
        hospitalId: data.hospitalId,
        branchId: data.branchId,
        expiresAt: data.expiresAt
      });

      await notification.save();
      await notification.populate('sender', 'firstName lastName role');

      // Get WebSocket instance for broadcasting
      const WebSocketServer = require('../websocket').WebSocketServer;
      const socketInstance = WebSocketServer.getInstance();
      
      // Broadcast to recipients if socket instance exists
      if (data.recipients && data.recipients.length > 0 && socketInstance) {
        for (const recipientId of data.recipients) {
          const recipientSocketId = socketInstance.userSockets?.get(recipientId);
          if (recipientSocketId && socketInstance.io) {
            const unreadCount = await Notification.countDocuments({
              recipients: recipientId,
              'readBy.user': { $ne: recipientId }
            });

            socketInstance.io.to(recipientSocketId).emit('new_notification', {
              notification: notification.toObject(),
              unreadCount
            });
          }
        }
      }

      console.log(`✅ Notification broadcast: ${data.title} to ${data.recipients?.length || 0} recipients`);
    } catch (error) {
      console.error('❌ Error creating and broadcasting notification:', error);
    }
  }

  static async createChatNotification(senderId: string, recipientId: string, messageContent: string, hospitalId: string, branchId?: string): Promise<void> {
    // Get sender details
    const User = require('../models').User;
    const sender: any = await User.findById(senderId).select('firstName lastName role');
    
    if (!sender) return;

    const notificationData: NotificationData = {
      type: 'individual',
      title: 'New Message',
      message: `${sender.firstName} ${sender.lastName}: ${messageContent.substring(0, 50)}${messageContent.length > 50 ? '...' : ''}`,
      sender: senderId,
      recipients: [recipientId],
      priority: 'medium',
      category: 'chat',
      hospitalId,
      branchId,
      actions: [{
        label: 'View Message',
        action: 'navigate',
        url: '/chat'
      }]
    };

    await this.createAndBroadcast(notificationData);
  }

  static async createAppointmentNotification(data: {
    patientId: string;
    doctorId: string;
    receptionistId?: string;
    appointmentId: string;
    type: 'created' | 'updated' | 'cancelled' | 'reminder';
    appointmentDate: Date;
    hospitalId: string;
    branchId?: string;
  }): Promise<void> {
    const User = require('../models').User;
    const patient = await User.findById(data.patientId).select('firstName lastName');
    const doctor = await User.findById(data.doctorId).select('firstName lastName');

    if (!patient || !doctor) return;

    const recipients = [data.doctorId];
    if (data.receptionistId) recipients.push(data.receptionistId);

    let title = '';
    let message = '';
    
    switch (data.type) {
      case 'created':
        title = 'New Appointment Scheduled';
        message = `Appointment scheduled for ${patient.firstName} ${patient.lastName} with Dr. ${doctor.firstName} ${doctor.lastName} on ${data.appointmentDate.toLocaleDateString()}`;
        break;
      case 'updated':
        title = 'Appointment Updated';
        message = `Appointment for ${patient.firstName} ${patient.lastName} has been updated`;
        break;
      case 'cancelled':
        title = 'Appointment Cancelled';
        message = `Appointment for ${patient.firstName} ${patient.lastName} has been cancelled`;
        break;
      case 'reminder':
        title = 'Appointment Reminder';
        message = `Upcoming appointment with ${patient.firstName} ${patient.lastName} in 30 minutes`;
        break;
    }

    const notificationData: NotificationData = {
      type: 'individual',
      title,
      message,
      recipients,
      priority: data.type === 'reminder' ? 'high' : 'medium',
      category: 'appointment',
      hospitalId: data.hospitalId,
      branchId: data.branchId,
      actions: [{
        label: 'View Appointment',
        action: 'navigate',
        url: `/appointments/${data.appointmentId}`
      }]
    };

    await this.createAndBroadcast(notificationData);
  }

  static async createSystemNotification(data: {
    title: string;
    message: string;
    recipients?: string[];
    roleTargets?: string[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    hospitalId: string;
    branchId?: string;
    actions?: Array<{
      label: string;
      action: string;
      url?: string;
    }>;
  }): Promise<void> {
    let recipients = data.recipients || [];
    
    if (data.roleTargets && data.roleTargets.length > 0) {
      const User = require('../models').User;
      const roleUsers = await User.find({
        hospitalId: data.hospitalId,
        role: { $in: data.roleTargets },
        isActive: true
      }).select('_id');
      recipients = [...recipients, ...roleUsers.map(user => user._id.toString())];
    }

    const notificationData: NotificationData = {
      type: data.roleTargets ? 'role' : 'individual',
      title: data.title,
      message: data.message,
      recipients,
      priority: data.priority || 'medium',
      category: 'system',
      hospitalId: data.hospitalId,
      branchId: data.branchId,
      actions: data.actions || []
    };

    await this.createAndBroadcast(notificationData);
  }
}