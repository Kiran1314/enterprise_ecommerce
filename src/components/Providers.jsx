'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import CartDrawer from './CartDrawer';
import ContactButtons from './ContactButtons';
import Footer from './Footer';
import { usePathname, useRouter } from 'next/navigation';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';

const CartContext = createContext(undefined);

export function Providers({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [registrationPromptOpen, setRegistrationPromptOpen] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({ name: '', email: '', password: '' });
  const [registrationError, setRegistrationError] = useState('');
  const [registrationBusy, setRegistrationBusy] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('cart');
    Promise.resolve().then(() => {
      if (saved) {
        try { setCart(JSON.parse(saved)); } catch {}
      }
      setCartLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (pathname !== '/' || sessionStorage.getItem('customerRegistrationPromptSeen')) return;
    sessionStorage.setItem('customerRegistrationPromptSeen', 'true');
    fetch('/api/customers/me').then(response => {
      if (response.status === 401) setRegistrationPromptOpen(true);
    }).catch(() => {});
  }, [pathname]);

  useEffect(() => {
    if (cartLoaded) localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart, cartLoaded]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item._id === product._id && item.title === product.title);
      if (existing) {
        return prev.map(item => item._id === product._id && item.title === product.title ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id, title) => {
    setCart(prev => prev.filter(item => !(item._id === id && item.title === title)));
  };

  const updateQuantity = (id, title, qty) => {
    if (qty <= 0) {
      removeFromCart(id, title);
      return;
    }
    setCart(prev => prev.map(item => item._id === id && item.title === title ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => setCart([]);

  const registerFromPrompt = async event => {
    event.preventDefault();
    setRegistrationBusy(true);
    setRegistrationError('');
    try {
      const response = await fetch('/api/customers/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registrationForm)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to register.');
      setRegistrationPromptOpen(false);
      router.replace('/');
    } catch (error) {
      setRegistrationError(error.message);
    } finally {
      setRegistrationBusy(false);
    }
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, isCartOpen, setIsCartOpen }}>
      {children}
      <CartDrawer />
      {!pathname.startsWith('/admin') && <ContactButtons />}
      <Dialog open={registrationPromptOpen} onClose={() => setRegistrationPromptOpen(false)} fullWidth maxWidth="xs">
        <Box component="form" onSubmit={registerFromPrompt}>
          <DialogTitle>
            <Typography variant="overline" fontWeight={800} color="error">SUPER JAPAN</Typography>
            <Typography component="span" variant="h6" fontWeight={850}>Create your customer account</Typography>
          </DialogTitle>
          <DialogContent sx={{ display: 'grid', gap: 2, pt: '12px !important' }}>
            {registrationError && <Alert severity="error">{registrationError}</Alert>}
            <TextField required label="Full name" value={registrationForm.name} onChange={event => setRegistrationForm({ ...registrationForm, name: event.target.value })} />
            <TextField required type="email" label="Email address" value={registrationForm.email} onChange={event => setRegistrationForm({ ...registrationForm, email: event.target.value })} />
            <TextField required type="password" label="Password (8 characters minimum)" slotProps={{ htmlInput: { minLength: 8 } }} value={registrationForm.password} onChange={event => setRegistrationForm({ ...registrationForm, password: event.target.value })} />
          </DialogContent>
          <DialogActions sx={{ p: 2, pt: 0 }}>
            <Button onClick={() => setRegistrationPromptOpen(false)}>Later</Button>
            <Button type="submit" variant="contained" disabled={registrationBusy}>{registrationBusy ? 'Creating account...' : 'Register'}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a Providers wrapper');
  }
  return context;
}