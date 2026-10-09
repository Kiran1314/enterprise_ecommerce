import mongoose from 'mongoose';

const AttributeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['select', 'radio', 'button', 'text', 'image'], default: 'text' }
}, { _id: false });

const SubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true },
  icon: { type: String },
  description: { type: String },
  attributes: [AttributeSchema]
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: { type: String },
  description: { type: String },
  isFeatured: { type: Boolean, default: false }, // Added to support the featured categories fetch
  attributes: [AttributeSchema],
  subcategories: [SubCategorySchema]
}, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);
export default Category;