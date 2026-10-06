'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert, Box, Button, Paper, TextField, Typography } from '@mui/material';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const signIn = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to sign in.');
      router.replace('/admin');
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, bgcolor: '#edf1f4' }}>
      <Paper component="form" onSubmit={signIn} elevation={0} sx={{ width: '100%', maxWidth: 420, p: { xs: 3, sm: 4 }, border: '1px solid #d8dfe5', borderTop: '4px solid var(--auto-red)', borderRadius: 1 }}>
        <Typography variant="overline" fontWeight={800} color="error">SUPER JAPAN</Typography>
        <Typography component="h1" variant="h5" fontWeight={850} sx={{ mb: 3 }}>Admin sign in</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <TextField fullWidth required type="email" label="Email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} sx={{ mb: 2 }} />
        <TextField fullWidth required type="password" label="Password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} sx={{ mb: 3 }} />
        <Button fullWidth type="submit" variant="contained" disabled={busy} sx={{ py: 1.2, fontWeight: 800, textTransform: 'none' }}>{busy ? 'Signing in...' : 'Sign in'}</Button>
      </Paper>
    </Box>
  );
}