import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import GoogleReview from '@/models/GoogleReview';

export async function GET() {
  try {
    await dbConnect();
    const reviews = await GoogleReview.find({ isDisplayed: true, isDemo: { $ne: true } }).sort({ createdAt: -1 }).limit(6);
    return NextResponse.json({ success: true, data: reviews });
  } catch (error) {
    console.error('Error fetching customer reviews:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}