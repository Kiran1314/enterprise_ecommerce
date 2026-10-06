'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, Box, Button, FormControl, MenuItem, Paper, Select, Typography } from '@mui/material';

export default function AdminOrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/orders/${id}`).then(response => response.json()).then(result => {
      if (result.success) setOrder(result.data);
      else setError(result.error || 'Unable to load this order.');
    }).catch(() => setError('Unable to load this order.'));
  }, [id]);

  const updateOrder = async updates => {
    setError('');
    const response = await fetch(`/api/orders/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    const result = await response.json();
    if (!response.ok || !result.success) setError(result.error || 'Unable to update this order.');
    else setOrder(result.data);
  };

  if (!order) return <Box sx={{ p: 3 }}>{error || 'Loading order...'}</Box>;

  return (
    <Box>
      <Button component={Link} href="/admin/orders" sx={{ mb: 2 }}>Back to orders</Button>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box><Typography component="h1" variant="h5" fontWeight={850}>{order.orderNumber}</Typography><Typography variant="body2" color="text.secondary">Placed {new Date(order.createdAt).toLocaleString()}</Typography></Box>
        <Typography variant="h5" fontWeight={850}>{order.currency} {Number(order.totalAmount).toFixed(2)}</Typography>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #dce2e8', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Customer</Typography>
          <Typography>{order.customer.name}</Typography><Typography>{order.customer.email}</Typography><Typography>{order.customer.phone}</Typography>
        </Paper>
        <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #dce2e8', borderRadius: 1 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Shipping address</Typography>
          <Typography>{order.shippingAddress.line1} {order.shippingAddress.line2}</Typography>
          <Typography>{[order.shippingAddress.city, order.shippingAddress.region, order.shippingAddress.postalCode].filter(Boolean).join(', ')}</Typography>
          <Typography>{order.shippingAddress.country}</Typography>
        </Paper>
      </Box>
      <Paper elevation={0} sx={{ p: 2.5, mb: 2, border: '1px solid #dce2e8', borderRadius: 1 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Items</Typography>
        {order.items.map((item, index) => <Box key={`${item.product}-${index}`} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, py: 1, borderBottom: index < order.items.length - 1 ? '1px solid #edf0f2' : 0 }}>
          <Typography>{item.title} × {item.quantity}</Typography><Typography fontWeight={700}>{order.currency} {(item.price * item.quantity).toFixed(2)}</Typography>
        </Box>)}
      </Paper>
      <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #dce2e8', borderRadius: 1 }}>
        <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Payment and processing</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Box><Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Payment status</Typography><FormControl size="small"><Select value={order.paymentStatus} onChange={event => updateOrder({ paymentStatus: event.target.value })}>{['Pending', 'Paid', 'Failed'].map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}</Select></FormControl></Box>
          <Box><Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Order status</Typography><FormControl size="small"><Select value={order.orderStatus} onChange={event => updateOrder({ orderStatus: event.target.value })}>{['Pending', 'Processing', 'Dispatched', 'Delivered', 'Completed', 'Cancelled'].map(status => <MenuItem key={status} value={status} disabled={['Dispatched', 'Completed'].includes(status) && order.paymentStatus !== 'Paid' && order.paymentMethod !== 'COD'}>{status}</MenuItem>)}</Select></FormControl></Box>
          <Box><Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Method / gateway</Typography><Typography sx={{ pt: 1 }}>{order.paymentMethod === 'COD' ? 'Cash on Delivery' : order.paymentGateway || 'Card / Digital'}</Typography></Box>
          {order.gatewayReference && <Box><Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Gateway reference</Typography><Typography sx={{ pt: 1 }}>{order.gatewayReference}</Typography></Box>}
          {order.gatewayCaptureReference && <Box><Typography variant="caption" display="block" sx={{ mb: 0.5 }}>Capture reference</Typography><Typography sx={{ pt: 1 }}>{order.gatewayCaptureReference}</Typography></Box>}
          {order.paymentMethod === 'COD' && order.orderStatus !== 'Completed' && <Box sx={{ alignSelf: 'end' }}><Button variant="contained" onClick={() => updateOrder({ orderStatus: 'Completed' })}>Mark COD order complete</Button></Box>}
        </Box>
      </Paper>
    </Box>
  );
}