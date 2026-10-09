'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Box, Container, TextField, Button, InputAdornment, IconButton, Fade, Paper 
} from '@mui/material';
import { 
  Search, ContactSupport, Settings 
} from '@mui/icons-material';

export default function Header({ categories = [], searchQuery = '', setSearchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu automatically when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <Box component="header" sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1000 }}>
      {/* Main Top Navigation Bar */}
      <Container maxWidth="xl" sx={{ py: 1.5, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          
          {/* Mobile Left Spacer (Keeps Logo Centered on Mobile) */}
          <Box sx={{ width: 40, display: { xs: 'block', md: 'none' } }} />

          {/* Brand Logo (Centered on Mobile, Left-aligned on Desktop) */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: { xs: 'center', md: 'flex-start' }, 
            flexGrow: { xs: 1, md: 0 } 
          }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/assets/images/logo/logo.jpg" alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
            </Link>
          </Box>

          {/* Gear Icon Toggle for Mobile View */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            <IconButton
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle Menu"
              sx={{
                color: mobileMenuOpen ? '#fff' : '#252D3C',
                bgcolor: mobileMenuOpen ? '#252D3C' : '#f3e8ff',
                transition: 'transform 0.3s ease, background-color 0.2s ease',
                transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                '&:hover': {
                  bgcolor: mobileMenuOpen ? '#5200a3' : '#e9d5ff'
                }
              }}
            >
              <Settings />
            </IconButton>
          </Box>

          {/* Search Input (Full width below logo on mobile, inline on desktop) */}
          {setSearchQuery && (
            <Box sx={{ 
              order: { xs: 3, md: 2 }, 
              width: { xs: '100%', md: 'auto' }, 
              flexGrow: 1, 
              maxWidth: { xs: '100%', md: 520 },
              mt: { xs: 1, md: 0 }
            }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search spare parts by name, SKU, or model..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: '#64748b' }} />
                      </InputAdornment>
                    )
                  }
                }}
                sx={{ bgcolor: '#f8fafc', borderRadius: 2 }}
              />
            </Box>
          )}

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, order: 3, alignItems: 'center', gap: 2 }}>
            <Button component={Link} href="/" sx={{ color: '#1e293b', fontWeight: 600, textTransform: 'none' }}>
              Home
            </Button>
            <Button component={Link} href="/products" sx={{ color: '#1e293b', fontWeight: 600, textTransform: 'none' }}>
              Spare Parts
            </Button>
            <Button 
              component={Link} 
              href="/contact" 
              variant="contained" 
              startIcon={<ContactSupport />}
              sx={{ bgcolor: '#252D3C', '&:hover': { bgcolor: '#5200a3' }, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
            >
              Contact Us
            </Button>
          </Box>
        </Box>

        {/* Mobile Expandable Menu with Smooth Fade-In Effect */}
        <Fade in={mobileMenuOpen} timeout={300} unmountOnExit>
          <Paper
            elevation={4}
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexDirection: 'column',
              gap: 1,
              p: 2,
              mt: 1.5,
              borderRadius: 3,
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff'
            }}
          >
            <Button 
              component={Link} 
              href="/" 
              fullWidth 
              onClick={() => setMobileMenuOpen(false)}
              sx={{ justifyContent: 'flex-start', color: '#1e293b', fontWeight: 600, textTransform: 'none', py: 1, px: 2, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}
            >
              Home
            </Button>
            {/* <Button 
              component={Link} 
              href="/products" 
              fullWidth 
              onClick={() => setMobileMenuOpen(false)}
              sx={{ justifyContent: 'flex-start', color: '#1e293b', fontWeight: 600, textTransform: 'none', py: 1, px: 2, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}
            >
              Spare Parts
            </Button> */}
            <Button 
              component={Link} 
              href="/contact" 
              variant="contained" 
              fullWidth
              startIcon={<ContactSupport />}
              onClick={() => setMobileMenuOpen(false)}
              sx={{ bgcolor: '#252D3C', '&:hover': { bgcolor: 'orange' }, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2, mt: 0.5 }}
            >
              Contact Us
            </Button>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}