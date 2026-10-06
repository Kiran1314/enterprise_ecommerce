import mongoose from 'mongoose';

const ActivityLogSchema = new mongoose.Schema({
  actorType: { type: String, enum: ['Admin', 'Customer', 'System'], required: true },
  actorId: { type: mongoose.Schema.Types.ObjectId, default: null },
  actorName: { type: String, required: true },
  actorEmail: { type: String, default: '' },
  action: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: String, default: '' },
  description: { type: String, required: true }
}, { timestamps: true });

ActivityLogSchema.index({ createdAt: -1 });

export default mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);