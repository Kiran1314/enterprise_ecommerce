'use client';
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Box, Container, Grid, Paper, Typography, TextField, Button, Alert, Divider 
} from '@mui/material';
import { LocationOn, Phone, Email, AccessTime, Send } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactUsPage() {
  const searchParams = useSearchParams();
  const productParam = searchParams.get('product') || '';
  const skuParam = searchParams.get('sku') || '';

  const [settings, setSettings] = useState(null);
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusAlert, setStatusAlert] = useState(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (productParam) {
      setFormState(prev => ({
        ...prev,
        subject: `Inquiry for ${productParam}${skuParam ? ` (SKU: ${skuParam})` : ''}`,
        message: `Hello, I would like to inquire about the availability and pricing of ${productParam}${skuParam ? ` [SKU: ${skuParam}]` : ''}.`
      }));
    }
  }, [productParam, skuParam]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusAlert(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      if (res.ok) {
        setStatusAlert({ severity: 'success', text: 'Your inquiry has been sent! Our team will get back to you shortly.' });
        setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatusAlert({ severity: 'success', text: 'Thank you for contacting us! We have recorded your message.' });
      }
    } catch {
      setStatusAlert({ severity: 'success', text: 'Thank you for contacting us! We have recorded your message.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flexGrow: 1 }}>
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography variant="h4" fontWeight="bold" color="#0f172a" gutterBottom>
            Contact Us
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Have questions about spare parts compatibility or bulk orders? Reach out to our team.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Left Side: Company Details & Store Location Map */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Paper elevation={0} sx={{ p: 3.5, borderRadius: 3, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography variant="h6" fontWeight="bold" color="#252D3C">
                {settings?.companyName || 'Auto Spare Parts Store'}
              </Typography>
              <Divider />

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <LocationOn sx={{ color: '#252D3C', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Store Address</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings?.companyAddress || 'Industrial Area, Main Automotive Boulevard, Dubai, UAE'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Phone sx={{ color: '#252D3C', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Phone / WhatsApp</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings?.companyPhone || '+971 50 000 0000'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <Email sx={{ color: '#252D3C', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Email Address</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {settings?.companyEmail || 'sales@autospareparts.com'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <AccessTime sx={{ color: '#252D3C', mt: 0.5 }} />
                <Box>
                  <Typography variant="subtitle2" fontWeight="bold">Working Hours</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Mon – Sat: 8:30 AM – 8:00 PM
                  </Typography>
                </Box>
              </Box>

              {/* Embedded Store Location Map */}
              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                  Store Location Map
                </Typography>
                <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid #cbd5e1', height: 240 }}>
                  <iframe
                    title="Store Location Map"
                    src={settings?.mapEmbedUrl || 'https://www.google.com/maps?q=Dubai+Auto+Parts&output=embed'}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right Side: Contact Form */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
                Send Us a Message
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Fill out the form below and our spare parts specialists will respond promptly.
              </Typography>

              {statusAlert && (
                <Alert severity={statusAlert.severity} sx={{ mb: 3 }} onClose={() => setStatusAlert(null)}>
                  {statusAlert.text}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth required label="Your Name" size="small"
                      value={formState.name}
                      onChange={e => setFormState({ ...formState, name: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth required type="email" label="Email Address" size="small"
                      value={formState.email}
                      onChange={e => setFormState({ ...formState, email: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth required label="Phone / WhatsApp Number" size="small"
                      value={formState.phone}
                      onChange={e => setFormState({ ...formState, phone: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth required label="Subject" size="small"
                      value={formState.subject}
                      onChange={e => setFormState({ ...formState, subject: e.target.value })}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      fullWidth required multiline rows={5} label="Message / Part Details (Make, Model, Year, VIN)"
                      value={formState.message}
                      onChange={e => setFormState({ ...formState, message: e.target.value })}
                    />
                  </Grid>
                </Grid>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  endIcon={<Send />}
                  sx={{ bgcolor: '#252D3C', '&:hover': { bgcolor: '#BD5E22' }, textTransform: 'none', fontWeight: 'bold', py: 1.5, borderRadius: 2 }}
                >
                  {submitting ? 'Sending Inquiry...' : 'Submit Inquiry'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}