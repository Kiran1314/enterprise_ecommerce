'use client';
import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';
import { Phone, Email, LocationOn, Instagram, Facebook, ContactSupport } from '@mui/icons-material';
import Link from 'next/link';

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/high_speed_auto_spare_part', icon: <Instagram /> },
  { label: 'Facebook', href: 'https://www.facebook.com/saleem.khan.754570', icon: <Facebook /> },
  { label: 'TikTok', href: 'https://vt.tiktok.com/ZSsFNagwf/', icon: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.7 5.1c-.8-1-1.3-2.2-1.3-3.6h-3.1v14.1a2.9 2.9 0 1 1-2.5-2.9v-3.2a6 6 0 1 0 5.6 6V9.1c1.3 1 2.9 1.5 4.6 1.5V7.5c-1.5 0-2.7-.9-3.3-2.4z"/>
    </svg>
  ) }
];

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
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Box component="img" src="/assets/images/logo/logo.jpg" alt="Super Japan Premium Quality Parts" sx={{ display: 'block', width: { xs: 260, sm: 310, md: 350 }, maxWidth: '100%', height: 'auto', bgcolor: '#fff', p: 1, borderRadius: 0.5, mb: 2 }} />
            <Typography variant="body2" color="grey.400" sx={{ mb: 2 }}>
              Quality replacement parts and automotive essentials, backed by dependable service and straightforward ordering.
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
              <Link
                href="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: 'fit-content',
                  marginTop: 8,
                  padding: '10px 16px',
                  borderRadius: 6,
                  backgroundColor: '#252D3C',
                  color: '#fff',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}
              >
                <ContactSupport sx={{ fontSize: 19 }} /> Contact Us
              </Link>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'var(--auto-yellow)' }}>Quick Links</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.875rem' }}>Home</Link>
              <Link href="/terms-and-conditions" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.875rem' }}>Terms & Condition</Link>
              <Link href="/privacy-policy" style={{ color: '#d1d5db', textDecoration: 'none', fontSize: '0.875rem' }}>Privacy Policy</Link>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, color: 'var(--auto-yellow)' }}>Follow Us</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 42,
                    height: 42,
                    border: '1px solid #4b5563',
                    borderRadius: '50%',
                    color: '#fff',
                    textDecoration: 'none'
                  }}
                >
                  {social.icon}
                </Link>
              ))}
            </Box>
          </Grid>
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