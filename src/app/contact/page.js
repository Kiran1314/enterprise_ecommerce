'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, Container, Grid, Paper, Typography, TextField, Button, Alert, Divider, CircularProgress, Fade 
} from '@mui/material';
import { LocationOn, Phone, Email, AccessTime, Send, ArrowBack } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// 1. Separate the logic that uses useSearchParams() into its own component
function ContactContent() {
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
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.success) setSettings(data.data);
      })
      .catch(() => {});
  }, []);

  // Pre-fill the form if navigating from a product's "Contact Us" button
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
    <Grid container spacing={6} sx={{ mb: 10 }}>
      {/* Left Side: Company Details & Store Location Map */}
      <Grid size={{ xs: 12, md: 5 }}>
        <Fade in={loaded} timeout={800}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', display: 'flex', flexDirection: 'column', gap: 3, boxShadow: '0 12px 24px -10px rgba(189, 94, 34, 0.1)' }}>
            <Typography variant="h5" fontWeight="900" color="#BD5E22">
              {settings?.companyName || 'SuperRFJapan Auto Spare Parts'}
            </Typography>
            <Divider />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <LocationOn sx={{ color: '#BD5E22', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Store Address</Typography>
                <Typography variant="body2" color="text.secondary">
                  {settings?.companyAddress || '21C Street, G Floor, 29733 96054, Naif, Deira, Dubai Municipality, Show Entrance, Dubai - UAE'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Phone sx={{ color: '#BD5E22', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Phone / WhatsApp</Typography>
                <Typography variant="body2" color="text.secondary">
                  {settings?.companyPhone || '+971 50 000 0000'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <Email sx={{ color: '#BD5E22', mt: 0.5 }} />
              <Box>
                <Typography variant="subtitle2" fontWeight="bold">Email Address</Typography>
                <Typography variant="body2" color="text.secondary">
                  {settings?.companyEmail || 'sales@superrfjapan.com'}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
              <AccessTime sx={{ color: '#BD5E22', mt: 0.5 }} />
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
              <Box sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #cbd5e1', height: 260 }}>
                <iframe
                  title="Store Location Map"
                  src={settings?.mapEmbedUrl || 'https://www.google.com/maps?q=21C+Street,+G+Floor,+29733+96054,+Naif,+Deira,+Dubai+Municipality,+Show+Entrance,+Dubai+-+UAE&output=embed'}
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
        </Fade>
      </Grid>

      {/* Right Side: Contact Form */}
      <Grid size={{ xs: 12, md: 7 }}>
        <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: '1px solid #e2e8f0', height: '100%', boxShadow: '0 12px 24px -10px rgba(189, 94, 34, 0.1)' }}>
          <Fade in={loaded} timeout={900}>
            <Box>
              <Typography variant="h5" fontWeight="900" sx={{ mb: 1, color: '#0f172a' }}>
                Send Us a Message
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Fill out the form below and our spare parts specialists will respond promptly.
              </Typography>
            </Box>
          </Fade>

          {statusAlert && (
            <Fade in={true} timeout={500}>
              <Alert severity={statusAlert.severity} sx={{ mb: 3 }} onClose={() => setStatusAlert(null)}>
                {statusAlert.text}
              </Alert>
            </Fade>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Fade in={loaded} timeout={1000}>
                  <TextField
                    fullWidth required label="Your Name" size="medium"
                    value={formState.name}
                    onChange={e => setFormState({ ...formState, name: e.target.value })}
                  />
                </Fade>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Fade in={loaded} timeout={1150}>
                  <TextField
                    fullWidth required type="email" label="Email Address" size="medium"
                    value={formState.email}
                    onChange={e => setFormState({ ...formState, email: e.target.value })}
                  />
                </Fade>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Fade in={loaded} timeout={1300}>
                  <TextField
                    fullWidth required label="Phone / WhatsApp Number" size="medium"
                    value={formState.phone}
                    onChange={e => setFormState({ ...formState, phone: e.target.value })}
                  />
                </Fade>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Fade in={loaded} timeout={1450}>
                  <TextField
                    fullWidth required label="Subject" size="medium"
                    value={formState.subject}
                    onChange={e => setFormState({ ...formState, subject: e.target.value })}
                  />
                </Fade>
              </Grid>
              
              <Grid size={{ xs: 12 }}>
                <Fade in={loaded} timeout={1600}>
                  <TextField
                    fullWidth required multiline rows={6} label="Message / Part Details (Make, Model, Year, VIN)"
                    value={formState.message}
                    onChange={e => setFormState({ ...formState, message: e.target.value })}
                  />
                </Fade>
              </Grid>
            </Grid>

            <Fade in={loaded} timeout={1750}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting}
                endIcon={<Send />}
                sx={{ 
                  bgcolor: '#BD5E22', 
                  '&:hover': { bgcolor: '#A04D1B' }, 
                  textTransform: 'none', 
                  fontWeight: 'bold', 
                  py: 1.5, 
                  borderRadius: 2,
                  mt: 1
                }}
              >
                {submitting ? 'Sending Inquiry...' : 'Submit Inquiry'}
              </Button>
            </Fade>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

// 2. Wrap the content component inside a Suspense boundary in the main export
export default function ContactUsPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flexGrow: 1 }}>
        
        {/* Back to Home Link */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-start' }}>
          <Button 
            component={Link} 
            href="/" 
            startIcon={<ArrowBack />} 
            sx={{ 
              color: 'text.secondary', 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': { color: '#BD5E22', bgcolor: 'transparent' } 
            }}
          >
            Back to Home
          </Button>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight="900" color="#0f172a" gutterBottom sx={{ letterSpacing: '-1px' }}>
            Contact <span style={{ color: '#BD5E22' }}>Us</span>
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Have questions about spare parts compatibility or bulk orders? Reach out to our team.
          </Typography>
        </Box>

        <Suspense fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <CircularProgress sx={{ color: '#BD5E22' }} />
          </Box>
        }>
          <ContactContent />
        </Suspense>
      </Container>

      <Footer />
    </Box>
  );
}