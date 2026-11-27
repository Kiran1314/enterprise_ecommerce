import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { getAdmin } from '@/lib/adminAuth';
import { getEnquiryStatuses } from '@/lib/getEnquiryStatuses';
import Enquiry from '@/models/Enquiry';
import Settings from '@/models/Settings';

async function authorize(request) {
  const admin = await getAdmin(request);
  if (!admin) return { error: NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 }) };
  if (admin.role !== 'SuperAdmin' && !admin.navigationLinks?.includes('enquiries')) {
    return { error: NextResponse.json({ success: false, error: 'Enquiry access required.' }, { status: 403 }) };
  }
  return { admin };
}

function validateStatusInput(body) {
  const label = typeof body?.label === 'string' ? body.label.trim() : '';
  const color = typeof body?.color === 'string' ? body.color.trim().toLowerCase() : '';
  if (!label || label.length > 60 || !/^#[a-f\d]{6}$/i.test(color)) {
    return { error: 'Enter a status name (up to 60 characters) and a valid color.' };
  }
  return { label, color };
}

async function saveStatuses(statuses) {
  const settings = await Settings.findOne() || await Settings.create({});
  settings.enquiryStatuses = statuses;
  await settings.save();
}

function getStatusEnquiryFilter(label) {
  const statusFilter = { status: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') };
  return label.toLowerCase() === 'pending'
    ? { $or: [statusFilter, { status: '' }, { status: null }] }
    : statusFilter;
}

export async function POST(request) {
  try {
    const { error: authError } = await authorize(request);
    if (authError) return authError;
    const input = validateStatusInput(await request.json());
    if (input.error) return NextResponse.json({ success: false, error: input.error }, { status: 400 });

    await dbConnect();
    const statuses = await getEnquiryStatuses();
    if (statuses.some(status => status.label.toLowerCase() === input.label.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'A status with that name already exists.' }, { status: 409 });
    }
    if (statuses.some(status => status.color.toLowerCase() === input.color)) {
      return NextResponse.json({ success: false, error: 'Choose a color that is not already assigned to another status.' }, { status: 409 });
    }

    await saveStatuses([...statuses, { label: input.label, color: input.color }]);
    return NextResponse.json({ success: true, data: { label: input.label, color: input.color } }, { status: 201 });
  } catch (error) {
    console.error('Custom enquiry status creation failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not add custom status.' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { error: authError } = await authorize(request);
    if (authError) return authError;
    const body = await request.json();
    const oldLabel = typeof body?.oldLabel === 'string' ? body.oldLabel.trim() : '';
    const input = validateStatusInput(body);
    if (!oldLabel || input.error) {
      return NextResponse.json({ success: false, error: input.error || 'Select the status to edit.' }, { status: 400 });
    }

    await dbConnect();
    const statuses = await getEnquiryStatuses();
    const oldStatus = statuses.find(status => status.label === oldLabel);
    if (!oldStatus) return NextResponse.json({ success: false, error: 'Status not found.' }, { status: 404 });
    if (statuses.some(status => status.label !== oldLabel && status.label.toLowerCase() === input.label.toLowerCase())) {
      return NextResponse.json({ success: false, error: 'A status with that name already exists.' }, { status: 409 });
    }
    if (statuses.some(status => status.label !== oldLabel && status.color.toLowerCase() === input.color)) {
      return NextResponse.json({ success: false, error: 'Choose a color that is not already assigned to another status.' }, { status: 409 });
    }

    const updatedStatuses = statuses.map(status => status.label === oldLabel ? input : status);
    if (oldLabel !== input.label) {
      await Enquiry.updateMany(getStatusEnquiryFilter(oldLabel), { $set: { status: input.label } });
    }
    await saveStatuses(updatedStatuses);
    return NextResponse.json({ success: true, data: input });
  } catch (error) {
    console.error('Enquiry status update failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not update status.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { error: authError } = await authorize(request);
    if (authError) return authError;
    const body = await request.json();
    const label = typeof body?.label === 'string' ? body.label.trim() : '';
    if (!label) return NextResponse.json({ success: false, error: 'Select the status to delete.' }, { status: 400 });

    await dbConnect();
    const statuses = await getEnquiryStatuses();
    const statusToDelete = statuses.find(status => status.label === label);
    if (!statusToDelete) return NextResponse.json({ success: false, error: 'Status not found.' }, { status: 404 });
    const remainingStatuses = statuses.filter(status => status.label !== label);
    if (!remainingStatuses.length) {
      return NextResponse.json({ success: false, error: 'At least one enquiry status must remain.' }, { status: 409 });
    }

    await Enquiry.updateMany(getStatusEnquiryFilter(label), { $set: { status: remainingStatuses[0].label } });
    await saveStatuses(remainingStatuses);
    return NextResponse.json({
      success: true,
      data: { deleted: label, reassignedTo: remainingStatuses[0].label }
    });
  } catch (error) {
    console.error('Enquiry status deletion failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Could not delete status.' }, { status: 500 });
  }
}
