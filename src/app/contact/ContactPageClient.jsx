'use client';
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import emailjs from '@emailjs/browser';
import ReCAPTCHA from 'react-google-recaptcha';
import { 
  Box, Container, Grid, Paper, Typography, TextField, Button, Alert, Divider, Fade 
} from '@mui/material';
import { LocationOn, Phone, Email, AccessTime, Send, ArrowBack } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const EMAILJS_SERVICE_ID = 'service_upmyuqr';
const EMAILJS_TEMPLATE_ID = 'template_ho34ljt';
const EMAILJS_PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || '4tmYGx6CbVQf9ceI_';
const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6LdBESsuAAAAAIsT-jHFOTgYgI-varZbnXdINr9m';
const EMAILJS_TO_EMAIL = 'Saleemkhan02017@gmail.com';
const EMAILJS_CC_EMAIL = 'superrfjapanweb@gmail.com';

function ContactContent({ initialSettings, productParam, skuParam }) {
  const recaptchaRef = useRef(null);

  const settings = initialSettings;
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: productParam
      ? `Inquiry for ${productParam}${skuParam ? ` (SKU: ${skuParam})` : ''}`
      : '',
    message: productParam
      ? `Hello, I would like to inquire about the availability and pricing of ${productParam}${skuParam ? ` [SKU: ${skuParam}]` : ''}.`
      : ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusAlert, setStatusAlert] = useState(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const loaded = true;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!captchaToken) {
      setStatusAlert({ severity: 'warning', text: 'Please complete the "I\'m not a robot" verification before submitting.' });
      return;
    }

    setSubmitting(true);
    setStatusAlert(null);

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: formState.name,
          name: formState.name,
          user_name: formState.name,
          from_email: formState.email,
          email: formState.email,
          user_email: formState.email,
          to_email: EMAILJS_TO_EMAIL,
          recipient_email: EMAILJS_TO_EMAIL,
          cc_email: EMAILJS_CC_EMAIL,
          reply_to: formState.email,
          phone: formState.phone,
          user_phone: formState.phone,
          subject: formState.subject,
          message: formState.message,
          'g-recaptcha-response': captchaToken
        },
        { publicKey: EMAILJS_PUBLIC_KEY }
      );

      setStatusAlert({ severity: 'success', text: 'Your inquiry has been sent! Our team will get back to you shortly.' });
      setFormState({ name: '', email: '', phone: '', subject: '', message: '' });
      setCaptchaToken('');
      recaptchaRef.current?.reset();
    } catch (error) {
      console.error('EmailJS submission failed:', error);
      setStatusAlert({ severity: 'error', text: 'Sorry, your inquiry could not be sent. Please try again.' });
      setCaptchaToken('');
      recaptchaRef.current?.reset();
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
                  {settings?.companyEmail || 'Saleemkhan02017@gmail.com'}
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
                  src={settings?.mapEmbedUrl || 'https://www.google.com/maps?q=High+Speed+(SUPER+RF+JAPAN)+Auto+Spare+Parts+TR+LLC&output=embed'}
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

            <Fade in={loaded} timeout={1680}>
              <Box>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  onChange={(token) => setCaptchaToken(token || '')}
                  onExpired={() => setCaptchaToken('')}
                  onErrored={() => setCaptchaToken('')}
                />
              </Box>
            </Fade>

            <Fade in={loaded} timeout={1750}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={submitting || !captchaToken}
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
export default function ContactPageClient({ initialSettings, productParam, skuParam }) {
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

        <ContactContent
          initialSettings={initialSettings}
          productParam={productParam}
          skuParam={skuParam}
        />
      </Container>

      <Footer />
    </Box>
  );
}