'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert, Box, Button, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControlLabel, IconButton, Paper, Switch, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow, TextField, Typography
} from '@mui/material';
import { Add, Delete, Edit, OpenInNew, PushPin, VideoLibrary } from '@mui/icons-material';
import { getStoreHighlightEmbed } from '@/lib/storeHighlightUrls';

const emptyForm = {
  title: '',
  url: '',
  coverImage: '',
  order: 0,
  isActive: true,
  isPinned: false
};

export default function StoreHighlightsAdminPage() {
  const [highlights, setHighlights] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coverWarning, setCoverWarning] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  const refreshHighlights = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/store-highlights?includeInactive=true', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load store highlights.');
      setHighlights(result.data);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load store highlights.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/store-highlights?includeInactive=true', { cache: 'no-store' })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load store highlights.');
        return result.data;
      })
      .then(data => {
        if (active) setHighlights(data);
      })
      .catch(loadError => {
        if (active) setError(loadError.message || 'Unable to load store highlights.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId('');
    setError('');
    setSuccess('');
    setCoverWarning('');
    setDialogOpen(true);
  };

  const openEdit = highlight => {
    setForm({
      title: highlight.title,
      url: highlight.url,
      coverImage: highlight.coverImage || '',
      order: highlight.order ?? 0,
      isActive: highlight.isActive,
      isPinned: highlight.isPinned === true
    });
    setEditingId(highlight._id);
    setError('');
    setSuccess('');
    setCoverWarning('');
    setDialogOpen(true);
  };

  const saveHighlight = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    try {
      getStoreHighlightEmbed(form.url);
    } catch (validationError) {
      setError(validationError.message);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(editingId ? `/api/store-highlights/${editingId}` : '/api/store-highlights', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, order: Number(form.order) })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save this store highlight.');
      setDialogOpen(false);
      setSuccess(editingId ? 'Store highlight updated.' : 'Store highlight added.');
      setCoverWarning(result.coverWarning || '');
      setPage(0);
      await refreshHighlights();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this store highlight.');
    } finally {
      setSaving(false);
    }
  };

  const deleteHighlight = async highlight => {
    if (!window.confirm(`Delete "${highlight.title}" from Store Highlights?`)) return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/store-highlights/${highlight._id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to delete this store highlight.');
      setSuccess('Store highlight deleted.');
      setSelectedIds(current => current.filter(id => id !== highlight._id));
      setPage(0);
      await refreshHighlights();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this store highlight.');
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} selected store highlights?`)) return;
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/store-highlights', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to delete selected store highlights.');
      setSelectedIds([]);
      setPage(0);
      setSuccess(`${result.data.deletedCount} store highlights deleted.`);
      await refreshHighlights();
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete selected store highlights.');
    }
  };

  const togglePin = async highlight => {
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/store-highlights/${highlight._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !highlight.isPinned })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to change this highlight pin.');
      setSuccess(result.data.isPinned ? 'Highlight pinned to the top.' : 'Highlight unpinned.');
      setPage(0);
      await refreshHighlights();
    } catch (pinError) {
      setError(pinError.message || 'Unable to change this highlight pin.');
    }
  };

  const search = searchQuery.trim().toLowerCase();
  const filteredHighlights = highlights.filter(highlight =>
    !search ||
    [highlight.title, highlight.url, highlight.platform, highlight.isActive ? 'active' : 'inactive']
      .some(value => String(value || '').toLowerCase().includes(search))
  );
  const paginatedHighlights = filteredHighlights.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const currentPageIds = paginatedHighlights.map(highlight => highlight._id);
  const selectedOnCurrentPage = currentPageIds.filter(id => selectedIds.includes(id)).length;
  const allCurrentPageSelected = currentPageIds.length > 0 && selectedOnCurrentPage === currentPageIds.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <VideoLibrary color="primary" />
          <Typography component="h1" variant="h5" fontWeight={850}>Store Highlights</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={openNew} sx={{ textTransform: 'none', fontWeight: 800 }}>
          Add highlight
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Add public Facebook, Instagram, or TikTok reel links. Active highlights appear on the home page.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {coverWarning && <Alert severity="warning" sx={{ mb: 2 }}>{coverWarning}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 2 }}>
        <TextField
          size="small"
          label="Search highlights"
          placeholder="Title, platform, or link"
          value={searchQuery}
          onChange={event => {
            setSearchQuery(event.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: '100%', sm: 360 } }}
        />
        {selectedIds.length > 0 && (
          <Button color="error" variant="outlined" startIcon={<Delete />} onClick={deleteSelected} disabled={loading}>
            Delete selected ({selectedIds.length})
          </Button>
        )}
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    aria-label="Select highlights on this page"
                    checked={allCurrentPageSelected}
                    indeterminate={selectedOnCurrentPage > 0 && !allCurrentPageSelected}
                    onChange={event => {
                      const shouldSelect = event.target.checked;
                      setSelectedIds(current => {
                        const next = new Set(current);
                        currentPageIds.forEach(id => shouldSelect ? next.add(id) : next.delete(id));
                        return [...next];
                      });
                    }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 800 }}>TITLE / PLATFORM</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>REEL LINK</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>ORDER</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} align="center" sx={{ py: 5 }}>Loading store highlights...</TableCell></TableRow>
              ) : filteredHighlights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 5 }}>
                    {highlights.length === 0 ? 'No highlights have been added yet.' : 'No highlights match this search.'}
                  </TableCell>
                </TableRow>
              ) : paginatedHighlights.map(highlight => (
                <TableRow key={highlight._id} hover selected={selectedIds.includes(highlight._id)}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      aria-label={`Select ${highlight.title}`}
                      checked={selectedIds.includes(highlight._id)}
                      onChange={event => setSelectedIds(current => event.target.checked
                        ? [...new Set([...current, highlight._id])]
                        : current.filter(id => id !== highlight._id))}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>{highlight.title}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      <Chip size="small" label={highlight.platform} />
                      {highlight.isPinned && <Chip size="small" color="primary" label="Pinned" />}
                    </Box>
                    {!highlight.coverImage && !highlight.thumbnailUrl && (
                      <Typography display="block" variant="caption" color="warning.main">Cover not detected yet</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography component="a" href={highlight.url} target="_blank" rel="noreferrer" variant="body2" sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: 'primary.main',
                      overflowWrap: 'anywhere'
                    }}>
                      {highlight.url}<OpenInNew sx={{ fontSize: 15, flexShrink: 0 }} />
                    </Typography>
                  </TableCell>
                  <TableCell>{highlight.order}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={highlight.isActive ? 'Active' : 'Inactive'}
                      color={highlight.isActive ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <IconButton
                      aria-label={highlight.isPinned ? `Unpin ${highlight.title}` : `Pin ${highlight.title} to top`}
                      title={highlight.isPinned ? 'Unpin from top' : 'Pin to top'}
                      color={highlight.isPinned ? 'primary' : 'default'}
                      onClick={() => togglePin(highlight)}
                    >
                      <PushPin fontSize="small" />
                    </IconButton>
                    <IconButton aria-label={`Edit ${highlight.title}`} onClick={() => openEdit(highlight)}><Edit fontSize="small" /></IconButton>
                    <IconButton aria-label={`Delete ${highlight.title}`} color="error" onClick={() => deleteHighlight(highlight)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredHighlights.length}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={event => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? 'Edit store highlight' : 'Add store highlight'}</DialogTitle>
        <Box component="form" onSubmit={saveHighlight}>
          <DialogContent sx={{ display: 'grid', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              required
              label="Title"
              value={form.title}
              onChange={event => setForm(current => ({ ...current, title: event.target.value }))}
              slotProps={{ htmlInput: { maxLength: 120 } }}
            />
            <TextField
              required
              type="url"
              label="Public reel URL"
              placeholder="https://www.instagram.com/reel/..."
              helperText="Use the full public reel/video URL, not a shortened link."
              value={form.url}
              onChange={event => setForm(current => ({ ...current, url: event.target.value }))}
            />
            <TextField
              type="url"
              label="Optional manual cover image URL"
              helperText="Leave blank to fetch the cover automatically from the public video."
              value={form.coverImage}
              onChange={event => setForm(current => ({ ...current, coverImage: event.target.value }))}
            />
            <TextField
              type="number"
              label="Display order"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              value={form.order}
              onChange={event => setForm(current => ({ ...current, order: event.target.value }))}
            />
            <FormControlLabel
              control={<Switch checked={form.isActive} onChange={event => setForm(current => ({ ...current, isActive: event.target.checked }))} />}
              label="Active on home page"
            />
            <FormControlLabel
              control={<Switch checked={form.isPinned} onChange={event => setForm(current => ({ ...current, isPinned: event.target.checked }))} />}
              label="Pin to top of the highlights list"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save changes' : 'Add highlight'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}