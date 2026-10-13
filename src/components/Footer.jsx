'use client';
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { Phone, Email, LocationOn } from '@mui/icons-material';
import Link from 'next/link';

export default function Footer() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.data);
      })
      .catch(() => {});
  }, []);

  return (
    <Box component="footer" sx={{ bgcolor: 'var(--auto-ink)', color: '#fff', pt: 6, pb: 4, mt: 8, borderTop: '3px solid var(--auto-red)' }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Box component="img" src="/assets/images/logo/logo.jpg" alt="Super Japan Premium Quality Parts" sx={{ display: 'block', width: { xs: 260, sm: 310, md: 350 }, maxWidth: '100%', height: 'auto', bgcolor: '#fff', p: 1, borderRadius: 0.5, mb: 2 }} />
            <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
              Quality replacement parts and automotive essentials, backed by dependable service and straightforward ordering.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'var(--auto-yellow)' }}>Contact Us</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Typography variant="body2" color="grey.300" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOn sx={{ fontSize: 18, color: 'var(--auto-yellow)' }} /> {settings?.companyAddress || '21C Street, G Floor, 29733 96054, Naif, Deira, Dubai, Dubai Municipality, Show Entrance, UAE'}
              </Typography>
              <Typography variant="body2" color="grey.300" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone sx={{ fontSize: 18, color: 'var(--auto-yellow)' }} /> {settings?.companyPhone || '+971 549912098'}
              </Typography>
              {settings?.companyEmail && <Typography variant="body2" color="grey.300" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Email sx={{ fontSize: 18, color: 'var(--auto-yellow)' }} /> {settings.companyEmail}
              </Typography>}
            </Box>
          </Grid>

          {/* <Grid size={{ xs: 12, md: 4 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'var(--auto-yellow)' }}>Quick Links</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.875rem' }}>Home</Link>
              <Link href="/admin/products" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.875rem' }}>Admin Console</Link>
              <Link href="/admin/settings" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.875rem' }}>Store Settings</Link>
            </Box>
          </Grid> */}
        </Grid>

        <Box sx={{ borderTop: '1px solid #2f3e46', mt: 4, pt: 3, textAlign: 'center' }}>
          <Typography variant="caption" color="grey.500">
            © {new Date().getFullYear()} {settings?.companyName || 'Super RF Japan Auto Spare Parts Company'}. All rights reserved.{settings?.taxId ? ` Tax ID: ${settings.taxId}` : ''}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}