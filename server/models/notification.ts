import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  notificationId: string;
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  type: 'individual' | 'group' | 'role' | 'system';
  title: string;
  message: string;
  sender: mongoose.Types.ObjectId;
  recipients: mongoose.Types.ObjectId[];
  roleTargets?: string[]; // For role-based notifications
  groupTargets?: string[]; // For group-based notifications
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'appointment' | 'announcement' | 'alert' | 'reminder' | 'system' | 'chat' | 'general';
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
    data?: any;
  }>;
  readBy: mongoose.Types.ObjectId[];
  isRead: boolean;
  expiresAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>({
  notificationId: {
    type: String,
    required: true,
    unique: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  type: {
    type: String,
    enum: ['individual', 'group', 'role', 'system'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  roleTargets: [{
    type: String,
    enum: ['master_admin', 'admin', 'sub_admin', 'doctor', 'receptionist']
  }],
  groupTargets: [{
    type: String,
    trim: true
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['appointment', 'announcement', 'alert', 'reminder', 'system', 'chat', 'general'],
    default: 'general'
  },
  actions: [{
    label: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      trim: true
    },
    data: {
      type: Schema.Types.Mixed
    }
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isRead: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Notification Group Model for managing notification groups
export interface INotificationGroup extends Document {
  groupId: string;
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  members: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationGroupSchema = new Schema<INotificationGroup>({
  groupId: {
    type: String,
    required: true,
    unique: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
notificationSchema.index({ hospitalId: 1, recipients: 1 });
notificationSchema.index({ hospitalId: 1, createdAt: -1 });
notificationSchema.index({ notificationId: 1 });
notificationSchema.index({ recipients: 1, isRead: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

notificationGroupSchema.index({ hospitalId: 1, name: 1 });
notificationGroupSchema.index({ groupId: 1 });
notificationGroupSchema.index({ members: 1 });

// Pre-save middleware to generate IDs
notificationSchema.pre('save', function(next) {
  if (!this.notificationId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.notificationId = `NOTIF-${timestamp}-${random}`;
  }
  next();
});

notificationGroupSchema.pre('save', function(next) {
  if (!this.groupId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.groupId = `GROUP-${timestamp}-${random}`;
  }
  next();
});

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to mark as read
notificationSchema.methods.markAsRead = function(userId: mongoose.Types.ObjectId) {
  if (!this.readBy.includes(userId)) {
    this.readBy.push(userId);
  }
  this.isRead = this.readBy.length === this.recipients.length;
  return this.save();
};

// Method to check if user has read
notificationSchema.methods.hasUserRead = function(userId: mongoose.Types.ObjectId) {
  return this.readBy.includes(userId);
};

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', notificationSchema);
export const NotificationGroup = mongoose.models.NotificationGroup || mongoose.model<INotificationGroup>('NotificationGroup', notificationGroupSchema); 