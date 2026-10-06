import dbConnect from '@/lib/dbConnect';
import Settings from '@/models/Settings';
import { decryptSetting } from '@/lib/settingsSecrets';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:${process.env.PORT || 3000}`;

async function getGatewayConfig() {
  await dbConnect();
  const settings = await Settings.findOne().select('paymentSettings').lean();
  const stored = settings?.paymentSettings || {};
  return {
    gateway: stored.gateway || process.env.PAYMENT_GATEWAY || 'auto',
    region: stored.region || process.env.PAYMENT_REGION || 'UAE',
    stripeSecretKey: decryptSetting(stored.stripeSecretKey) || process.env.STRIPE_SECRET_KEY,
    checkoutComSecretKey: decryptSetting(stored.checkoutComSecretKey) || process.env.CHECKOUT_COM_SECRET_KEY,
    checkoutComBaseUrl: stored.checkoutComBaseUrl || process.env.CHECKOUT_COM_BASE_URL,
    networkInternationalApiKey: decryptSetting(stored.networkInternationalApiKey) || process.env.NETWORK_INTERNATIONAL_API_KEY,
    networkInternationalOutletId: stored.networkInternationalOutletId || process.env.NETWORK_INTERNATIONAL_OUTLET_ID,
    networkInternationalApiUrl: stored.networkInternationalApiUrl || process.env.NETWORK_INTERNATIONAL_API_URL,
    razorpayKeyId: stored.razorpayKeyId || process.env.RAZORPAY_KEY_ID,
    razorpayKeySecret: decryptSetting(stored.razorpayKeySecret) || process.env.RAZORPAY_KEY_SECRET,
    paypalClientId: stored.paypalClientId || process.env.PAYPAL_CLIENT_ID,
    paypalClientSecret: decryptSetting(stored.paypalClientSecret) || process.env.PAYPAL_CLIENT_SECRET,
    paypalEnvironment: stored.paypalEnvironment || process.env.PAYPAL_ENVIRONMENT || 'sandbox'
  };
}

function getProvider(config) {
  const requested = (config.gateway || 'auto').toLowerCase();
  if (requested !== 'auto') return requested;
  if ((config.region || 'UAE').toUpperCase() === 'INDIA') {
    if (config.razorpayKeyId && config.razorpayKeySecret) return 'razorpay';
    if (config.stripeSecretKey) return 'stripe';
  }
  if (config.networkInternationalApiKey && config.networkInternationalOutletId) return 'network_international';
  if (config.stripeSecretKey) return 'stripe';
  if (config.checkoutComSecretKey) return 'checkout_com';
  if (config.paypalClientId && config.paypalClientSecret) return 'paypal';
  throw new Error('No payment gateway is configured. Set PAYMENT_GATEWAY and the provider credentials.');
}

function minorAmount(amount, currency) {
  return Math.round(amount * (['JPY', 'KRW'].includes(currency.toUpperCase()) ? 1 : 100));
}

function getReturnUrl(order, payment) {
  return `${siteUrl}/checkout/success?order=${order._id}&payment=${payment}`;
}

async function createStripeSession(order, config) {
  const params = new URLSearchParams();
  params.set('mode', 'payment');
  params.set('success_url', `${getReturnUrl(order, 'success')}&session_id={CHECKOUT_SESSION_ID}`);
  params.set('cancel_url', getReturnUrl(order, 'cancelled'));
  params.set('client_reference_id', order.orderNumber);
  params.set('metadata[orderId]', String(order._id));
  order.items.forEach((item, index) => {
    params.set(`line_items[${index}][quantity]`, String(item.quantity));
    params.set(`line_items[${index}][price_data][currency]`, order.currency.toLowerCase());
    params.set(`line_items[${index}][price_data][unit_amount]`, String(minorAmount(item.price, order.currency)));
    params.set(`line_items[${index}][price_data][product_data][name]`, item.title);
  });
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.stripeSecretKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Stripe checkout session could not be created.');
  return { provider: 'stripe', reference: data.id, url: data.url };
}

async function createCheckoutComSession(order, config) {
  const baseUrl = (config.checkoutComBaseUrl || 'https://api.checkout.com').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/hosted-payments`, {
    method: 'POST',
    headers: { Authorization: config.checkoutComSecretKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: minorAmount(order.totalAmount, order.currency), currency: order.currency,
      reference: order.orderNumber, description: `Order ${order.orderNumber}`,
      customer: { email: order.customer.email },
      success_url: getReturnUrl(order, 'success'),
      failure_url: getReturnUrl(order, 'failed')
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok || !data._links?.redirect?.href) throw new Error(data.error_type || 'Checkout.com hosted payment could not be created.');
  return { provider: 'checkout_com', reference: data.id, url: data._links.redirect.href };
}

