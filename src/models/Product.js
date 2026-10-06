import mongoose from 'mongoose';

const ProductHighlightSchema = new mongoose.Schema({
  mainHeading: { type: String, required: true },
  items: [{
    heading: { type: String, required: true },
    description: { type: String, required: true }
  }]
});

const ProductFitmentSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  year: { type: String, required: true, trim: true },
  stock: { type: Number, default: 0, min: 0 },
  isDemo: { type: Boolean, default: false }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true, index: true },
  slug: { type: String, required: true, unique: true },
  sku: { type: String, required: true, unique: true, index: true },
  description: { type: String, required: true },
  price: { type: Number, default: 0, index: true },
  offerPrice: { type: Number },
  comparePrice: { type: Number },
  stock: { type: Number, required: true, default: 0 },
  images: [{ type: String }],
  brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', required: true, index: true },
  categories: [{ type: String, index: true }],
  fitments: [ProductFitmentSchema],
  isDemoData: { type: Boolean, default: false, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
  hasInquiry: { type: Boolean, default: false, index: true },
  whatsappNumber: { type: String },
  customTags: [{
    label: { type: String, required: true },
    bgColor: { type: String, default: '#6600cc' }
  }],
  attributes: [{
    key: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'select', 'radio', 'button'], default: 'text' },
    options: [{
      label: { type: String, required: true }, // e.g., "Dark Green" or "S"
      image: { type: String }, // Swatch Thumbnail URL
      variationImages: [{ type: String }], // Variation Image URLs
      stock: { type: Number, default: 0 } // Stock quantity for this specific variation
    }],
    value: { type: String, required: true } // Default selected option label
  }],
  highlights: [ProductHighlightSchema]
}, { timestamps: true });

const cachedProductModel = mongoose.models.Product;
const cachedFitmentStockPath = cachedProductModel?.schema.path('fitments')?.schema?.path('stock');

if (cachedProductModel && !cachedFitmentStockPath) {
  delete mongoose.models.Product;
}

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);