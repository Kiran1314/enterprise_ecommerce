'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Alert, Box, Button, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';

export default function SignupPage() {
  const [mode, setMode] = useState('register');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch(`/api/customers/${mode === 'register' ? 'register' : 'login'}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to continue.');
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.assign(next?.startsWith('/') ? next : '/');
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: '#f1f4f6' }}>
      <Paper component="form" onSubmit={submit} elevation={0} sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 4 }, border: '1px solid #dbe1e6', borderTop: '4px solid var(--auto-red)', borderRadius: 1 }}>
        <Typography variant="overline" fontWeight={850} color="error">SUPER JAPAN</Typography>
        <Typography component="h1" variant="h5" fontWeight={850} sx={{ mb: 2 }}>Customer account</Typography>
        <Tabs value={mode} onChange={(event, value) => { setMode(value); setError(''); }} sx={{ mb: 2 }}>
          <Tab value="register" label="Register" />
          <Tab value="login" label="Sign in" />
        </Tabs>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {mode === 'register' && <TextField required fullWidth label="Full name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} sx={{ mb: 2 }} />}
        <TextField required fullWidth type="email" label="Email address" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} sx={{ mb: 2 }} />
        <TextField required fullWidth type="password" label="Password" autoComplete={mode === 'register' ? 'new-password' : 'current-password'} slotProps={{ htmlInput: mode === 'register' ? { minLength: 8 } : {} }} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} sx={{ mb: 3 }} />
        <Button fullWidth type="submit" variant="contained" disabled={busy} sx={{ py: 1.2, fontWeight: 800, textTransform: 'none' }}>{busy ? 'Please wait...' : mode === 'register' ? 'Create account' : 'Sign in'}</Button>
        <Button component={Link} href="/" fullWidth sx={{ mt: 1, textTransform: 'none' }}>Continue shopping</Button>
      </Paper>
    </Box>
  );
}