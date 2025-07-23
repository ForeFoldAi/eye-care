import mongoose, { Document, Schema } from 'mongoose';

// Chat Room Model
export interface IChatRoom extends Document {
  roomId: string;
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  type: 'direct' | 'group';
  name?: string; // For group chats
  participants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  lastMessage?: {
    content: string;
    sender: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const chatRoomSchema = new Schema<IChatRoom>({
  roomId: {
    type: String,
    unique: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false // Made optional to support master_admin users
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  type: {
    type: String,
    enum: ['direct', 'group'],
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastMessage: {
    content: {
      type: String,
      trim: true
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Message Model
export interface IMessage extends Document {
  messageId: string;
  roomId: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  content: string;
  messageType: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
    type: string;
  }>;
  readBy: mongoose.Types.ObjectId[];
  deliveredTo: mongoose.Types.ObjectId[];
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: mongoose.Types.ObjectId;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  messageId: {
    type: String,
    required: true,
    unique: true
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image', 'system'],
    default: 'text'
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  }],
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isEdited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// User Online Status Model
export interface IUserStatus extends Document {
  userId: mongoose.Types.ObjectId;
  hospitalId: mongoose.Types.ObjectId;
  branchId?: mongoose.Types.ObjectId;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeen: Date;
  isTyping: {
    roomId?: mongoose.Types.ObjectId;
    timestamp: Date;
  };
  socketId?: string;
  updatedAt: Date;
}

const userStatusSchema = new Schema<IUserStatus>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: false // Made optional to support master_admin users
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'away', 'busy'],
    default: 'offline'
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  isTyping: {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom'
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  socketId: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
chatRoomSchema.index({ hospitalId: 1, participants: 1 });
chatRoomSchema.index({ roomId: 1 });
chatRoomSchema.index({ hospitalId: 1, type: 1 });

messageSchema.index({ roomId: 1, createdAt: -1 });
messageSchema.index({ messageId: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });

userStatusSchema.index({ userId: 1 }, { unique: true });
userStatusSchema.index({ hospitalId: 1, status: 1 });
userStatusSchema.index({ socketId: 1 });

// Pre-save middleware to generate IDs
chatRoomSchema.pre('save', function(next) {
  console.log('Pre-save middleware called for ChatRoom');
  console.log('Current roomId:', this.roomId);
  if (!this.roomId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.roomId = `ROOM-${timestamp}-${random}`;
    console.log('Generated roomId:', this.roomId);
  }
  next();
});

// Change from pre('save') to pre('validate') for messageId
messageSchema.pre('validate', function(next) {
  if (!this.messageId) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.messageId = `MSG-${timestamp}-${random}`;
  }
  next();
});

export const ChatRoom = mongoose.models.ChatRoom || mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);
export const Message = mongoose.models.Message || mongoose.model<IMessage>('Message', messageSchema);
export const UserStatus = mongoose.models.UserStatus || mongoose.model<IUserStatus>('UserStatus', userStatusSchema); 