'use client';
import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, Paper, Typography, TextField, Button, Alert, 
  InputAdornment, IconButton, CircularProgress, Divider 
} from '@mui/material';
import { 
  Email, Lock, Visibility, VisibilityOff, Login, ArrowBack 
} from '@mui/icons-material';

export default function AdminLoginPage() {
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/admin/products';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid email or password.');
      }

      window.location.href = redirectPath;
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f3e8ff 100%)',
        p: 2
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 440,
          p: { xs: 3.5, sm: 5 },
          borderRadius: 4,
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px rgba(15, 23, 42, 0.08)',
          bgcolor: '#ffffff'
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src="/assets/images/logo/logo.jpg"
            alt="Admin Logo"
            sx={{ height: 56, objectFit: 'contain', mx: 'auto', mb: 2 }}
          />
          <Typography variant="h5" fontWeight="800" color="#0f172a" gutterBottom>
            Admin Portal Sign In
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enter your credentials to manage inventory & categories
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            fullWidth
            required
            type="email"
            label="Admin Email Address"
            placeholder="admin@autospareparts.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#64748b', fontSize: 20 }} />
                  </InputAdornment>
                )
              }
            }}
          />

          <TextField
            fullWidth
            required
            type={showPassword ? 'text' : 'password'}
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#64748b', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                      size="small"
                    >
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                )
              }
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            endIcon={!loading && <Login />}
            sx={{
              mt: 1,
              py: 1.5,
              bgcolor: '#6600cc',
              '&:hover': { bgcolor: '#5200a3' },
              borderRadius: 2.5,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: '1rem',
              boxShadow: '0 8px 16px rgba(102, 0, 204, 0.22)'
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In to Dashboard'}
          </Button>
        </Box>

        <Divider sx={{ my: 3.5 }} />

        <Box sx={{ textAlign: 'center' }}>
          <Button
            component={Link}
            href="/"
            startIcon={<ArrowBack fontSize="small" />}
            sx={{ color: '#64748b', textTransform: 'none', fontWeight: 600, '&:hover': { color: '#6600cc' } }}
          >
            Return to Storefront
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}