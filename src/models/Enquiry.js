import mongoose from 'mongoose';

const EnquirySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  email: { type: String, default: '', trim: true, lowercase: true, maxlength: 254 },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productTitle: { type: String, required: true, trim: true },
  productSlug: { type: String, required: true, trim: true },
  sku: { type: String, default: '', trim: true },
  message: { type: String, required: true },
  status: { type: String, default: 'Pending', trim: true, maxlength: 500 },
  emailSent: { type: Boolean, default: false }
}, { timestamps: true });

EnquirySchema.index({ createdAt: -1 });

export default mongoose.models.Enquiry || mongoose.model('Enquiry', EnquirySchema);
