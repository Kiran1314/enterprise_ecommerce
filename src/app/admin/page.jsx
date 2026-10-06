'use client';
import React, { useEffect, useState } from 'react';
import { Box, Chip, Paper, Typography } from '@mui/material';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const [orderResponse, logResponse] = await Promise.all([fetch('/api/orders'), fetch('/api/admin/activity')]);
      const [orderData, logData] = await Promise.all([orderResponse.json(), logResponse.json()]);
      if (!active) return;
      if (orderData.success) setOrders(orderData.data);
      if (logData.success) setLogs(logData.data);
    };
    refresh().catch(() => {});
    const interval = setInterval(() => refresh().catch(() => {}), 10000);
    return () => { active = false; clearInterval(interval); };
  }, []);

  const pendingCount = orders.filter(order => order.orderStatus === 'Pending').length;
  const paidTotal = orders.filter(order => order.paymentStatus === 'Paid').reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <Box>
      <Typography component="h1" variant="h4" fontWeight={850} sx={{ mb: 3 }}>Dashboard</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 4 }}>
        {[
          { label: 'Orders', value: orders.length },
          { label: 'New / pending', value: pendingCount },
          { label: 'Paid order value', value: paidTotal.toFixed(2) }
        ].map(metric => <Paper key={metric.label} elevation={0} sx={{ p: 2.5, border: '1px solid #dce2e8', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">{metric.label}</Typography>
          <Typography variant="h4" fontWeight={850} sx={{ mt: 1 }}>{metric.value}</Typography>
        </Paper>)}
      </Box>
      <Typography component="h2" variant="h6" fontWeight={850} sx={{ mb: 1.5 }}>Live activity</Typography>
      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, overflow: 'hidden' }}>
        {logs.length === 0 ? <Typography sx={{ p: 3 }} color="text.secondary">No recent activity.</Typography> : logs.map(log => (
          <Box key={log._id} sx={{ p: 2, borderBottom: '1px solid #edf0f2', display: 'flex', gap: 1.5, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={800}>{log.actorName}</Typography>
                <Chip size="small" label={log.actorType} color={log.actorType === 'Admin' ? 'primary' : 'default'} />
              </Box>
              <Typography variant="body2">{log.description}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</Typography>
          </Box>
        ))}
      </Paper>
    </Box>
  );
}