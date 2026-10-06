import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ActivityLog from '@/models/ActivityLog';
import { getAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  await dbConnect();
  const logs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(100).lean();
  return NextResponse.json({ success: true, data: logs });
}