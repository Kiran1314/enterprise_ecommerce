import nodemailer from 'nodemailer';
import Settings from '@/models/Settings';
import { decryptSetting } from '@/lib/settingsSecrets';

const ENQUIRY_RECIPIENT = 'Saleemkhan02017@gmail.com';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

export async function sendProductEnquiryEmail(enquiry) {
  const settings = await Settings.findOne().select('emailSettings').lean();
  const email = settings?.emailSettings || {};
  const host = email.smtpHost || process.env.SMTP_HOST;
  const user = email.smtpUser || process.env.SMTP_USER;
  const password = decryptSetting(email.smtpPassword) || process.env.SMTP_PASSWORD;
  const from = email.fromEmail || process.env.SMTP_FROM || user;
  if (!host || !from) throw new Error('Email notifications are not configured.');

  const transporter = nodemailer.createTransport({
    host,
    port: Number(email.smtpPort || process.env.SMTP_PORT || 587),
    secure: email.smtpSecure ?? (process.env.SMTP_SECURE === 'true'),
    auth: user ? { user, pass: password } : undefined,
    connectionTimeout: 10000,
    socketTimeout: 10000
  });

  const details = [
    `Name: ${enquiry.name}`,
    `Phone: ${enquiry.phone}`,
    enquiry.email ? `Email: ${enquiry.email}` : '',
    `Product: ${enquiry.productTitle}`,
    `SKU: ${enquiry.sku || 'Not provided'}`,
    '',
    'WhatsApp message:',
    enquiry.message
  ].filter(Boolean).join('\n');
  const html = `<div style="font-family:Arial,sans-serif;color:#20252b"><h2>New product enquiry from the website</h2><p><strong>Name:</strong> ${escapeHtml(enquiry.name)}</p><p><strong>Phone:</strong> ${escapeHtml(enquiry.phone)}</p>${enquiry.email ? `<p><strong>Email:</strong> ${escapeHtml(enquiry.email)}</p>` : ''}<p><strong>Product:</strong> ${escapeHtml(enquiry.productTitle)}</p><p><strong>SKU:</strong> ${escapeHtml(enquiry.sku || 'Not provided')}</p><h3>WhatsApp message</h3><pre style="font:inherit;white-space:pre-wrap">${escapeHtml(enquiry.message)}</pre></div>`;

  return transporter.sendMail({
    from,
    to: ENQUIRY_RECIPIENT,
    subject: 'New product enquiry from website',
    text: details,
    html,
    ...(enquiry.email ? { replyTo: enquiry.email } : {})
  });
}