async function createNetworkInternationalSession(order, config) {
  const apiUrl = (config.networkInternationalApiUrl || 'https://api-gateway.ngenius-payments.com').replace(/\/$/, '');
  const tokenResponse = await fetch(`${apiUrl}/identity/auth/access-token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${config.networkInternationalApiKey}`, 'Content-Type': 'application/vnd.ni-identity.v1+json' },
    body: '{}',
    signal: AbortSignal.timeout(15000)
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) throw new Error('Network International authentication failed.');
  const response = await fetch(`${apiUrl}/transactions/outlets/${config.networkInternationalOutletId}/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/vnd.ni-payment.v2+json', Accept: 'application/vnd.ni-payment.v2+json' },
    body: JSON.stringify({ action: 'SALE', amount: { currencyCode: order.currency, value: minorAmount(order.totalAmount, order.currency) }, emailAddress: order.customer.email, merchantOrderReference: order.orderNumber }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  const url = data._links?.payment?.href;
  if (!response.ok || !url) throw new Error('Network International payment order could not be created.');
  return { provider: 'network_international', reference: data.reference || order.orderNumber, url };
}

async function createRazorpaySession(order, config) {
  const credentials = Buffer.from(`${config.razorpayKeyId}:${config.razorpayKeySecret}`).toString('base64');
  const response = await fetch('https://api.razorpay.com/v1/payment_links', {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: minorAmount(order.totalAmount, order.currency), currency: order.currency,
      reference_id: order.orderNumber, description: `Order ${order.orderNumber}`,
      customer: { name: order.customer.name, email: order.customer.email, contact: order.customer.phone },
      notify: { sms: false, email: false }, upi_link: true,
      callback_url: getReturnUrl(order, 'return'),
      callback_method: 'get'
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok || !data.short_url) throw new Error(data.error?.description || 'Razorpay payment link could not be created.');
  return { provider: 'razorpay', reference: data.id, url: data.short_url };
}

function paypalApiBase(config) {
  return config.paypalEnvironment === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalAccessToken(config) {
  const credentials = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
  const response = await fetch(`${paypalApiBase(config)}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials',
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error(data.error_description || 'PayPal authentication failed.');
  return data.access_token;
}

async function createPayPalSession(order, config) {
  const accessToken = await getPayPalAccessToken(config);
  const response = await fetch(`${paypalApiBase(config)}/v2/checkout/orders`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: order.orderNumber,
        custom_id: String(order._id),
        description: `Order ${order.orderNumber}`,
        amount: { currency_code: order.currency, value: order.totalAmount.toFixed(2) }
      }],
      application_context: {
        brand_name: 'Super RF Japan Auto Spare Parts Company',
        user_action: 'PAY_NOW',
        return_url: `${getReturnUrl(order, 'paypal')}`,
        cancel_url: getReturnUrl(order, 'cancelled')
      }
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  const approvalUrl = data.links?.find(link => ['approve', 'payer-action'].includes(link.rel))?.href;
  if (!response.ok || !data.id || !approvalUrl) throw new Error(data.message || 'PayPal checkout order could not be created.');
  return { provider: 'paypal', reference: data.id, url: approvalUrl };
}

export async function capturePayPalOrder(paypalOrderId, requestId) {
  const config = await getGatewayConfig();
  if (!config.paypalClientId || !config.paypalClientSecret) throw new Error('Configure PayPal Business credentials in admin payment settings.');
  const accessToken = await getPayPalAccessToken(config);
  const response = await fetch(`${paypalApiBase(config)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', 'PayPal-Request-Id': requestId },
    body: '{}',
    signal: AbortSignal.timeout(15000)
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'PayPal payment capture failed.');
  return data;
}

const providers = {
  stripe: createStripeSession,
  checkout_com: createCheckoutComSession,
  network_international: createNetworkInternationalSession,
  razorpay: createRazorpaySession,
  paypal: createPayPalSession
};

export async function createPaymentSession(order, confirmationToken) {
  const config = await getGatewayConfig();
  const provider = getProvider(config);
  const createSession = providers[provider];
  if (!createSession) throw new Error(`Unsupported payment gateway: ${provider}`);
  if (!order.currency || !/^[A-Z]{3}$/.test(order.currency)) throw new Error('Store currency must be a three-letter ISO currency code.');
  const requiredCredentials = {
    stripe: [['stripeSecretKey', 'Stripe secret key']],
    checkout_com: [['checkoutComSecretKey', 'Checkout.com secret key']],
    network_international: [['networkInternationalApiKey', 'Network International API key'], ['networkInternationalOutletId', 'Network International outlet ID']],
    razorpay: [['razorpayKeyId', 'Razorpay key ID'], ['razorpayKeySecret', 'Razorpay key secret']],
    paypal: [['paypalClientId', 'PayPal client ID'], ['paypalClientSecret', 'PayPal client secret']]
  };
  const missingCredential = requiredCredentials[provider]?.find(([field]) => !config[field]);
  if (missingCredential) throw new Error(`Configure the ${missingCredential[1]} in admin payment settings.`);
  return createSession(order, config);
}