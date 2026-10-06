import nodemailer from 'nodemailer';
import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { decryptSetting } from '@/lib/settingsSecrets';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function renderOrder(order, companyName) {
  const items = order.items.map(item => `<tr><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(item.title)} × ${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${escapeHtml(order.currency)} ${(item.price * item.quantity).toFixed(2)}</td></tr>`).join('');
  const address = [order.shippingAddress.line1, order.shippingAddress.line2, order.shippingAddress.city, order.shippingAddress.region, order.shippingAddress.postalCode, order.shippingAddress.country].filter(Boolean).join(', ');
  const delivery = new Date(order.createdAt);
  delivery.setDate(delivery.getDate() + 1);
  return `<div style="font-family:Arial,sans-serif;color:#20252b;max-width:640px;margin:auto"><h2>${escapeHtml(companyName)}</h2><p>Order <strong>${escapeHtml(order.orderNumber)}</strong> has been placed.</p><p>Estimated delivery: <strong>${delivery.toLocaleDateString()}</strong> (within 1 day).</p><table style="width:100%;border-collapse:collapse">${items}<tr><td style="padding:10px 8px;font-weight:bold">Total</td><td style="padding:10px 8px;text-align:right;font-weight:bold">${escapeHtml(order.currency)} ${Number(order.totalAmount).toFixed(2)}</td></tr></table><p>Payment: ${escapeHtml(order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online payment')} (${escapeHtml(order.paymentStatus)})</p><p>Ship to: ${escapeHtml(address)}</p></div>`;
}

export async function sendOrderNotifications(order) {
  try {
    await dbConnect();
    const settings = await Settings.findOne().select('companyName companyEmail emailSettings').lean();
    const email = settings?.emailSettings || {};
    const host = email.smtpHost || process.env.SMTP_HOST;
    const user = email.smtpUser || process.env.SMTP_USER;
    const password = decryptSetting(email.smtpPassword) || process.env.SMTP_PASSWORD;
    const from = email.fromEmail || process.env.SMTP_FROM || user;
    const adminEmail = email.adminEmail || settings?.companyEmail || process.env.ORDER_ADMIN_EMAIL;
    if (!host || !from) return;

    const transporter = nodemailer.createTransport({
      host,
      port: Number(email.smtpPort || process.env.SMTP_PORT || 587),
      secure: email.smtpSecure ?? (process.env.SMTP_SECURE === 'true'),
      auth: user ? { user, pass: password } : undefined,
      connectionTimeout: 10000,
      socketTimeout: 10000
    });
    const html = renderOrder(order, settings?.companyName || 'Store');
    const messages = [{
      from,
      to: order.customer.email,
      subject: `Order ${order.orderNumber} received`,
      html
    }];
    if (adminEmail) messages.push({
      from,
      to: adminEmail,
      subject: `New order ${order.orderNumber}`,
      html: `<p>New order from ${escapeHtml(order.customer.name)} (${escapeHtml(order.customer.email)}).</p>${html}`
    });
    const results = await Promise.allSettled(messages.map(message => transporter.sendMail(message)));
    for (const result of results) {
      if (result.status === 'rejected') console.error('Order email could not be sent:', result.reason);
    }
  } catch (error) {
    console.error('Order email notification failed:', error);
  }
}