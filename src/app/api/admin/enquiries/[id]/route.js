import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';
import { getEnquiryStatuses } from '@/lib/getEnquiryStatuses';
import Enquiry from '@/models/Enquiry';

export async function PATCH(request, { params }) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    if (admin.role !== 'SuperAdmin' && !admin.navigationLinks?.includes('enquiries')) {
      return NextResponse.json({ success: false, error: 'Enquiry access required.' }, { status: 403 });
    }

    const body = await request.json();
    if (typeof body?.status !== 'string' || body.status.trim().length > 60) {
      return NextResponse.json({ success: false, error: 'Select a valid enquiry status.' }, { status: 400 });
    }

    const { id } = await params;
    if (!/^[a-f\d]{24}$/i.test(id)) {
      return NextResponse.json({ success: false, error: 'Invalid enquiry ID.' }, { status: 400 });
    }

    await dbConnect();
    const statuses = await getEnquiryStatuses();
    if (!statuses.some(status => status.label === body.status.trim())) {
      return NextResponse.json({ success: false, error: 'Select a valid enquiry status.' }, { status: 400 });
    }
    const enquiry = await Enquiry.findByIdAndUpdate(
      id,
      { status: body.status.trim() },
      { new: true, runValidators: true }
    );
    if (!enquiry) return NextResponse.json({ success: false, error: 'Enquiry not found.' }, { status: 404 });

    await recordActivity({
      actor: admin,
      actorType: 'Admin',
      action: 'updated_status',
      entityType: 'ProductEnquiry',
      entityId: enquiry._id,
      description: `${admin.name} updated the enquiry status for ${enquiry.productTitle}.`
    });

    return NextResponse.json({ success: true, data: enquiry }, { status: 200 });
  } catch (error) {
    console.error('Enquiry status update failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not update enquiry status.' }, { status: 500 });
  }
}
