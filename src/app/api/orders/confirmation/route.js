import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('order');
    const token = searchParams.get('token') || '';
    if (!/^[a-f\d]{24}$/i.test(orderId || '') || !/^[a-f\d]{64}$/i.test(token)) {
      return NextResponse.json({ success: false, error: 'Order confirmation link is invalid.' }, { status: 400 });
    }
    await dbConnect();
    const order = await Order.findById(orderId).select('+confirmationTokenHash').lean();
    const suppliedHash = crypto.createHash('sha256').update(token).digest();
    const expectedHash = Buffer.from(order?.confirmationTokenHash || '', 'hex');
    if (!order || expectedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
      return NextResponse.json({ success: false, error: 'Order confirmation link is invalid or expired.' }, { status: 404 });
    }
    const { orderNumber, customer, shippingAddress, items, totalAmount, currency, paymentMethod, paymentGateway, paymentStatus, orderStatus, createdAt } = order;
    return NextResponse.json({ success: true, data: { orderNumber, customer, shippingAddress, items, totalAmount, currency, paymentMethod, paymentGateway, paymentStatus, orderStatus, createdAt } });
  } catch (error) {
    console.error('Order confirmation lookup failed:', error);
    return NextResponse.json({ success: false, error: 'Unable to load order confirmation.' }, { status: 500 });
  }
}