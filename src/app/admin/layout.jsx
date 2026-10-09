'use client';
import React, { useState, useEffect } from 'react';
import { 
  Box, Drawer, Toolbar, List, Typography, Divider, ListItem, 
  ListItemButton, ListItemIcon, ListItemText, Button, Badge 
} from '@mui/material';
import { 
  Dashboard, Inventory, Category, ViewCarousel, Storefront, LocalOffer, ReceiptLong, PeopleAlt
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const drawerWidth = 260;

export default function AdminLayout({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [pendingOrders, setPendingOrders] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/admin/login') return;
    let active = true;
    const loadOrders = () => fetch('/api/orders').then(response => response.json()).then(result => {
      if (active && result.success) setPendingOrders(result.data.filter(order => order.orderStatus === 'Pending').length);
    }).catch(() => {});
    fetch('/api/admin/auth').then(response => response.json()).then(result => {
      if (!active) return;
      if (!result.success) {
        router.replace('/admin/login');
        return;
      }
      setAuthorized(true);
      setIsSuperAdmin(result.data.role === 'SuperAdmin');
      loadOrders();
    }).catch(() => router.replace('/admin/login'));
    const interval = setInterval(loadOrders, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [pathname, router]);

  const menuItems = [
    // { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    { text: 'Products', icon: <Inventory />, path: '/admin/products' },
    //{ text: 'Orders', icon: <Badge badgeContent={pendingOrders} color="error" max={99}><ReceiptLong /></Badge>, path: '/admin/orders' },
    { text: 'Brands & Categories', icon: <Category />, path: '/admin/brands' },
    { text: 'Promotional Banners', icon: <ViewCarousel />, path: '/admin/banner' },
    { text: 'Store & Currency Settings', icon: <LocalOffer />, path: '/admin/settings' },
    ...(isSuperAdmin ? [{ text: 'Admin Users', icon: <PeopleAlt />, path: '/admin/users' }] : [])

  ];

  if (pathname === '/admin/login') return children;
  if (!authorized) return null;

  return (
    <Box sx={{ display: 'flex', bgcolor: '#f8fafc', minHeight: '100vh' }}>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', borderRight: '1px solid #e2e8f0', bgcolor: '#fff' },
        }}
      >
        <Toolbar sx={{ px: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Storefront color="primary" />
          <Typography variant="h6" fontWeight="extrabold" color="text.primary">Admin Console</Typography>
        </Toolbar>
        <Divider />
        <List sx={{ px: 2, py: 2 }}>
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== '/admin' && pathname.startsWith(`${item.path}/`));
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                <ListItemButton 
                  component={Link} 
                  href={item.path}
                  sx={{ 
                    borderRadius: 2, 
                    bgcolor: isActive ? '#e0e7ff' : 'transparent',
                    color: isActive ? '#4f46e5' : 'text.secondary',
                    '&:hover': { bgcolor: isActive ? '#e0e7ff' : '#f1f5f9', color: '#4f46e5' }
                  }}
                >
                  <ListItemIcon sx={{ color: isActive ? '#4f46e5' : 'text.secondary', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    slotProps={{
                      primary: {
                        fontWeight: isActive ? 'bold' : 'medium',
                        fontSize: '0.9rem'
                      }
                    }} 
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
        <Box sx={{ mt: 'auto', p: 3 }}>
          <Button fullWidth onClick={async () => { await fetch('/api/admin/auth', { method: 'DELETE' }); router.replace('/admin/login'); }} sx={{ mb: 1, textTransform: 'none' }}>
            Sign out
          </Button>
          <Button 
            component={Link} 
            href="/" 
            fullWidth 
            variant="outlined" 
            sx={{ textTransform: 'none', borderRadius: 2, borderColor: '#cbd5e1', color: '#334155', fontWeight: 'bold' }}
          >
            Back to Storefront
          </Button>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: '1', p: 4, width: `calc(100% - ${drawerWidth}px)`, minHeight: '100vh' }}>
        {children}
      </Box>
    </Box>
  );
}