'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, FormGroup, MenuItem, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from '@mui/material';
import { ADMIN_NAVIGATION_ITEMS } from '@/lib/adminNavigation';

const blankUser = { name: '', email: '', password: '', role: 'ProductManager', navigationLinks: ['products'] };

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankUser);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ password: '', navigationLinks: [] });
  const [error, setError] = useState('');

  const loadUsers = () => fetch('/api/admin/users').then(response => response.json()).then(result => {
    if (result.success) setUsers(result.data);
    else setError(result.error || 'Unable to load admin users.');
  }).catch(() => setError('Unable to load admin users.'));

  useEffect(() => { loadUsers(); }, []);

  const saveUser = async event => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || 'Unable to add this admin.');
        return;
      }
      setOpen(false);
      setForm(blankUser);
      await loadUsers();
    } catch {
      setError('Unable to add this admin.');
    }
  };

  const openEditUser = user => {
    setEditingUser(user);
    setEditForm({
      password: '',
      navigationLinks: Array.isArray(user.navigationLinks) ? user.navigationLinks : ['products']
    });
    setError('');
  };

  const saveUserSettings = async event => {
    event.preventDefault();
    if (!editingUser) return;
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${editingUser._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        setError(result.error || 'Unable to update this admin.');
        return;
      }
      setEditingUser(null);
      await loadUsers();
    } catch {
      setError('Unable to update this admin.');
    }
  };

  const toggleNavigationLink = (current, key, checked) => ({
    ...current,
    navigationLinks: checked
      ? [...new Set([...current.navigationLinks, key])]
      : current.navigationLinks.filter(link => link !== key)
  });

  const toggleUser = async user => {
    const response = await fetch(`/api/admin/users/${user._id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }) });
    const result = await response.json();
    if (!response.ok || !result.success) setError(result.error || 'Unable to update this admin.');
    else loadUsers();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography component="h1" variant="h5" fontWeight={850}>Admin users</Typography>
        <Button variant="contained" onClick={() => setOpen(true)} sx={{ textTransform: 'none', fontWeight: 800 }}>Add admin</Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, overflowX: 'auto' }}>
        <Table>
          <TableHead><TableRow><TableCell>Name</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell><TableCell>Status</TableCell><TableCell align="right">Action</TableCell></TableRow></TableHead>
          <TableBody>{users.map(user => <TableRow key={user._id}>
            <TableCell>{user.name}</TableCell><TableCell>{user.email}</TableCell><TableCell>{user.role}</TableCell><TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
            <TableCell align="right">
              <Button size="small" onClick={() => openEditUser(user)}>Password &amp; access</Button>
              <Button size="small" onClick={() => toggleUser(user)}>{user.isActive ? 'Deactivate' : 'Activate'}</Button>
            </TableCell>
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
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Admin navigation access</Typography>
              <FormGroup>
                {ADMIN_NAVIGATION_ITEMS.map(item => (
                  <FormControlLabel
                    key={item.key}
                    label={item.text}
                    control={<Checkbox checked={form.navigationLinks.includes(item.key)} disabled={form.navigationLinks.length === 1 && form.navigationLinks.includes(item.key)} onChange={event => setForm(current => toggleNavigationLink(current, item.key, event.target.checked))} />}
                  />
                ))}
              </FormGroup>
              <Typography variant="caption" color="text.secondary">Keep at least one navigation link enabled.</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}><Button onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" variant="contained">Create user</Button></DialogActions>
        </Box>
      </Dialog>
      <Dialog open={Boolean(editingUser)} onClose={() => setEditingUser(null)} fullWidth maxWidth="sm">
        <DialogTitle>Manage {editingUser?.name}</DialogTitle>
        <Box component="form" onSubmit={saveUserSettings}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            <TextField
              label="Set new password"
              type="password"
              helperText="Leave blank to keep the current password. Must be at least 8 characters."
              slotProps={{ htmlInput: { minLength: 8 } }}
              value={editForm.password}
              onChange={event => setEditForm({ ...editForm, password: event.target.value })}
            />
            <Box>
              <Typography variant="subtitle2" fontWeight={700}>Admin navigation access</Typography>
              <FormGroup>
                {ADMIN_NAVIGATION_ITEMS.map(item => (
                  <FormControlLabel
                    key={item.key}
                    label={item.text}
                    control={<Checkbox checked={editForm.navigationLinks.includes(item.key)} disabled={editForm.navigationLinks.length === 1 && editForm.navigationLinks.includes(item.key)} onChange={event => setEditForm(current => toggleNavigationLink(current, item.key, event.target.checked))} />}
                  />
                ))}
              </FormGroup>
              <Typography variant="caption" color="text.secondary">Keep at least one navigation link enabled.</Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setEditingUser(null)}>Cancel</Button>
            <Button type="submit" variant="contained">Save changes</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}