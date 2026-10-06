'use client';
import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Container, IconButton, Badge, Menu, MenuItem, Fade, TextField, Autocomplete 
} from '@mui/material';
import { ShoppingBag, AccountCircle, Search, Close } from '@mui/icons-material';
import Link from 'next/link';
import { useCart } from '@/components/Providers';
import { useRouter } from 'next/navigation';

export default function Header({ categories = [], searchQuery, setSearchQuery }) {
  const { cart, setIsCartOpen } = useCart();
  const router = useRouter();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const [accountAnchorEl, setAccountAnchorEl] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const openAccountMenu = Boolean(accountAnchorEl);

  useEffect(() => {
    fetch('/api/customers/me').then(response => response.json()).then(result => {
      if (result.success) setCustomer(result.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const query = searchQuery?.trim();
    if (!query || query.length < 2) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/products?q=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(response => response.json())
        .then(result => setSuggestions(result.success ? result.data : []))
        .catch(() => {});
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [searchQuery]);

  const handleAccountHover = (e) => setAccountAnchorEl(e.currentTarget);
  const handleAccountClose = () => setAccountAnchorEl(null);

  return (
    <Box component="header" sx={{ bgcolor: 'var(--auto-ink)', borderBottom: '3px solid var(--auto-red)', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 8px rgba(0,0,0,.18)' }}>
      <Container maxWidth="xl" sx={{ minHeight: { xs: 112, md: 94 }, py: 1, px: { xs: 2, md: 4 }, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: { xs: 1, md: 2 } }}>
        <Link href="/" aria-label="Super Japan home" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, background: '#fff', padding: '3px 9px', borderRadius: 2 }}>
          <Box component="img" src="/assets/images/logo/logo.jpg" alt="Super Japan Premium Quality Parts" sx={{ display: 'block', width: { xs: 165, sm: 235, md: 290 }, height: 'auto' }} />
        </Link>

        {searchQuery !== undefined && setSearchQuery && (
          <Box sx={{ flex: { xs: '1 1 100%', md: 1 }, order: { xs: 3, md: 0 }, maxWidth: { xs: 'none', md: 600 }, mx: { xs: 0, md: 2 } }}>
            <Autocomplete
              freeSolo
              options={searchQuery?.trim().length >= 2 ? suggestions : []}
              filterOptions={options => options}
              getOptionLabel={option => typeof option === 'string' ? option : option.title || ''}
              inputValue={searchQuery || ''}
              onInputChange={(event, value, reason) => { if (reason === 'input' || reason === 'clear') setSearchQuery(value); }}
              onChange={(event, option) => {
                if (option && typeof option === 'object') router.push(`/products/${option.slug || option._id}`);
              }}
              noOptionsText={searchQuery?.trim().length >= 2 ? 'No matching products' : 'Type at least 2 characters'}
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option._id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <Box component="img" src={option.images?.[0] || '/assets/images/logo/logo.jpg'} alt="" sx={{ width: 42, height: 42, objectFit: 'cover', border: '1px solid #e1e6ea' }} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{option.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{option.sku}</Typography>
                  </Box>
                </Box>
              )}
              renderInput={params => {
                const inputSlotProps = params.slotProps?.input || {};
                return <TextField
                  {...params}
                  fullWidth size="small" placeholder="Search products, brands and more"
                  slotProps={{
                    ...params.slotProps,
                    input: {
                      ...inputSlotProps,
                      startAdornment: <><Search sx={{ color: '#878787', mr: 1, fontSize: 20 }} />{inputSlotProps.startAdornment}</>,
                      endAdornment: <>{searchQuery && <IconButton size="small" onClick={() => setSearchQuery('')}><Close fontSize="small" /></IconButton>}{inputSlotProps.endAdornment}</>
                    }
                  }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: '#fff', '& fieldset': { border: 'none' } } }}
                />;
              }}
            />
          </Box>
        )}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 3 }, order: { xs: 2, md: 0 }, ml: { xs: 'auto', md: 0 } }}>
          <Link href="/admin/products" style={{ textDecoration: 'none' }}>
            <Typography variant="body2" fontWeight="bold" color="#fff" sx={{ display: { xs: 'none', sm: 'block' }, '&:hover': { color: 'var(--auto-yellow)' } }}>
              Admin Console
            </Typography>
          </Link>

          <IconButton onClick={() => setIsCartOpen(true)} sx={{ color: '#fff' }}>
            <Badge badgeContent={cartItemCount} color="warning">
              <ShoppingBag />
            </Badge>
          </IconButton>

          <Box onMouseEnter={handleAccountHover} onMouseLeave={handleAccountClose} sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <Link href={customer ? '/account' : '/signup'} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', color: '#fff' }}>
              <IconButton sx={{ color: '#fff' }}><AccountCircle /></IconButton>
              <Typography variant="body2" fontWeight="bold" sx={{ display: { xs: 'none', md: 'block' } }}>Account</Typography>
            </Link>
            <Menu
              anchorEl={accountAnchorEl} open={openAccountMenu} onClose={handleAccountClose}
              slots={{ transition: Fade }}
              slotProps={{ 
                root: { sx: { pointerEvents: 'none' } }, 
                paper: { onMouseLeave: handleAccountClose } 
              }}
            >
              <MenuItem sx={{ pointerEvents: 'auto', flexDirection: 'column', alignItems: 'flex-start', p: 2, minWidth: 200 }}>
                <Typography variant="subtitle2" fontWeight="bold">{customer?.name || 'Guest User'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5 }}>{customer?.email || 'Access your customer account'}</Typography>
                <Button component={Link} href={customer ? '/account' : '/signup'} variant="contained" size="small" fullWidth sx={{ textTransform: 'none', bgcolor: 'var(--auto-red)', borderRadius: 1, '&:hover': { bgcolor: 'var(--auto-red-hover)' } }}>
                  {customer ? 'View account' : 'Sign Up / Login'}
                </Button>
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}