import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  bio: {
    type: String,
    trim: true,
  },
  faceDescriptors: {
    type: [[Number]],
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create index for face recognition queries
userSchema.index({ faceDescriptors: 1 });

export default mongoose.models.User || mongoose.model('User', userSchema); 