import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';

const orderStatuses = ['Pending', 'Processing', 'Dispatched', 'Delivered', 'Completed', 'Cancelled'];
const paymentStatuses = ['Pending', 'Paid', 'Failed'];

export async function GET(request, { params }) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  await dbConnect();
  const { id } = await params;
  const order = await Order.findById(id).lean();
  if (!order) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
  return NextResponse.json({ success: true, data: order });
}

export async function PATCH(request, { params }) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });

  try {
    await dbConnect();
    const { id } = await params;
    const { paymentStatus, orderStatus } = await request.json();
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, error: 'Order not found.' }, { status: 404 });
    if (paymentStatus !== undefined && !paymentStatuses.includes(paymentStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid payment status.' }, { status: 400 });
    }
    if (orderStatus !== undefined && !orderStatuses.includes(orderStatus)) {
      return NextResponse.json({ success: false, error: 'Invalid order status.' }, { status: 400 });
    }
    const confirmedPayment = orderStatus === 'Completed' && order.paymentMethod === 'COD' ? 'Paid' : paymentStatus || order.paymentStatus;
    if (orderStatus === 'Dispatched' && confirmedPayment !== 'Paid') {
      return NextResponse.json({ success: false, error: 'Confirm successful payment before dispatching this order.' }, { status: 409 });
    }
    if (orderStatus === 'Completed' && confirmedPayment !== 'Paid') {
      return NextResponse.json({ success: false, error: 'Confirm successful payment before completing this order.' }, { status: 409 });
    }

    const changes = [];
    if (confirmedPayment !== order.paymentStatus) {
      changes.push(`payment ${order.paymentStatus} -> ${confirmedPayment}`);
      order.paymentStatus = confirmedPayment;
      order.paidAt = confirmedPayment === 'Paid' ? new Date() : undefined;
    }
    if (orderStatus && orderStatus !== order.orderStatus) {
      changes.push(`status ${order.orderStatus} -> ${orderStatus}`);
      order.orderStatus = orderStatus;
    }
    if (!changes.length) return NextResponse.json({ success: true, data: order });
    await order.save();
    await recordActivity({ actor: admin, actorType: 'Admin', action: 'updated_order', entityType: 'Order', entityId: order._id, description: `${admin.name} updated order ${order.orderNumber}: ${changes.join('; ')}.` });
    return NextResponse.json({ success: true, data: order });
  } catch (error) {
    console.error('Order update failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to update order.' }, { status: 500 });
  }
}