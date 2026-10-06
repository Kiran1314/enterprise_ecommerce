import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
  customer: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true }
  },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  shippingAddress: {
    line1: { type: String, required: true },
    line2: { type: String, default: '' },
    city: { type: String, required: true },
    region: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, required: true }
  },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  paymentMethod: { type: String, enum: ['COD', 'CARD'], default: 'COD' },
  paymentGateway: { type: String, default: '' },
  gatewayReference: { type: String, default: '' },
  gatewayCaptureReference: { type: String, default: '' },
  confirmationTokenHash: { type: String, default: '', select: false },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paidAt: { type: Date },
  orderStatus: { type: String, enum: ['Pending', 'Processing', 'Dispatched', 'Shipped', 'Delivered', 'Completed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);