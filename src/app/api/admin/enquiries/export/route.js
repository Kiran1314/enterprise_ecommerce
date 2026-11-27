import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import Enquiry from '@/models/Enquiry';

export const runtime = 'nodejs';

function getReportDateRange(searchParams) {
  const period = searchParams.get('period') || 'all';
  if (period === 'all') return { filter: {}, suffix: 'all-time' };

  if (period === 'custom') {
    const from = searchParams.get('from') || '';
    const to = searchParams.get('to') || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      throw new Error('Choose a valid start and end date.');
    }
    const start = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start.toISOString().slice(0, 10) !== from || end.toISOString().slice(0, 10) !== to || start > end) {
      throw new Error('Choose a valid date range with the start date on or before the end date.');
    }
    end.setUTCDate(end.getUTCDate() + 1);
    return { filter: { createdAt: { $gte: start, $lt: end } }, suffix: `${from}-to-${to}` };
  }

  if (period === 'month') {
    const month = searchParams.get('month') || '';
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
    if (!match) throw new Error('Choose a valid month.');
    const year = Number(match[1]);
    const monthNumber = Number(match[2]);
    return {
      filter: { createdAt: { $gte: new Date(Date.UTC(year, monthNumber - 1, 1)), $lt: new Date(Date.UTC(year, monthNumber, 1)) } },
      suffix: month
    };
  }

  if (period === 'year') {
    const year = searchParams.get('year') || '';
    if (!/^\d{4}$/.test(year)) throw new Error('Choose a valid year.');
    const yearNumber = Number(year);
    return {
      filter: { createdAt: { $gte: new Date(Date.UTC(yearNumber, 0, 1)), $lt: new Date(Date.UTC(yearNumber + 1, 0, 1)) } },
      suffix: year
    };
  }

  throw new Error('Choose a supported report period.');
}

export async function GET(request) {
  try {
    const admin = await getAdmin(request);
    if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
    if (admin.role !== 'SuperAdmin' && !admin.navigationLinks?.includes('enquiries')) {
      return NextResponse.json({ success: false, error: 'Enquiry access required.' }, { status: 403 });
    }

    const { filter, suffix } = getReportDateRange(new URL(request.url).searchParams);
    await dbConnect();
    const enquiries = await Enquiry.find(filter).sort({ createdAt: -1 }).lean();
    const rows = enquiries.map(enquiry => ({
      'Enquiry ID': String(enquiry._id),
      'Received At': enquiry.createdAt ? new Date(enquiry.createdAt).toISOString() : '',
      'Customer Name': enquiry.name || '',
      'Phone Number': enquiry.phone || '',
      'Email Address': enquiry.email || '',
      'Product Title': enquiry.productTitle || '',
      'Product Slug': enquiry.productSlug || '',
      'SKU': enquiry.sku || '',
      'Product ID': enquiry.product ? String(enquiry.product) : '',
      'Status': enquiry.status || 'Pending',
      'Enquiry Message': enquiry.message || '',
      'Notification Email Sent': enquiry.emailSent ? 'Yes' : 'No',
      'Last Updated': enquiry.updatedAt ? new Date(enquiry.updatedAt).toISOString() : ''
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows, {
      header: [
        'Enquiry ID', 'Received At', 'Customer Name', 'Phone Number', 'Email Address',
        'Product Title', 'Product Slug', 'SKU', 'Product ID', 'Status',
        'Enquiry Message', 'Notification Email Sent', 'Last Updated'
      ]
    });
    worksheet['!cols'] = [
      { wch: 26 }, { wch: 24 }, { wch: 24 }, { wch: 20 }, { wch: 30 },
      { wch: 36 }, { wch: 34 }, { wch: 20 }, { wch: 26 }, { wch: 24 },
      { wch: 70 }, { wch: 24 }, { wch: 24 }
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Product Enquiries');
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });
    const filename = `product-enquiries-${suffix}.xlsx`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error) {
    const status = error instanceof Error && error.message.startsWith('Choose ') ? 400 : 500;
    if (status === 500) console.error('Enquiry report export failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not export enquiries.' }, { status });
  }
}
