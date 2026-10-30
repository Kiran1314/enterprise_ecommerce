'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Box, Container, Button, IconButton, Fade, Paper,
  Autocomplete, Avatar, Chip, Typography, TextField
} from '@mui/material';
import { 
  Search, ContactSupport, Settings 
} from '@mui/icons-material';

export default function Header({ categories = [], brands = [], products = [], searchQuery = '', setSearchQuery }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const searchOptions = useMemo(() => {
    if (!searchQuery || !searchQuery.trim()) return [];
    
    const q = searchQuery.toLowerCase();
    
    const matchedCategories = categories
      .filter(c => c.name?.toLowerCase().includes(q))
      .map(c => ({ ...c, type: 'Category', label: c.name, id: c._id || c.name }));
      
    const matchedBrands = brands
      .filter(b => b.name?.toLowerCase().includes(q))
      .map(b => ({ ...b, type: 'Brand', label: b.name, id: b._id || b.name }));
      
    const matchedProducts = products
      .filter(p => p.title?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q) || p.model?.toLowerCase().includes(q))
      .map(p => ({ 
        ...p, 
        type: 'Product', 
        label: p.title, 
        image: p.images?.[0] || p.image || null,
        id: p._id || p.sku
      }));
      
    return [...matchedCategories, ...matchedBrands, ...matchedProducts].slice(0, 15);
  }, [searchQuery, categories, brands, products]);

  return (
    <Box component="header" sx={{ bgcolor: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 1000 }}>
      <Container maxWidth="xl" sx={{ py: 1.5, position: 'relative' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
          
          <Box sx={{ width: 40, display: { xs: 'block', md: 'none' } }} />

          <Box sx={{ display: 'flex', justifyContent: { xs: 'center', md: 'flex-start' }, flexGrow: { xs: 1, md: 0 } }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <img src="/assets/images/logo/logo.jpg" alt="Logo" style={{ height: 48, objectFit: 'contain' }} />
            </Link>
          </Box>

          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center' }}>
            <IconButton
              onClick={() => setMobileMenuOpen(prev => !prev)}
              aria-label="Toggle Menu"
              sx={{
                color: mobileMenuOpen ? '#fff' : '#252D3C',
                bgcolor: mobileMenuOpen ? '#252D3C' : '#f3e8ff',
                transition: 'transform 0.3s ease, background-color 0.2s ease',
                transform: mobileMenuOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                '&:hover': { bgcolor: mobileMenuOpen ? '#5200a3' : '#e9d5ff' }
              }}
            >
              <Settings />
            </IconButton>
          </Box>

          {setSearchQuery && (
            <Box sx={{ order: { xs: 3, md: 2 }, width: { xs: '100%', md: 'auto' }, flexGrow: 1, maxWidth: { xs: '100%', md: 520 }, mt: { xs: 1, md: 0 } }}>
              <Autocomplete
                id="global-search"
                freeSolo
                inputValue={searchQuery || ''}
                onInputChange={(event, newInputValue) => {
                  if (event && event.type) {
                    setSearchQuery(newInputValue);
                  }
                }}
                onChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setSearchQuery(newValue);
                  } else if (newValue && newValue.label) {
                    setSearchQuery(newValue.label);
                  }
                  // Scroll to products instantly upon selection
                  setTimeout(() => {
                    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }, 50);
                }}
                options={searchOptions}
                groupBy={(option) => option.type}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.label || ''}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key || option.id} {...optionProps} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px', cursor: 'pointer' }}>
                      {option.image && (
                        <Avatar src={option.image} alt={option.label} variant="rounded" sx={{ width: 40, height: 40 }} />
                      )}
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {option.label}
                        </Typography>
                        {(option.sku || option.model) && (
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {option.sku ? `SKU: ${option.sku}` : option.model}
                          </Typography>
                        )}
                      </Box>
                      <Chip label={option.type} size="small" sx={{ textTransform: 'capitalize', fontSize: '0.65rem', height: 20, bgcolor: '#f1f5f9', color: '#475569' }} />
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search products, categories, or brands..."
                    variant="outlined"
                    size="small"
                    fullWidth
                    onKeyDown={(e) => {
                      // Scroll to products on Enter key press
                      if (e.key === 'Enter') {
                        setTimeout(() => {
                          document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                      }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: '#f8fafc',
                        borderRadius: 2,
                        fontFamily: 'inherit',
                        fontSize: '0.875rem',
                        color: '#1e293b',
                        pr: '9px !important',
                        '& fieldset': {
                          borderColor: '#e2e8f0',
                        },
                        '&:hover fieldset': {
                          borderColor: '#cbd5e1',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#1976d2',
                          borderWidth: '1px',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.12)',
                        },
                      },
                      '& .MuiOutlinedInput-input': {
                        py: 1.35,
                      },
                      '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                        color: '#64748b',
                        fontSize: 22,
                      },
                    }}

                  />
                )}
              />
            </Box>
          )}

          <Box sx={{ display: { xs: 'none', md: 'flex' }, order: 3, alignItems: 'center', gap: 2 }}>
            <Button component={Link} href="/" sx={{ color: '#1e293b', fontWeight: 600, textTransform: 'none' }}>Home</Button>
            <Button component={Link} href="/about" sx={{ color: '#1e293b', fontWeight: 600, textTransform: 'none' }}>About us</Button>
            <Button component={Link} href="/contact" variant="contained" startIcon={<ContactSupport />} sx={{ bgcolor: '#252D3C', '&:hover': { bgcolor: '#BD5E22' }, borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}>Contact Us</Button>
          </Box>
        </Box>

        {mounted && (
          <Fade in={mobileMenuOpen} timeout={300} unmountOnExit>
            <Paper elevation={4} sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 1, p: 2, mt: 1.5, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#ffffff' }}>
              <Button component={Link} href="/" fullWidth onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start', color: '#1e293b', fontWeight: 600, textTransform: 'none', py: 1, px: 2, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}>Home</Button>
              <Button component={Link} href="/about" fullWidth onClick={() => setMobileMenuOpen(false)} sx={{ justifyContent: 'flex-start', color: '#1e293b', fontWeight: 600, textTransform: 'none', py: 1, px: 2, borderRadius: 2, '&:hover': { bgcolor: '#f8fafc' } }}>About us</Button>
              <Button component={Link} href="/contact" variant="contained" fullWidth startIcon={<ContactSupport />} onClick={() => setMobileMenuOpen(false)} sx={{ bgcolor: '#252D3C', '&:hover': { bgcolor: '#BD5E22' }, borderRadius: 2, textTransform: 'none', fontWeight: 'bold', py: 1.2, mt: 0.5 }}>Contact Us</Button>
            </Paper>
          </Fade>
        )}
      </Container>
    </Box>
  );
}