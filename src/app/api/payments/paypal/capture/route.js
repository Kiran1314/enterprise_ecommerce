import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Order from '@/models/Order';
import { capturePayPalOrder } from '@/lib/payments';
import { recordActivity } from '@/lib/activity';

export async function POST(request) {
  try {
    const { orderId, paypalOrderId, confirmationToken } = await request.json();
    if (!/^[a-f\d]{24}$/i.test(orderId || '') || !/^[A-Z0-9-]{10,64}$/i.test(paypalOrderId || '') || !/^[a-f\d]{64}$/i.test(confirmationToken || '')) {
      return NextResponse.json({ success: false, error: 'PayPal return details are invalid.' }, { status: 400 });
    }

    await dbConnect();
    const order = await Order.findById(orderId).select('+confirmationTokenHash');
    const suppliedHash = crypto.createHash('sha256').update(confirmationToken).digest();
    const expectedHash = Buffer.from(order?.confirmationTokenHash || '', 'hex');
    if (!order || expectedHash.length !== suppliedHash.length || !crypto.timingSafeEqual(expectedHash, suppliedHash)) {
      return NextResponse.json({ success: false, error: 'Order confirmation is invalid.' }, { status: 404 });
    }
    if (order.paymentMethod !== 'CARD' || order.paymentGateway !== 'paypal' || order.gatewayReference !== paypalOrderId) {
      return NextResponse.json({ success: false, error: 'PayPal order does not match this checkout.' }, { status: 409 });
    }
    if (order.paymentStatus === 'Paid') {
      return NextResponse.json({ success: true, data: { paymentStatus: 'Paid' } });
    }

    const captureData = await capturePayPalOrder(paypalOrderId, `capture-${order._id}`);
    const purchaseUnit = captureData.purchase_units?.find(item => item.custom_id === String(order._id) && item.reference_id === order.orderNumber);
    const capture = purchaseUnit?.payments?.captures?.find(item => item.status === 'COMPLETED');
    const capturedAmount = Number(capture?.amount?.value);
    const amountMatches = Number.isFinite(capturedAmount) && capturedAmount === Number(order.totalAmount.toFixed(2));
    const currencyMatches = capture?.amount?.currency_code === order.currency;
    if (captureData.id !== paypalOrderId || captureData.status !== 'COMPLETED' || !capture || !amountMatches || !currencyMatches) {
      console.error('PayPal capture does not match order:', order.orderNumber, captureData.id);
      return NextResponse.json({ success: false, error: 'PayPal did not confirm the expected order amount and currency.' }, { status: 409 });
    }

    order.paymentStatus = 'Paid';
    order.paidAt = new Date();
    order.gatewayCaptureReference = capture.id || '';
    await order.save();
    await recordActivity({ actorType: 'System', action: 'captured_payment', entityType: 'Order', entityId: order._id, description: `PayPal captured payment for order ${order.orderNumber}.` });
    return NextResponse.json({ success: true, data: { paymentStatus: order.paymentStatus } });
  } catch (error) {
    console.error('PayPal capture failed:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to confirm PayPal payment.' }, { status: 502 });
  }
}