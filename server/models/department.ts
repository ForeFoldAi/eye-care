import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  headOfDepartment: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  staff: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

departmentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Department = mongoose.model('Department', departmentSchema); 