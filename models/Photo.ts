import mongoose from 'mongoose';

const photoSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  filename: {
    type: String,
    required: true,
  },
  originalName: {
    type: String,
    required: true,
  },
  mimeType: {
    type: String,
    required: true,
  },
  size: {
    type: Number,
    required: true,
  },
  gridfsId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Create indexes for efficient queries
photoSchema.index({ userId: 1 });
photoSchema.index({ uploadedAt: -1 });

export default mongoose.models.Photo || mongoose.model('Photo', photoSchema); 