import mongoose, { Document } from 'mongoose';

export interface IUserDocument extends Document {
  email: string;
  password: string;
  role: 'doctor' | 'receptionist';
  firstName: string;
  lastName: string;
  specialization?: string;
  isActive: boolean;
  createdAt: Date;
}

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['doctor', 'receptionist'] },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  specialization: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', userSchema);
export default User; 