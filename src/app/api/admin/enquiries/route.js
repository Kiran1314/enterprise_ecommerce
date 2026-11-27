import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import Enquiry from '@/models/Enquiry';
import { getEnquiryStatuses } from '@/lib/getEnquiryStatuses';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    if (admin.role !== 'SuperAdmin' && !admin.navigationLinks?.includes('enquiries')) {
      return NextResponse.json({ success: false, error: 'Enquiry access required.' }, { status: 403 });
    }

    const searchParams = new URL(request.url).searchParams;
    const requestedPage = Number.parseInt(searchParams.get('page') || '1', 10);
    const page = Number.isFinite(requestedPage) ? Math.max(1, requestedPage) : 1;
    const requestedLimit = Number.parseInt(searchParams.get('limit') || '10', 10);
    const limit = [10, 25, 50].includes(requestedLimit) ? requestedLimit : 10;
    const search = (searchParams.get('search') || '').trim().slice(0, 100);
    const requestedStatus = (searchParams.get('status') || '').trim();

    await dbConnect();
    const statuses = await getEnquiryStatuses();
    if (requestedStatus && !statuses.some(status => status.label === requestedStatus)) {
      return NextResponse.json({ success: false, error: 'Select a valid enquiry status.' }, { status: 400 });
    }

    const searchFilter = search
      ? { $or: ['name', 'phone', 'email', 'productTitle', 'sku', 'status'].map(field => ({ [field]: new RegExp(escapeRegex(search), 'i') })) }
      : null;
    const filters = searchFilter ? [searchFilter] : [];
    if (requestedStatus === 'Pending') {
      filters.push({
        $or: [
          { status: new RegExp(`^${escapeRegex(requestedStatus)}$`, 'i') },
          { status: '' },
          { status: null }
        ]
      });
    } else if (requestedStatus) {
      filters.push({ status: new RegExp(`^${escapeRegex(requestedStatus)}$`, 'i') });
    }
    const filter = filters.length > 1 ? { $and: filters } : filters[0] || {};
    const statusCountsFilter = searchFilter ? [{ $match: searchFilter }] : [];
    const [enquiries, total, statusGroups] = await Promise.all([
      Enquiry.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Enquiry.countDocuments(filter),
      Enquiry.aggregate([
        ...statusCountsFilter,
        {
          $group: {
            _id: {
              $cond: [
                { $eq: [{ $ifNull: ['$status', ''] }, ''] },
                'Pending',
                '$status'
              ]
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);
    const statusCounts = Object.fromEntries(statuses.map(status => [status.label, 0]));
    statusGroups.forEach(group => {
      const label = statuses.find(status => status.label.toLowerCase() === String(group._id).toLowerCase())?.label || group._id;
      statusCounts[label] = (statusCounts[label] || 0) + group.count;
    });
    const normalizedEnquiries = enquiries.map(enquiry => ({
      ...enquiry,
      status: statuses.find(status => status.label.toLowerCase() === String(enquiry.status || 'Pending').toLowerCase())?.label
        || enquiry.status
        || 'Pending'
    }));

    return NextResponse.json({
      success: true,
      data: { enquiries: normalizedEnquiries, total, page, limit, statuses, statusCounts }
    }, { status: 200 });
  } catch (error) {
    console.error('Admin enquiry list failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not load enquiries.' }, { status: 500 });
  }
}
