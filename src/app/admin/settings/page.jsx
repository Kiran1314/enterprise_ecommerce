'use client';
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Paper, Grid, Alert, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch, Checkbox
} from '@mui/material';
import { Settings as SettingsIcon, Save } from '@mui/icons-material';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [payment, setPayment] = useState({ gateway: 'auto', region: 'UAE' });
  const [email, setEmail] = useState({ smtpHost: '', smtpPort: 587, smtpSecure: false, smtpUser: '', fromEmail: '', adminEmail: '' });
  const [clearSecrets, setClearSecrets] = useState([]);
  const [form, setForm] = useState({
    currencySymbol: '$',
    currencyCode: 'USD',
    companyName: 'Super RF Japan Auto Spare Parts Company',
    companyEmail: '',
    companyPhone: '+971 549912098',
    companyAddress: '21C Street, G Floor, 29733 96054, Naif, Deira, Dubai, Dubai Municipality, Show Entrance, UAE',
    taxId: ''
  });

  useEffect(() => {
    Promise.all([fetch('/api/settings').then(res => res.json()), fetch('/api/admin/settings').then(res => res.json())])
      .then(([store, admin]) => {
        if (store.success && store.data) setForm(store.data);
        if (admin.success && admin.data) {
          setPayment(admin.data.payment);
          setEmail(admin.data.email);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg(false);
    setErrorMsg('');
    try {
      const [storeResponse, paymentResponse] = await Promise.all([
        fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) }),
        fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ payment, email, clearSecrets }) })
      ]);
      const [storeResult, paymentResult] = await Promise.all([storeResponse.json(), paymentResponse.json()]);
      if (!storeResponse.ok || !storeResult.success || !paymentResponse.ok || !paymentResult.success) throw new Error(storeResult.error || paymentResult.error || 'Failed to save settings.');
      setPayment(paymentResult.data.payment);
      setEmail(paymentResult.data.email);
      setClearSecrets([]);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Error updating settings.');
    }
  };

  const setSecretRemoval = (field, checked) => setClearSecrets(current => checked ? [...new Set([...current, field])] : current.filter(item => item !== field));
  const secretField = (label, field, configured) => <>
    <Grid size={{ xs: 12, md: 6 }}>
      <TextField fullWidth type="password" label={label} size="small" autoComplete="new-password" value={payment[field] || email[field] || ''}
        helperText={configured ? 'Saved securely. Leave blank to keep the current key.' : 'Stored encrypted; never returned to the browser.'}
        onChange={event => {
          if (field === 'smtpPassword') setEmail({ ...email, [field]: event.target.value });
          else setPayment({ ...payment, [field]: event.target.value });
        }} />
    </Grid>
    {configured && <Grid size={{ xs: 12, md: 6 }}><FormControlLabel control={<Checkbox checked={clearSecrets.includes(field)} onChange={event => setSecretRemoval(field, event.target.checked)} />} label={`Remove saved ${label.toLowerCase()}`} /></Grid>}
  </>;

  if (loading) return <Box sx={{ p: 4 }}>Loading settings...</Box>;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" fontWeight="bold" color="text.primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon sx={{ color: '#6600cc' }} /> Store & Currency Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">Configure global currency formatting and company details across your storefront.</Typography>
      </Box>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
          Store settings successfully updated!
        </Alert>
      )}
      {errorMsg && <Alert severity="error" sx={{ mb: 3 }}>{errorMsg}</Alert>}

      <Paper component="form" onSubmit={handleSubmit} elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#6600cc" gutterBottom>Currency Configuration</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth label="Currency Symbol" size="small"
              value={form.currencySymbol}
              onChange={e => setForm({ ...form, currencySymbol: e.target.value })}
              placeholder="$"
              required
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth label="Currency Code" size="small"
              value={form.currencyCode}
              onChange={e => setForm({ ...form, currencyCode: e.target.value })}
              placeholder="USD"
              required
            />
          </Grid>

          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#6600cc" gutterBottom>Company Information</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth label="Company Name" size="small"
              value={form.companyName}
              onChange={e => setForm({ ...form, companyName: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth label="Support Email" size="small"
              value={form.companyEmail}
              onChange={e => setForm({ ...form, companyEmail: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth label="Phone Number" size="small"
              value={form.companyPhone}
              onChange={e => setForm({ ...form, companyPhone: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField 
              fullWidth label="Tax ID / Registration Number" size="small"
              value={form.taxId}
              onChange={e => setForm({ ...form, taxId: e.target.value })}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField 
              fullWidth multiline rows={2} label="Business Address" size="small"
              value={form.companyAddress}
              onChange={e => setForm({ ...form, companyAddress: e.target.value })}
            />
          </Grid>

          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#6600cc" gutterBottom>Payment Gateway</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small"><InputLabel>Gateway</InputLabel><Select label="Gateway" value={payment.gateway || 'auto'} onChange={event => setPayment({ ...payment, gateway: event.target.value })}>
              <MenuItem value="auto">Automatic</MenuItem><MenuItem value="stripe">Stripe</MenuItem><MenuItem value="network_international">Network International</MenuItem><MenuItem value="checkout_com">Checkout.com</MenuItem><MenuItem value="razorpay">Razorpay</MenuItem><MenuItem value="paypal">PayPal</MenuItem>
            </Select></FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth size="small"><InputLabel>Payment region</InputLabel><Select label="Payment region" value={payment.region || 'UAE'} onChange={event => setPayment({ ...payment, region: event.target.value })}>
              <MenuItem value="UAE">United Arab Emirates</MenuItem><MenuItem value="INDIA">India</MenuItem><MenuItem value="INTERNATIONAL">International</MenuItem>
            </Select></FormControl>
          </Grid>
          {(payment.gateway === 'auto' || payment.gateway === 'stripe') && secretField('Stripe secret key', 'stripeSecretKey', payment.stripeSecretKeyConfigured)}
          {(payment.gateway === 'auto' || payment.gateway === 'network_international') && <>
            {secretField('Network International API key', 'networkInternationalApiKey', payment.networkInternationalApiKeyConfigured)}
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Network International outlet ID" size="small" value={payment.networkInternationalOutletId || ''} onChange={event => setPayment({ ...payment, networkInternationalOutletId: event.target.value })} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Network International API URL" size="small" value={payment.networkInternationalApiUrl || ''} helperText="Optional; defaults to the production endpoint." onChange={event => setPayment({ ...payment, networkInternationalApiUrl: event.target.value })} /></Grid>
          </>}
          {(payment.gateway === 'auto' || payment.gateway === 'checkout_com') && <>
            {secretField('Checkout.com secret key', 'checkoutComSecretKey', payment.checkoutComSecretKeyConfigured)}
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Checkout.com API URL" size="small" value={payment.checkoutComBaseUrl || ''} helperText="Optional; defaults to https://api.checkout.com." onChange={event => setPayment({ ...payment, checkoutComBaseUrl: event.target.value })} /></Grid>
          </>}
          {(payment.gateway === 'auto' || payment.gateway === 'razorpay') && <>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="Razorpay key ID" size="small" value={payment.razorpayKeyId || ''} onChange={event => setPayment({ ...payment, razorpayKeyId: event.target.value })} /></Grid>
            {secretField('Razorpay key secret', 'razorpayKeySecret', payment.razorpayKeySecretConfigured)}
          </>}
          {(payment.gateway === 'auto' || payment.gateway === 'paypal') && <>
            <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="PayPal API Key (Client ID)" size="small" value={payment.paypalClientId || ''} onChange={event => setPayment({ ...payment, paypalClientId: event.target.value })} /></Grid>
            {secretField('PayPal Secret (Client Secret)', 'paypalClientSecret', payment.paypalClientSecretConfigured)}
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth size="small"><InputLabel>PayPal environment</InputLabel><Select label="PayPal environment" value={payment.paypalEnvironment || 'sandbox'} onChange={event => setPayment({ ...payment, paypalEnvironment: event.target.value })}>
                <MenuItem value="sandbox">Sandbox</MenuItem><MenuItem value="live">Live</MenuItem>
              </Select></FormControl>
            </Grid>
            {payment.paypalEnvironment !== 'live' && <>
              <Grid size={{ xs: 12 }}><Typography variant="body2" color="text.secondary">Optional Sandbox buyer login for testing checkout. These details are encrypted and are not used to authorize API requests.</Typography></Grid>
              {secretField('Sandbox username', 'paypalSandboxUsername', payment.paypalSandboxUsernameConfigured)}
              {secretField('Sandbox password', 'paypalSandboxPassword', payment.paypalSandboxPasswordConfigured)}
            </>}
          </>}

          <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" color="#6600cc" gutterBottom>Email Notifications</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="SMTP host" size="small" value={email.smtpHost || ''} onChange={event => setEmail({ ...email, smtpHost: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><TextField fullWidth type="number" label="SMTP port" size="small" value={email.smtpPort || 587} onChange={event => setEmail({ ...email, smtpPort: Number(event.target.value) })} /></Grid>
          <Grid size={{ xs: 12, md: 3 }}><FormControlLabel control={<Switch checked={Boolean(email.smtpSecure)} onChange={event => setEmail({ ...email, smtpSecure: event.target.checked })} />} label="Use TLS" /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth label="SMTP username" size="small" value={email.smtpUser || ''} onChange={event => setEmail({ ...email, smtpUser: event.target.value })} /></Grid>
          {secretField('SMTP password', 'smtpPassword', email.smtpPasswordConfigured)}
          <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth type="email" label="From email" size="small" value={email.fromEmail || ''} onChange={event => setEmail({ ...email, fromEmail: event.target.value })} /></Grid>
          <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth type="email" label="Admin order notification email" size="small" value={email.adminEmail || ''} helperText="Defaults to the company support email." onChange={event => setEmail({ ...email, adminEmail: event.target.value })} /></Grid>

          <Grid size={{ xs: 12 }} sx={{ pt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="submit" 
              variant="contained" 
              startIcon={<Save />}
              sx={{ bgcolor: '#6600cc', '&:hover': { bgcolor: '#5200a3' }, borderRadius: 2, textTransform: 'none', px: 4, py: 1.2, fontWeight: 'bold' }}
            >
              Save Settings
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}