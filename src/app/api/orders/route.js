import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import Product from '@/models/Product';
import Order from '@/models/Order';
import Settings from '@/models/Settings';
import Customer from '@/models/Customer';
import { getSession } from '@/lib/auth';
import { getAdmin } from '@/lib/adminAuth';
import { recordActivity } from '@/lib/activity';
import { createPaymentSession } from '@/lib/payments';
import { getProductPricing } from '@/lib/productPricing';
import { sendOrderNotifications } from '@/lib/orderEmails';

export async function GET(request) {
  const admin = await getAdmin(request);
  if (!admin) return NextResponse.json({ success: false, error: 'Admin sign-in required.' }, { status: 401 });
  const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ success: true, data: orders });
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    const { items, customer, shippingAddress, paymentMethod = 'COD' } = body;
    if (!Array.isArray(items) || items.length === 0 || !customer?.name?.trim() || !customer?.email?.trim() || !customer?.phone?.trim() || !shippingAddress?.line1?.trim() || !shippingAddress?.city?.trim() || !shippingAddress?.country?.trim() || !['COD', 'CARD'].includes(paymentMethod)) {
      return NextResponse.json({ success: false, error: 'Complete the contact, shipping, and payment details before placing your order.' }, { status: 400 });
    }

    const orderItems = [];
    const inventory = [];
    for (const item of items) {
      const productId = item.productId || item._id;
      const quantity = Number(item.quantity);
      if (!productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
        return NextResponse.json({ success: false, error: 'One or more cart items are invalid.' }, { status: 400 });
      }
      const product = await Product.findById(productId);
      if (!product) return NextResponse.json({ success: false, error: 'A product in your cart is no longer available.' }, { status: 409 });
      const price = getProductPricing(product).displayPrice;
      if (!Number.isFinite(price) || price <= 0) {
        return NextResponse.json({ success: false, error: `${product.title} requires a quote and cannot be checked out online.` }, { status: 400 });
      }
      let inventoryFitmentIndex = -1;
      if (product.fitments?.length) {
        const selectedFitment = item.fitment;
        if (!selectedFitment?.make || !selectedFitment?.model || !selectedFitment?.year) {
          return NextResponse.json({ success: false, error: `Select a vehicle compatibility for ${product.title}.` }, { status: 400 });
        }
        inventoryFitmentIndex = product.fitments.findIndex(fitment =>
          fitment.make === selectedFitment.make && fitment.model === selectedFitment.model && fitment.year === selectedFitment.year
        );
        if (inventoryFitmentIndex < 0) {
          return NextResponse.json({ success: false, error: `The selected vehicle compatibility for ${product.title} is no longer available.` }, { status: 409 });
        }
        const fitment = product.fitments[inventoryFitmentIndex];
        if (fitment.stock < quantity) {
          return NextResponse.json({ success: false, error: `${product.title} has only ${fitment.stock} available for ${fitment.make} ${fitment.model} ${fitment.year}.` }, { status: 409 });
        }
      } else if (product.stock < quantity) {
        return NextResponse.json({ success: false, error: `${product.title} does not have enough stock.` }, { status: 409 });
      }
      const fitment = inventoryFitmentIndex >= 0 ? product.fitments[inventoryFitmentIndex] : null;
      const fitmentTitle = fitment ? ` (${fitment.make} ${fitment.model} ${fitment.year})` : '';
      orderItems.push({ product: product._id, title: `${product.title}${fitmentTitle}`, quantity, price });
      inventory.push({ product, quantity, fitmentIndex: inventoryFitmentIndex });
    }

    const settings = await Settings.findOne().lean();
    const session = getSession(request, 'customer');
    const customerAccount = session ? await Customer.findById(session.id).select('_id') : null;
    const orderNumber = `SJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const confirmationToken = crypto.randomBytes(32).toString('hex');
    const order = await Order.create({
      orderNumber,
      confirmationTokenHash: crypto.createHash('sha256').update(confirmationToken).digest('hex'),
      customerId: customerAccount?._id || null,
      customer: { name: customer.name.trim(), email: customer.email.trim().toLowerCase(), phone: customer.phone.trim(), address: [shippingAddress.line1, shippingAddress.line2, shippingAddress.city, shippingAddress.region, shippingAddress.postalCode, shippingAddress.country].filter(Boolean).join(', ') },
      shippingAddress,
      items: orderItems,
      totalAmount: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      currency: (settings?.currencyCode || 'USD').toUpperCase(),
      paymentMethod,
      paymentStatus: 'Pending',
      orderStatus: 'Pending'
    });

    let paymentUrl = '';
    if (paymentMethod === 'CARD') {
      try {
        const payment = await createPaymentSession(order, confirmationToken);
        order.paymentGateway = payment.provider;
        order.gatewayReference = payment.reference;
        await order.save();
        paymentUrl = payment.url;
      } catch (error) {
        await Order.findByIdAndDelete(order._id);
        return NextResponse.json({ success: false, error: error.message || 'Card payment is unavailable.' }, { status: 503 });
      }
    }

    for (const { product, quantity, fitmentIndex } of inventory) {
      if (fitmentIndex >= 0) product.fitments[fitmentIndex].stock -= quantity;
      else product.stock -= quantity;
      await product.save();
    }
    await recordActivity({ actor: customerAccount, actorType: 'Customer', action: 'placed_order', entityType: 'Order', entityId: order._id, description: `${customer.name.trim()} placed order ${order.orderNumber}.` });
    await sendOrderNotifications(order);
    const orderData = order.toObject();
    delete orderData.confirmationTokenHash;
    return NextResponse.json({ success: true, data: { order: orderData, paymentUrl, confirmationToken } }, { status: 201 });
  } catch (error) {
    console.error('Error placing order & updating stock:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}