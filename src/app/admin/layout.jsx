'use client';
import React, { useState, useEffect } from 'react';
import { 
  AppBar, Box, Drawer, IconButton, List, Toolbar, Typography, Divider, ListItem,
  ListItemButton, ListItemIcon, ListItemText, Button, Badge, useMediaQuery, useTheme
} from '@mui/material';
import { 
  Dashboard, Inventory, Category, ViewCarousel, Storefront, LocalOffer, ReceiptLong, PeopleAlt, VideoLibrary, ContactMail, Menu, NotificationsNone
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ADMIN_NAVIGATION_ITEMS } from '@/lib/adminNavigation';

const drawerWidth = 260;
const notificationStorageKey = 'admin-notifications-last-seen';

function getSavedNotificationSince() {
  try {
    return window.localStorage.getItem(notificationStorageKey);
  } catch (error) {
    console.error('Could not read the notification cursor:', error);
    return null;
  }
}

function saveNotificationSince(since) {
  try {
    window.localStorage.setItem(notificationStorageKey, since);
  } catch (error) {
    console.error('Could not save the notification cursor:', error);
  }
}

export default function AdminLayout({ children }) {
  const [authorized, setAuthorized] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [navigationLinks, setNavigationLinks] = useState(['products']);
  const [pendingOrders, setPendingOrders] = useState(0);
  const [newEnquiriesCount, setNewEnquiriesCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notificationSince, setNotificationSince] = useState('');
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
      const savedSince = getSavedNotificationSince();
      const since = savedSince || new Date().toISOString();
      if (!savedSince) saveNotificationSince(since);
      setNotificationSince(since);
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
  const canViewDashboard = menuItems.some(item => item.path === '/admin');

  useEffect(() => {
    if (!authorized || !notificationSince) return undefined;
    let active = true;
    const loadNotifications = async () => {
      try {
        const query = new URLSearchParams({ since: notificationSince });
        const response = await fetch(`/api/admin/notifications?${query}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load notifications.');
        }
        if (active) {
          setNotificationCount(result.data.count);
          setNewEnquiriesCount(result.data.newEnquiriesCount || 0);
        }
      } catch (error) {
        if (active) console.error('Error fetching admin notifications:', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [authorized, notificationSince]);

  useEffect(() => {
    if (authorized && !canAccessCurrentPath) {
      router.replace(firstAllowedPath);
    }
  }, [authorized, canAccessCurrentPath, firstAllowedPath, router]);

  const handleNotificationClick = () => {
    const since = new Date().toISOString();
    saveNotificationSince(since);
    setNotificationSince(since);
    setNotificationCount(0);
    if (canViewDashboard) router.push('/admin');
  };
  const notificationButton = (
    <IconButton
      aria-label={notificationCount ? `View ${notificationCount} new notifications` : 'Notifications'}
      title={notificationCount ? `${notificationCount} new product or enquiry updates` : 'Notifications'}
      onClick={handleNotificationClick}
      sx={{ color: 'text.primary' }}
    >
      <Badge
        badgeContent={notificationCount}
        color="error"
        max={99}
        invisible={notificationCount === 0}
        sx={{
          '& .MuiBadge-badge': {
            animation: notificationCount ? 'notification-pulse 1s ease-in-out infinite' : 'none',
            '@keyframes notification-pulse': {
              '50%': { opacity: 0.35, transform: 'scale(1.2)' }
            }
          }
        }}
      >
        <NotificationsNone />
      </Badge>
    </IconButton>
  );

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
          <Box sx={{ flexGrow: 1 }} />
          {notificationButton}
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
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                        <Box component="span">{item.text}</Box>
                        {item.key === 'enquiries' && newEnquiriesCount > 0 && (
                          <Box
                            component="span"
                            aria-label={`${newEnquiriesCount} new enquiries`}
                            sx={{
                              minWidth: 20,
                              px: 0.75,
                              borderRadius: 10,
                              bgcolor: 'error.main',
                              color: '#fff',
                              textAlign: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              lineHeight: '20px',
                              animation: 'enquiry-count-pulse 1s ease-in-out infinite',
                              '@keyframes enquiry-count-pulse': {
                                '50%': { opacity: 0.4, transform: 'scale(1.12)' }
                              }
                            }}
                          >
                            {newEnquiriesCount > 99 ? '99+' : newEnquiriesCount}
                          </Box>
                        )}
                      </Box>
                    }
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
        <Box sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'flex-end', mb: 2 }}>
          {notificationButton}
        </Box>
        {children}
      </Box>
    </Box>
  );
}