'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';

const blankUser = { name: '', email: '', password: '', role: 'ProductManager' };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankUser);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');

  const loadUsers = () => fetch('/api/admin/users').then(response => response.json()).then(result => {
    if (result.success) setUsers(result.data);
    else setError(result.error || 'Unable to load admin users.');
  }).catch(() => setError('Unable to load admin users.'));

  useEffect(() => { loadUsers(); }, []);

  const saveUser = async event => {
    event.preventDefault();
    setError('');
    const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const result = await response.json();
    if (!response.ok || !result.success) {
      setError(result.error || 'Unable to add this admin.');
      return;
    }
    setOpen(false);
    setForm(blankUser);
    loadUsers();
  };

  const toggleUser = async user => {
    const response = await fetch(`/api/admin/users/${user._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) });
    const result = await response.json();
    if (!response.ok || !result.success) setError(result.error || 'Unable to update this admin.');
    else loadUsers();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3 }}>
        <Typography component="h1" variant="h5" fontWeight={850}>Admin users</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} sx={{ textTransform: 'none', fontWeight: 800 }}>Add admin</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, overflowX: 'auto' }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
          <TableBody>{users.map(user => <TableRow key={user._id}>
            <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
            <TableCell align="right"><Button size="small" onClick={() => toggleUser(user)}>{user.isActive ? 'Deactivate' : 'Activate'}</Button></TableCell>
          </TableRow>)}</TableBody>
        </Table>
      </Paper>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add admin user</DialogTitle>
        <Box component="form" onSubmit={saveUser}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            <TextField required label="Name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
            <TextField required type="email" label="Email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} />
            <TextField required type="password" label="Temporary password" slotProps={{ htmlInput: { minLength: 8 } }} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} />
            <TextField select label="Role" value={form.role} onChange={event => setForm({ ...form, role: event.target.value })}>
              <MenuItem value="ProductManager">Product Manager</MenuItem><MenuItem value="OrderManager">Order Manager</MenuItem><MenuItem value="SuperAdmin">Super Admin</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Create user</Button></DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}