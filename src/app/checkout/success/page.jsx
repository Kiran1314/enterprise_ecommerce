import OrderSuccessDetails from './OrderSuccessDetails';

export default async function OrderSuccessPage({ searchParams }) {
  const query = await searchParams;
  const isPayPalReturn = query.payment === 'paypal';
  return <OrderSuccessDetails orderId={query.order || ''} token={isPayPalReturn ? '' : query.token || ''} paypalOrderId={isPayPalReturn ? query.token || '' : ''} payment={query.payment || ''} />;
}