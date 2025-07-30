import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema({
  startTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/  // HH:mm format
  },
  endTime: {
    type: String,
    required: true,
    match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/  // HH:mm format
  },
  hoursAvailable: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  tokenCount: {
    type: Number,
    required: true,
    default: 10,
    min: 1
  },
  bookedTokens: {
    type: [Number],
    default: []
  }
});

const doctorAvailabilitySchema = new mongoose.Schema({
  doctorId: {
    type: String,
    required: true
  },
  dayOfWeek: {
    type: Number,
    required: true,
    min: 0,
    max: 6  // 0 = Sunday, 6 = Saturday
  },
  slots: [timeSlotSchema],
  isAvailable: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Track who added the availability
  addedBy: {
    userId: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'sub_admin', 'doctor']
    },
    name: {
      type: String,
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'doctoravailabilities',  // Specify the exact collection name
  toJSON: { getters: true },  // Enable getters when converting to JSON
  toObject: { getters: true }  // Enable getters when converting to object
});

// Prevent duplicate entries for same doctor and day by creating a unique compound index
doctorAvailabilitySchema.index(
  { doctorId: 1, dayOfWeek: 1 },
  { unique: true }
);

// Update the updatedAt field before saving
doctorAvailabilitySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const DoctorAvailability = mongoose.models.DoctorAvailability || mongoose.model('DoctorAvailability', doctorAvailabilitySchema); 