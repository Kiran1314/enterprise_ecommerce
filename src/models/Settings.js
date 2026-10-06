import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  currencySymbol: { type: String, default: '$' },
  currencyCode: { type: String, default: 'USD' },
  companyName: { type: String, default: 'Super RF Japan Auto Spare Parts Company' },
  companyEmail: { type: String, default: '' },
  companyPhone: { type: String, default: '+971 549912098' },
  companyAddress: { type: String, default: '21C Street, G Floor, 29733 96054, Naif, Deira, Dubai, Dubai Municipality, Show Entrance, UAE' },
  taxId: { type: String, default: '' },
  paymentSettings: {
    gateway: { type: String, default: 'auto' },
    region: { type: String, default: 'UAE' },
    stripeSecretKey: { type: String, default: '' },
    checkoutComSecretKey: { type: String, default: '' },
    checkoutComBaseUrl: { type: String, default: '' },
    networkInternationalApiKey: { type: String, default: '' },
    networkInternationalOutletId: { type: String, default: '' },
    networkInternationalApiUrl: { type: String, default: '' },
    razorpayKeyId: { type: String, default: '' },
    razorpayKeySecret: { type: String, default: '' },
    paypalClientId: { type: String, default: '' },
    paypalClientSecret: { type: String, default: '' },
    paypalEnvironment: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
    paypalSandboxUsername: { type: String, default: '' },
    paypalSandboxPassword: { type: String, default: '' }
  },
  emailSettings: {
    smtpHost: { type: String, default: '' },
    smtpPort: { type: Number, default: 587 },
    smtpSecure: { type: Boolean, default: false },
    smtpUser: { type: String, default: '' },
    smtpPassword: { type: String, default: '' },
    fromEmail: { type: String, default: '' },
    adminEmail: { type: String, default: '' }
  }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);