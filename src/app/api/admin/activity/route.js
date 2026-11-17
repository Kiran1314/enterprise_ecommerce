import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ActivityLog from '@/models/ActivityLog';
import { getAdmin } from '@/lib/adminAuth';

export async function GET(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    await dbConnect();

    const url = new URL(request.url);
    const requestedDate = url.searchParams.get('date');
    const requestedPage = Number.parseInt(url.searchParams.get('page') || '1', 10);
    if (!Number.isInteger(requestedPage) || requestedPage < 1) {
      return NextResponse.json({ success: false, error: 'Page must be a positive integer.' }, { status: 400 });
    }

    const dates = await ActivityLog.aggregate([
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } } } },
      { $sort: { _id: -1 } }
    ]).then(results => results.map(result => result._id));
    const selectedDate = requestedDate || dates[0] || null;
    if (selectedDate && !/^\d{4}-\d{2}-\d{2}$/.test(selectedDate)) {
      return NextResponse.json({ success: false, error: 'Date must use YYYY-MM-DD format.' }, { status: 400 });
    }
    if (selectedDate && !dates.includes(selectedDate)) {
      return NextResponse.json({ success: false, error: 'No activity found for the selected date.' }, { status: 404 });
    }

    const dateStart = selectedDate ? new Date(`${selectedDate}T00:00:00.000Z`) : null;
    const filter = selectedDate ? {
      createdAt: {
        $gte: dateStart,
        $lt: new Date(dateStart.getTime() + 24 * 60 * 60 * 1000)
      }
    } : {};

    const pageSize = 10;
    const total = await ActivityLog.countDocuments(filter);
    const totalPages = Math.ceil(total / pageSize);
    const page = totalPages ? Math.min(requestedPage, totalPages) : 1;
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return NextResponse.json({
      success: true,
      data: logs,
      dates,
      selectedDate,
      pagination: { page, pageSize, total, totalPages }
    });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}