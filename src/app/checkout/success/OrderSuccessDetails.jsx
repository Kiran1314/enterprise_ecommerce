'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Container, Divider, Paper, Typography } from '@mui/material';

export default function OrderSuccessDetails({ orderId, token, paypalOrderId, payment }) {
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadOrder() {
      const accessToken = token || window.sessionStorage.getItem(`order-confirmation-${orderId}`) || '';
      if (!orderId || !accessToken) throw new Error('This order confirmation link is incomplete.');
      window.sessionStorage.setItem(`order-confirmation-${orderId}`, accessToken);

      if (payment === 'paypal' && paypalOrderId) {
        try {
          const captureResponse = await fetch('/api/payments/paypal/capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, paypalOrderId, confirmationToken: accessToken })
          });
          const captureResult = await captureResponse.json();
          if (!captureResponse.ok || !captureResult.success) throw new Error(captureResult.error || 'PayPal payment could not be confirmed.');
        } catch (captureError) {
          if (active) setPaymentError(captureError.message);
        }
      }

      const response = await fetch(`/api/orders/confirmation?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(accessToken)}`);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load your order details.');
      if (active) {
        setOrder(result.data);
        window.history.replaceState(null, '', `/checkout/success?order=${encodeURIComponent(orderId)}`);
      }
    }
    loadOrder().catch(loadError => { if (active) setError(loadError.message); });
    return () => { active = false; };
  }, [orderId, token, paypalOrderId, payment]);

  if (!order) return <Container maxWidth="md" sx={{ py: 8 }}>
    {error ? <Alert severity="error">{error}</Alert> : <Typography>Loading your order details...</Typography>}
  </Container>;

  const estimatedDelivery = new Date(order.createdAt);
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 1);
  const address = order.shippingAddress;
  const addressLines = [address.line1, address.line2, [address.city, address.region, address.postalCode].filter(Boolean).join(', '), address.country].filter(Boolean);
  const paymentPending = order.paymentMethod !== 'COD' && order.paymentStatus !== 'Paid';

  return <Box sx={{ minHeight: '70vh', bgcolor: '#f4f6f8', py: { xs: 4, md: 8 } }}>
    <Container maxWidth="md">
      <Box sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={850} gutterBottom>Thank you, {order.customer.name}</Typography>
        <Typography color="text.secondary">Order {order.orderNumber} has been received.</Typography>
      </Box>
      {paymentPending && <Alert severity={payment === 'cancelled' || payment === 'failed' ? 'warning' : 'info'} sx={{ mb: 2 }}>
        {payment === 'cancelled' || payment === 'failed' ? 'Your order is saved, but payment was not completed. Contact us to arrange payment.' : 'Your payment is being confirmed. We will update you when it is complete.'}
      </Alert>}
      {paymentError && <Alert severity="warning" sx={{ mb: 2 }}>{paymentError} Contact support with order {order.orderNumber}.</Alert>}
      <Alert severity="success" sx={{ mb: 2 }}>Estimated delivery: within 1 day, by {estimatedDelivery.toLocaleDateString()}.</Alert>
      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dce2e8', borderRadius: 1 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Order details</Typography>
        {order.items.map((item, index) => <Box key={`${item.product}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1 }}>
          <Typography>{item.title} × {item.quantity}</Typography><Typography fontWeight={700}>{order.currency} {(item.price * item.quantity).toFixed(2)}</Typography>
        </Box>)}
        <Divider sx={{ my: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}><Typography fontWeight={800}>Total</Typography><Typography fontWeight={900}>{order.currency} {Number(order.totalAmount).toFixed(2)}</Typography></Box>
        <Typography variant="body2" color="text.secondary">Payment: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentGateway || 'Online payment'} · {order.paymentStatus}</Typography>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mt: 2, mb: 0.5 }}>Delivery address</Typography>
        {addressLines.map(line => <Typography key={line} variant="body2">{line}</Typography>)}
        <Typography variant="body2" sx={{ mt: 1 }}>Order notifications are addressed to {order.customer.email}.</Typography>
      </Paper>
      <Button component={Link} href="/" variant="contained" sx={{ mt: 3 }}>Continue shopping</Button>
    </Container>
  </Box>;
}