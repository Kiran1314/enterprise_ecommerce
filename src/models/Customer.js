import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  line1: { type: String, required: true },
  line2: { type: String, default: '' },
  city: { type: String, required: true },
  region: { type: String, default: '' },
  postalCode: { type: String, default: '' },
  country: { type: String, required: true },
  isDefault: { type: Boolean, default: false }
});

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, default: '' },
  addresses: [AddressSchema]
}, { timestamps: true });

export default mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);