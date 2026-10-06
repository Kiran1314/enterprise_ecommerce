import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Admin from '@/models/Admin';
import { getAdmin } from '@/lib/adminAuth';
import { hashPassword } from '@/lib/auth';
import { recordActivity } from '@/lib/activity';

const roles = ['SuperAdmin', 'ProductManager', 'OrderManager'];

export async function GET(request) {
  const actor = await getAdmin(request);
  if (!actor) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  if (actor.role !== 'SuperAdmin') return NextResponse.json({ success: false, error: 'Super admin access required.' }, { status: 403 });
  await dbConnect();
  const users = await Admin.find({}).select('name email role isActive createdAt').sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: users });
}

export async function POST(request) {
  const actor = await getAdmin(request);
  if (!actor) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  if (actor.role !== 'SuperAdmin') return NextResponse.json({ success: false, error: 'Super admin access required.' }, { status: 403 });
  try {
    const { name, email, password, role = 'ProductManager' } = await request.json();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || String(password || '').length < 8 || !roles.includes(role)) {
      return NextResponse.json({ success: false, error: 'Enter a name, valid email, password of at least 8 characters, and valid role.' }, { status: 400 });
    }
    await dbConnect();
    const user = await Admin.create({ name: name.trim(), email: normalizedEmail, password: await hashPassword(password), role, isActive: true });
    await recordActivity({ actor, actorType: 'Admin', action: 'created_admin', entityType: 'Admin', entityId: user._id, description: `${actor.name} created admin account ${user.email} (${role}).` });
    return NextResponse.json({ success: true, data: { _id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } }, { status: 201 });
  } catch (error) {
    const status = error.code === 11000 ? 409 : 500;
    return NextResponse.json({ success: false, error: status === 409 ? 'An admin with this email already exists.' : 'Unable to create admin.' }, { status });
  }
}