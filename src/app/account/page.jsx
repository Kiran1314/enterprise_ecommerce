'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Container, Grid, IconButton, Paper, TextField, Typography } from '@mui/material';
import { Add, Delete, ExpandMore } from '@mui/icons-material';

const newAddress = () => ({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', region: '', postalCode: '', country: 'United Arab Emirates', isDefault: false });

export default function AccountPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [editingDetails, setEditingDetails] = useState(false);
  const [editingAddresses, setEditingAddresses] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/customers/me').then(async response => {
      const result = await response.json();
      if (!response.ok) {
        router.replace('/signup?next=/account');
        return;
      }
      setProfile(result.data);
    }).catch(() => router.replace('/signup?next=/account'));
  }, [router]);

  const saveProfile = async () => {
    setError('');
    setMessage('');
    const response = await fetch('/api/customers/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setError(result.error || 'Unable to save profile.');
      return;
    }
    setProfile(result.data);
    setEditingDetails(false);
    setEditingAddresses(false);
    setMessage('Profile saved.');
  };

  if (!profile) return <Container sx={{ py: 8 }}>Loading account...</Container>;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Typography component="h1" variant="h4" fontWeight={850} sx={{ mb: 3 }}>Your account</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid #dce2e8', '&:before': { display: 'none' }, mb: 1 }}>
        <AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight={800}>Customer details</Typography></AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Full name" disabled={!editingDetails} value={profile.name || ''} onChange={event => setProfile({ ...profile, name: event.target.value })} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Email" disabled value={profile.email || ''} /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Phone" disabled={!editingDetails} value={profile.phone || ''} onChange={event => setProfile({ ...profile, phone: event.target.value })} /></Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {editingDetails ? <><Button variant="contained" onClick={saveProfile}>Save details</Button><Button onClick={() => setEditingDetails(false)}>Cancel</Button></> : <Button onClick={() => setEditingDetails(true)}>Edit details</Button>}
          </Box>
        </AccordionDetails>
      </Accordion>
      <Accordion elevation={0} sx={{ border: '1px solid #dce2e8', '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMore />}><Typography fontWeight={800}>Shipping addresses ({profile.addresses?.length || 0})</Typography></AccordionSummary>
        <AccordionDetails>
          <Box sx={{ display: 'grid', gap: 2 }}>
            {(profile.addresses || []).map((address, index) => <Paper key={address._id || index} elevation={0} sx={{ p: 2, border: '1px solid #e1e6ea' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography fontWeight={800}>{address.label || `Address ${index + 1}`}</Typography>
                {editingAddresses && <IconButton aria-label="Remove address" color="error" onClick={() => setProfile({ ...profile, addresses: profile.addresses.filter((_, addressIndex) => addressIndex !== index) })}><Delete /></IconButton>}
              </Box>
              <Grid container spacing={1.5}>
                {[
                  ['name', 'Recipient name'], ['phone', 'Phone'], ['line1', 'Address line 1'], ['line2', 'Address line 2'],
                  ['city', 'City'], ['region', 'Emirate / State'], ['postalCode', 'Postal code'], ['country', 'Country']
                ].map(([field, label]) => <Grid key={field} size={{ xs: 12, sm: field.startsWith('line') ? 12 : 6 }}>
                  <TextField fullWidth size="small" label={label} disabled={!editingAddresses} value={address[field] || ''} onChange={event => setProfile({ ...profile, addresses: profile.addresses.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: event.target.value } : entry) })} />
                </Grid>)}
              </Grid>
            </Paper>)}
            {editingAddresses && <Button startIcon={<Add />} onClick={() => setProfile({ ...profile, addresses: [...(profile.addresses || []), newAddress()] })} sx={{ justifySelf: 'start' }}>Add address</Button>}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            {editingAddresses ? <><Button variant="contained" onClick={saveProfile}>Save addresses</Button><Button onClick={() => setEditingAddresses(false)}>Cancel</Button></> : <Button onClick={() => setEditingAddresses(true)}>Edit addresses</Button>}
          </Box>
        </AccordionDetails>
      </Accordion>
    </Container>
  );
}