import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { getAdmin } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';
import { recordActivity } from '@/lib/activity';

export async function PATCH(request, { params }) {
  const actor = await getAdmin(request);
  if (!actor) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  if (actor.role !== 'SuperAdmin') return NextResponse.json({ success: false, error: 'Super admin access required.' }, { status: 403 });
  try {
    await dbConnect();
    const { id } = await params;
    const user = await Admin.findById(id);
    if (!user) return NextResponse.json({ success: false, error: 'Admin user not found.' }, { status: 404 });
    const updates = await request.json();
    if (updates.role !== undefined && !['SuperAdmin', 'ProductManager', 'OrderManager'].includes(updates.role)) {
      return NextResponse.json({ success: false, error: 'Invalid admin role.' }, { status: 400 });
    }
    if (updates.isActive === false && user.role === 'SuperAdmin' && await Admin.countDocuments({ role: 'SuperAdmin', isActive: true }) < 2) {
      return NextResponse.json({ success: false, error: 'At least one active super admin must remain.' }, { status: 409 });
    }
    if (updates.name !== undefined) user.name = String(updates.name).trim();
    if (updates.email !== undefined) user.email = String(updates.email).trim().toLowerCase();
    if (updates.role !== undefined) user.role = updates.role;
    if (updates.isActive !== undefined) user.isActive = Boolean(updates.isActive);
    if (updates.password) {
      if (String(updates.password).length < 8) return NextResponse.json({ success: false, error: 'Password must be at least 8 characters.' }, { status: 400 });
      user.password = await hashPassword(updates.password);
    }
    await user.save();
    await recordActivity({ actor, actorType: 'Admin', action: 'updated_admin', entityType: 'Admin', entityId: user._id, description: `${actor.name} updated admin account ${user.email}.` });
    return NextResponse.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    return NextResponse.json({ success: false, error: status === 409 ? 'An admin with this email already exists.' : 'Unable to update admin.' }, { status });
  }
}