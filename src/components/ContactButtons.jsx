'use client';
import React, { useEffect, useState } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Phone } from '@mui/icons-material';

export default function ContactButtons() {
  const [phone, setPhone] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/settings')
      .then(response => response.json())
      .then(result => {
        if (active && result.success) setPhone(result.data?.companyPhone?.trim() || '');
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const whatsappNumber = phone.replace(/\D/g, '');
  if (!phone) return null;

  return (
    <Box sx={{ position: 'fixed', right: { xs: 16, sm: 24 }, bottom: { xs: 20, sm: 24 }, zIndex: 1200, display: 'grid', gap: 1.25 }}>
      <Tooltip title={`Call ${phone}`} placement="left">
        <IconButton
          component="a"
          href={`tel:${phone}`}
          aria-label={`Call ${phone}`}
          sx={{ width: 54, height: 54, bgcolor: 'var(--auto-red)', color: '#fff', boxShadow: '0 4px 14px rgba(41,45,61,.24)', '&:hover': { bgcolor: 'var(--auto-red-hover)', transform: 'translateY(-2px)' }, transition: 'transform 160ms ease, background-color 160ms ease' }}
        >
          <Phone />
        </IconButton>
      </Tooltip>
      <Tooltip title="Chat on WhatsApp" placement="left">
        <IconButton
          component="a"
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat on WhatsApp"
          sx={{ width: 54, height: 54, bgcolor: '#25D366', color: '#fff', boxShadow: '0 4px 14px rgba(41,45,61,.24)', '&:hover': { bgcolor: '#1DA851', transform: 'translateY(-2px)' }, transition: 'transform 160ms ease, background-color 160ms ease' }}
        >
          <svg aria-hidden="true" viewBox="0 0 32 32" width="28" height="28" fill="none">
            <path d="M16 4.2a11.8 11.8 0 0 0-10.1 17.9L4.4 28l6.1-1.6A11.8 11.8 0 1 0 16 4.2Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
            <path d="M11.4 10.4c.4-.5.8-.5 1.2-.5h.5c.2 0 .4.1.5.4l1 2.4c.1.3.1.5-.1.7l-.8 1c-.2.2-.2.4 0 .7.7 1.2 1.7 2.2 3 2.8.3.1.5.1.7-.1l1-1.1c.2-.2.5-.3.8-.2l2.3 1.1c.3.1.4.3.4.5 0 .5-.2 1.7-.9 2.3-.6.6-1.5.9-2.4.8-1.2-.1-2.8-.7-4.7-2.3-2.2-1.9-3.6-4.3-3.8-5.4-.3-1.2 0-2.2.4-2.8l.9-1.3Z" fill="currentColor" />
          </svg>
        </IconButton>
      </Tooltip>
    </Box>
  );
}
