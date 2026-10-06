'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/Providers';
import { Box, Button, Container, FormControlLabel, Paper, Radio, RadioGroup, TextField, Typography, Alert, Divider } from '@mui/material';

const emptyCustomer = { name: '', email: '', phone: '' };
const emptyAddress = { line1: '', line2: '', city: '', region: '', postalCode: '', country: 'United Arab Emirates' };

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();
  const [customer, setCustomer] = useState(emptyCustomer);
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [currency, setCurrency] = useState('$');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(response => response.json()).then(result => {
      if (result.success && result.data) {
        setCurrency(result.data.currencySymbol || '$');
        setCurrencyCode(result.data.currencyCode || 'USD');
      }
    }).catch(() => {});
    fetch('/api/customers/me').then(response => response.json()).then(result => {
      if (result.success) {
        setCustomer({ name: result.data.name || '', email: result.data.email || '', phone: result.data.phone || '' });
        const defaultAddress = result.data.addresses?.find(item => item.isDefault) || result.data.addresses?.[0];
        if (defaultAddress) setAddress({ ...emptyAddress, ...defaultAddress });
      }
    }).catch(() => {});
  }, []);

  const total = cart.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);

  const handleSubmit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(item => ({ productId: item._id, quantity: item.quantity, fitment: item.selectedFitment || null })),
          customer,
          shippingAddress: address,
          paymentMethod
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Your order could not be placed.');
      clearCart();
      window.sessionStorage.setItem(`order-confirmation-${result.data.order._id}`, result.data.confirmationToken);
      if (result.data.paymentUrl) {
        window.location.assign(result.data.paymentUrl);
        return;
      }
      router.push(`/checkout/success?order=${encodeURIComponent(result.data.order._id)}`);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  if (!cart.length) {
    return <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
      <Typography variant="h5" fontWeight={800} gutterBottom>Your cart is empty</Typography>
      <Button component={Link} href="/" variant="contained">Browse products</Button>
    </Container>;
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', py: { xs: 3, md: 6 } }}>
      <Container maxWidth="lg">
        <Typography component="h1" variant="h4" fontWeight={850} sx={{ mb: 3 }}>Checkout</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.4fr) minmax(300px, .8fr)' }, gap: 3, alignItems: 'start' }}>
          <Box sx={{ display: 'grid', gap: 2.5 }}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dce2e8', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Contact details</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField required label="Full name" value={customer.name} onChange={event => setCustomer({ ...customer, name: event.target.value })} />
                <TextField required type="email" label="Email address" value={customer.email} onChange={event => setCustomer({ ...customer, email: event.target.value })} />
                <TextField required label="Phone number" value={customer.phone} onChange={event => setCustomer({ ...customer, phone: event.target.value })} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dce2e8', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Shipping address</Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <TextField required label="Address line 1" value={address.line1} onChange={event => setAddress({ ...address, line1: event.target.value })} sx={{ gridColumn: '1 / -1' }} />
                <TextField label="Address line 2" value={address.line2} onChange={event => setAddress({ ...address, line2: event.target.value })} sx={{ gridColumn: '1 / -1' }} />
                <TextField required label="City" value={address.city} onChange={event => setAddress({ ...address, city: event.target.value })} />
                <TextField label="Emirate / State" value={address.region} onChange={event => setAddress({ ...address, region: event.target.value })} />
                <TextField label="Postal code" value={address.postalCode} onChange={event => setAddress({ ...address, postalCode: event.target.value })} />
                <TextField required label="Country" value={address.country} onChange={event => setAddress({ ...address, country: event.target.value })} />
              </Box>
            </Paper>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dce2e8', borderRadius: 1 }}>
              <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>Payment mode</Typography>
              <RadioGroup value={paymentMethod} onChange={event => setPaymentMethod(event.target.value)}>
                <FormControlLabel value="COD" control={<Radio />} label="Cash on Delivery (COD)" />
                <FormControlLabel value="CARD" control={<Radio />} label="Card / Digital payment" />
              </RadioGroup>
            </Paper>
          </Box>

          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: '1px solid #dce2e8', borderRadius: 1, position: { md: 'sticky' }, top: 90 }}>
            <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Order summary</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, maxHeight: 340, overflowY: 'auto' }}>
              {cart.map((item, index) => (
                <Box key={`${item._id}-${index}`} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box component="img" src={item.images?.[0] || '/assets/images/logo/logo.jpg'} alt="" sx={{ width: 56, height: 56, objectFit: 'cover', border: '1px solid #e0e5e9' }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700}>{item.title}</Typography>
                    <Typography variant="caption" color="text.secondary">Qty {item.quantity}</Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700}>{currency}{(Number(item.price) * item.quantity).toFixed(2)}</Typography>
                </Box>
              ))}
            </Box>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography fontWeight={800}>Total</Typography>
              <Typography fontWeight={900}>{currency}{total.toFixed(2)} {currencyCode}</Typography>
            </Box>
            <Button type="submit" fullWidth variant="contained" disabled={busy} sx={{ bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' }, py: 1.4, fontWeight: 800, textTransform: 'none' }}>
              {busy ? 'Placing order...' : paymentMethod === 'COD' ? 'Place order' : 'Continue to payment'}
            </Button>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}