'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Alert, Box, FormControl, MenuItem, Paper, Select, Typography } from '@mui/material';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const loadOrders = () => fetch('/api/orders').then(res => res.json()).then(data => { if (data.success) setOrders(data.data); });

  useEffect(() => { loadOrders().catch(() => setError('Unable to load orders.')); }, []);

  const updateOrder = async (order, updates) => {
    setError('');
    const response = await fetch(`/api/orders/${order._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    const result = await response.json();
    if (!response.ok || !result.success) setError(result.error || 'Unable to update order.');
    else loadOrders();
  };

  return (
    <div>
      <Typography component="h1" variant="h5" fontWeight={850} sx={{ mb: 3 }}>Orders</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={0} sx={{ overflowX: 'auto', border: '1px solid #dce2e8', borderRadius: 1 }}>
        <table className="w-full text-left border-collapse min-w-212.5">
          <thead>
            <tr className="text-xs font-semibold tracking-wider text-gray-500 uppercase border-b bg-gray-50">
              <th className="p-4">Order #</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Total</th>
              <th className="p-4">Payment Status</th>
              <th className="p-4">Order Status</th>
              <th className="p-4">Payment Mode</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y">
            {orders.length === 0 ? (
              <tr><td colSpan="6" className="p-6 text-center text-gray-500">No orders received yet.</td></tr>
            ) : (
              orders.map(order => (
                <tr key={order._id}>
                  <td className="p-4 font-bold"><Link href={`/admin/orders/${order._id}`} className="text-blue-700 hover:underline">{order.orderNumber}</Link></td>
                  <td className="p-4">{order.customer.name}</td>
                  <td className="p-4">{order.currency} {Number(order.totalAmount).toFixed(2)}</td>
                  <td className="p-4">
                    <FormControl size="small"><Select value={order.paymentStatus} onChange={event => updateOrder(order, { paymentStatus: event.target.value })}>
                      {['Pending', 'Paid', 'Failed'].map(status => <MenuItem key={status} value={status}>{status}</MenuItem>)}
                    </Select></FormControl>
                  </td>
                  <td className="p-4">
                    <FormControl size="small"><Select value={order.orderStatus} onChange={event => updateOrder(order, { orderStatus: event.target.value })}>
                      {['Pending', 'Processing', 'Dispatched', 'Delivered', 'Completed', 'Cancelled'].map(status => <MenuItem key={status} value={status} disabled={['Dispatched', 'Completed'].includes(status) && order.paymentStatus !== 'Paid' && order.paymentMethod !== 'COD'}>{status}</MenuItem>)}
                    </Select></FormControl>
                  </td>
                  <td className="p-4">{order.paymentMethod === 'CARD' ? order.paymentGateway : 'COD'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Paper>
    </div>
  );
}