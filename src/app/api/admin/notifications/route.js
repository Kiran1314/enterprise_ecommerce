import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import ActivityLog from '@/models/ActivityLog';
import Enquiry from '@/models/Enquiry';
import { getEnquiryStatuses } from '@/lib/getEnquiryStatuses';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

    const sinceValue = new URL(request.url).searchParams.get('since');
    const since = sinceValue ? new Date(sinceValue) : null;
    if (!since || Number.isNaN(since.getTime())) {
      return NextResponse.json({ success: false, error: 'A valid notification cursor is required.' }, { status: 400 });
    }

    await dbConnect();
    const count = await ActivityLog.countDocuments({
      $or: [
        { entityType: 'Product' },
        { entityType: 'ProductEnquiry', action: 'created' }
      ],
      createdAt: { $gt: since }
    });
    let newEnquiriesCount = 0;
    if (admin.role === 'SuperAdmin' || admin.navigationLinks?.includes('enquiries')) {
      const statuses = await getEnquiryStatuses();
      const newStatus = statuses[0]?.label;
      if (newStatus) {
        const statusMatch = { status: new RegExp(`^${escapeRegex(newStatus)}$`, 'i') };
        const filter = /^pending$/i.test(newStatus)
          ? { $or: [statusMatch, { status: '' }, { status: null }] }
          : statusMatch;
        newEnquiriesCount = await Enquiry.countDocuments(filter);
      }
    }

    return NextResponse.json({ success: true, data: { count, newEnquiriesCount } }, { status: 200 });
  } catch (error) {
    console.error('Error fetching admin notifications:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not load notifications.' }, { status: 500 });
  }
}
