'use client';
import React, { useState, useEffect } from 'react';
import { 
  AppBar, Box, Drawer, IconButton, List, Toolbar, Typography, Divider, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Button, Badge, useMediaQuery, useTheme
} from '@mui/material';
import { 
  Dashboard, Inventory, Category, ViewCarousel, Storefront, LocalOffer, ReceiptLong, PeopleAlt, VideoLibrary, ContactMail, Menu
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ADMIN_NAVIGATION_ITEMS } from '@/lib/adminNavigation';

const drawerWidth = 260;

export default function AdminLayout({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [navigationLinks, setNavigationLinks] = useState(['products']);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      setNavigationLinks(Array.isArray(result.data.navigationLinks) ? result.data.navigationLinks : ['products']);
      loadOrders();
    }).catch(() => router.replace('/admin/login'));
    const interval = setInterval(loadOrders, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [pathname, router]);

  const iconsByKey = {
    dashboard: <Dashboard />,
    products: <Inventory />,
    orders: <Badge badgeContent={pendingOrders} color="error" max={99}><ReceiptLong /></Badge>,
    enquiries: <ContactMail />,
    brands: <Category />,
    banners: <ViewCarousel />,
    settings: <LocalOffer />,
    storeHighlights: <VideoLibrary />
  };
  const menuItems = [
    ...ADMIN_NAVIGATION_ITEMS
      .filter(item => isSuperAdmin || navigationLinks.includes(item.key))
      .map(item => ({ ...item, icon: iconsByKey[item.key] })),
    ...(isSuperAdmin ? [{ text: 'Admin Users', icon: <PeopleAlt />, path: '/admin/users' }] : [])
  ];
  const canAccessCurrentPath = menuItems.some(item =>
    pathname === item.path || (item.path !== '/admin' && pathname.startsWith(`${item.path}/`))
  );
  const firstAllowedPath = menuItems[0]?.path || '/admin/login';

  useEffect(() => {
    if (authorized && !canAccessCurrentPath) {
      router.replace(firstAllowedPath);
    }
  }, [authorized, canAccessCurrentPath, firstAllowedPath, router]);

  if (pathname === '/admin/login') return children;
  if (!authorized) return null;

  return (
    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, bgcolor: '#f8fafc', minHeight: '100vh', minWidth: 0 }}>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: '#fff',
          color: 'text.primary',
          borderBottom: '1px solid #e2e8f0'
        }}
      >
        <Toolbar variant="dense" sx={{ minHeight: 56, px: 1.5, gap: 1 }}>
          <IconButton
            edge="start"
            aria-label="Open admin navigation"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ color: 'text.primary' }}
          >
            <Menu />
          </IconButton>
          <Storefront color="primary" />
          <Typography variant="subtitle1" fontWeight={800}>Admin Console</Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? mobileDrawerOpen : true}
        onClose={() => setMobileDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 'min(85vw, 300px)' : drawerWidth,
          flexShrink: 0,
          '&.MuiDrawer-docked': { display: { xs: 'none', md: 'block' } },
          '&.MuiDrawer-root:not(.MuiDrawer-docked)': { display: { xs: 'block', md: 'none' } },
          [`& .MuiDrawer-paper`]: {
            width: isMobile ? 'min(85vw, 300px)' : drawerWidth,
            boxSizing: 'border-box',
            borderRight: '1px solid #e2e8f0',
            bgcolor: '#fff'
          },
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
                  onClick={() => isMobile && setMobileDrawerOpen(false)}
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
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          width: { xs: '100%', md: `calc(100% - ${drawerWidth}px)` },
          p: { xs: 1.5, sm: 2.5, md: 4 },
          minHeight: '100vh',
          '& .MuiTableContainer-root': {
            width: '100%',
            maxWidth: '100%',
            overflowX: 'auto',
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch'
          },
          '& .MuiTable-root': {
            minWidth: { xs: 650, md: '100%' }
          },
          '& .MuiTableCell-root': {
            px: { xs: 1, sm: 2 },
            py: { xs: 1, sm: 1.5 }
          },
          '& .MuiPaper-root': {
            maxWidth: '100%'
          }
        }}
      >
        {children}
      </Box>
    </Box>
  );
}