import mongoose from 'mongoose';

const StoreHighlightSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  sourceUrl: { type: String, required: true, trim: true },
  platform: { type: String, required: true, enum: ['Facebook', 'Instagram', 'TikTok'] },
  url: { type: String, default: '', trim: true },
  coverImage: { type: String, default: '', trim: true },
  thumbnailUrl: { type: String, default: '', trim: true },
  thumbnailCheckedAt: { type: Date, default: null },
  isPinned: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const existingModel = mongoose.models.StoreHighlight;
if (
  existingModel &&
  (!existingModel.schema.path('thumbnailUrl') ||
    !existingModel.schema.path('thumbnailCheckedAt') ||
    !existingModel.schema.path('isPinned'))
) {
  mongoose.deleteModel('StoreHighlight');
}

export default mongoose.models.StoreHighlight || mongoose.model('StoreHighlight', StoreHighlightSchema);