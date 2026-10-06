'use client';
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Drawer, IconButton, Divider } from '@mui/material';
import { Close, ShoppingBag, Delete, Add, Remove } from '@mui/icons-material';
import { useCart } from './Providers';
import { useRouter } from 'next/navigation';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const router = useRouter();
  const [currency, setCurrency] = useState('$');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.currencySymbol) {
          setCurrency(data.data.currencySymbol);
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <Drawer 
      anchor="right" 
      open={isCartOpen} 
      onClose={() => setIsCartOpen(false)}
      slotProps={{ paper: { sx: { width: { xs: '100%', sm: 400 }, p: 3, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' } } }}
    >
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ShoppingBag color="primary" /> Your Cart ({cart.reduce((acc, i) => acc + i.quantity, 0)})
          </Typography>
          <IconButton onClick={() => setIsCartOpen(false)} size="small"><Close /></IconButton>
        </Box>
        <Divider sx={{ mb: 2 }} />

        {cart.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <ShoppingBag sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="subtitle1" fontWeight="bold">Your cart is empty</Typography>
            <Typography variant="body2" color="text.secondary">Add items to start shopping.</Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxHeight: '60vh', overflowY: 'auto' }}>
            {cart.map((item, idx) => (
              <Box key={`${item._id}-${idx}`} sx={{ display: 'flex', gap: 2, alignItems: 'center', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc' }}>
                <img src={item.images?.[0]} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant="subtitle2" 
                    fontWeight="bold" 
                    sx={{ 
                      display: '-webkit-box', 
                      WebkitLineClamp: 2, 
                      WebkitBoxOrient: 'vertical', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      lineHeight: '1.2rem',
                      maxHeight: '2.4rem'
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold" sx={{ mt: 0.5 }}>{currency}{item.price.toFixed(2)}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <IconButton size="small" onClick={() => updateQuantity(item._id, item.title, item.quantity - 1)} sx={{ border: '1px solid #cbd5e1' }}><Remove sx={{ fontSize: 14 }} /></IconButton>
                    <Typography variant="body2" fontWeight="bold">{item.quantity}</Typography>
                    <IconButton size="small" onClick={() => updateQuantity(item._id, item.title, item.quantity + 1)} sx={{ border: '1px solid #cbd5e1' }}><Add sx={{ fontSize: 14 }} /></IconButton>
                  </Box>
                </Box>
                <IconButton color="error" onClick={() => removeFromCart(item._id, item.title)}><Delete fontSize="small" /></IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {cart.length > 0 && (
        <Box sx={{ pt: 2, borderTop: '1px solid #e2e8f0' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">Subtotal:</Typography>
            <Typography variant="subtitle1" fontWeight="extrabold" color="primary">{currency}{subtotal.toFixed(2)}</Typography>
          </Box>
          <Button 
            fullWidth variant="contained" size="large"
            onClick={() => { setIsCartOpen(false); router.push('/checkout'); }}
            sx={{ bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' }, fontWeight: 'bold', textTransform: 'none', borderRadius: 2, py: 1.5 }}
          >
            Proceed to Checkout
          </Button>
        </Box>
      )}
    </Drawer>
  );
}