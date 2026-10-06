import mongoose from 'mongoose';

const GoogleReviewSchema = new mongoose.Schema({
  authorName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  profilePhotoUrl: { type: String },
  isDemo: { type: Boolean, default: false },
  isDisplayed: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.models.GoogleReview || mongoose.model('GoogleReview', GoogleReviewSchema);