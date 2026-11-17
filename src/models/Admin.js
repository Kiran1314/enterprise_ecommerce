import mongoose from 'mongoose';

const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['SuperAdmin', 'ProductManager', 'OrderManager'], default: 'ProductManager' },
  navigationLinks: { type: [String], default: ['products'] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema);