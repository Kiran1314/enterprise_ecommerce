import mongoose from 'mongoose';

const BrandSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  logo: { type: String },
  description: { type: String },
  isFeatured: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.models.Brand || mongoose.model('Brand', BrandSchema);