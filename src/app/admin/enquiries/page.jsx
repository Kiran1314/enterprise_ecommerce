'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, MenuItem, Paper, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TablePagination, TableRow, Tabs, TextField, Typography
} from '@mui/material';
import { Add, ContactMail, Delete, Download, Edit } from '@mui/icons-material';
import {
  DEFAULT_ENQUIRY_STATUSES, getNextCustomStatusColor, getStatusTextColor
} from '@/lib/enquiryStatuses';

export default function EnquiriesAdminPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [statusDrafts, setStatusDrafts] = useState({});
  const [statusOptions, setStatusOptions] = useState(DEFAULT_ENQUIRY_STATUSES);
  const [statusCounts, setStatusCounts] = useState({});
  const [search, setSearch] = useState('');
  const [activeStatus, setActiveStatus] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState('');
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(DEFAULT_ENQUIRY_STATUSES[0].color);
  const [editingStatusLabel, setEditingStatusLabel] = useState('');
  const [savingStatusOption, setSavingStatusOption] = useState(false);
  const [deletingStatusLabel, setDeletingStatusLabel] = useState('');
  const [exportPeriod, setExportPeriod] = useState('all');
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportMonth, setExportMonth] = useState('');
  const [exportYear, setExportYear] = useState('');

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        page: String(page + 1),
        limit: String(rowsPerPage),
        search
      });
      if (activeStatus) query.set('status', activeStatus);
      const response = await fetch(`/api/admin/enquiries?${query}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to load enquiries.');
      setEnquiries(result.data.enquiries);
      setTotal(result.data.total);
      setStatusOptions(result.data.statuses);
      setStatusCounts(result.data.statusCounts);
      setStatusDrafts(Object.fromEntries(result.data.enquiries.map(enquiry => [
        enquiry._id,
        enquiry.status || 'Pending'
      ])));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [activeStatus, page, rowsPerPage, search]);

  useEffect(() => {
    const timeout = window.setTimeout(loadEnquiries, 250);
    return () => window.clearTimeout(timeout);
  }, [loadEnquiries]);

  const statusColorByLabel = useMemo(
    () => Object.fromEntries(statusOptions.map(status => [status.label, status.color])),
    [statusOptions]
  );
  const matchingTotal = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

  const saveStatus = async enquiry => {
    setSavingId(enquiry._id);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`/api/admin/enquiries/${enquiry._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusDrafts[enquiry._id] || 'Pending' })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to save status.');
      await loadEnquiries();
      setSuccess(`Status saved for ${enquiry.name}.`);
    } catch (saveError) {
      setError(saveError.message || 'Unable to save status.');
    } finally {
      setSavingId('');
    }
  };

  const saveStatusOption = async event => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSavingStatusOption(true);
    try {
      const response = await fetch('/api/admin/enquiries/statuses', {
        method: editingStatusLabel ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingStatusLabel ? { oldLabel: editingStatusLabel } : {}),
          label: newStatusLabel,
          color: newStatusColor
        })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to add this status.');
      const activeTabWasRenamed = Boolean(
        editingStatusLabel && activeStatus === editingStatusLabel && editingStatusLabel !== result.data.label
      );
      if (activeTabWasRenamed) {
        setActiveStatus(result.data.label);
      }
      setEditingStatusLabel('');
      setNewStatusLabel('');
      setSuccess(editingStatusLabel ? `Status “${result.data.label}” updated.` : `Status “${result.data.label}” added.`);
      if (!activeTabWasRenamed) await loadEnquiries();
    } catch (saveError) {
      setError(saveError.message || 'Unable to save this status.');
    } finally {
      setSavingStatusOption(false);
    }
  };

  const openCustomStatusDialog = () => {
    setNewStatusColor(getNextCustomStatusColor(statusOptions));
    setNewStatusLabel('');
    setEditingStatusLabel('');
    setError('');
    setStatusDialogOpen(true);
  };

  const editStatusOption = status => {
    setEditingStatusLabel(status.label);
    setNewStatusLabel(status.label);
    setNewStatusColor(status.color.startsWith('#') ? status.color : getNextCustomStatusColor(statusOptions));
    setError('');
  };

  const cancelStatusEdit = () => {
    setEditingStatusLabel('');
    setNewStatusLabel('');
    setNewStatusColor(getNextCustomStatusColor(statusOptions));
  };

  const deleteStatusOption = async status => {
    if (!window.confirm(`Delete "${status.label}"? Existing enquiries will be reassigned to another status.`)) return;
    setError('');
    setSuccess('');
    setDeletingStatusLabel(status.label);
    try {
      const response = await fetch('/api/admin/enquiries/statuses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: status.label })
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Unable to delete this status.');
      if (editingStatusLabel === status.label) cancelStatusEdit();
      setSuccess(`Status “${status.label}” deleted. Existing enquiries moved to “${result.data.reassignedTo}”.`);
      if (activeStatus === status.label) {
        setActiveStatus('');
        setPage(0);
      } else {
        await loadEnquiries();
      }
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete this status.');
    } finally {
      setDeletingStatusLabel('');
    }
  };

  const exportReport = async () => {
    setError('');
    setSuccess('');
    const query = new URLSearchParams({ period: exportPeriod });
    if (exportPeriod === 'custom') {
      if (!exportFrom || !exportTo) {
        setError('Choose both a start and end date for the report.');
        return;
      }
      query.set('from', exportFrom);
      query.set('to', exportTo);
    } else if (exportPeriod === 'month') {
      if (!exportMonth) {
        setError('Choose a month for the report.');
        return;
      }
      query.set('month', exportMonth);
    } else if (exportPeriod === 'year') {
      if (!exportYear) {
        setError('Choose a year for the report.');
        return;
      }
      query.set('year', exportYear);
    }

    setExporting(true);
    try {
      const response = await fetch(`/api/admin/enquiries/export?${query}`, { cache: 'no-store' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Unable to export enquiries.');
      }
      const reportBlob = await response.blob();
      const objectUrl = window.URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = response.headers.get('Content-Disposition')?.match(/filename="([^"]+)"/i)?.[1] || 'product-enquiries.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 1000);
      setSuccess('The enquiry report has been exported.');
    } catch (exportError) {
      setError(exportError.message || 'Unable to export enquiries.');
    } finally {
      setExporting(false);
    }
  };

  const renderStatusChip = (label, color = statusColorByLabel[label]) => (
    <Chip
      size="small"
      label={label}
      sx={{
        bgcolor: color || DEFAULT_ENQUIRY_STATUSES[0].color,
        color: getStatusTextColor(color || DEFAULT_ENQUIRY_STATUSES[0].color),
        fontWeight: 750
      }}
    />
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <ContactMail color="primary" />
          <Typography component="h1" variant="h5" fontWeight={850}>Product enquiries</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={openCustomStatusDialog} sx={{ textTransform: 'none', fontWeight: 750 }}>
          Add Status
        </Button>
      </Box>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Review customer enquiries, update their status, and export complete reports by date range.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, mb: 2, p: 2 }}>
        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>Export enquiry report</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <TextField
            select
            size="small"
            label="Date range"
            value={exportPeriod}
            onChange={event => setExportPeriod(event.target.value)}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value="all">All dates</MenuItem>
            <MenuItem value="custom">Custom date range</MenuItem>
            <MenuItem value="month">By month</MenuItem>
            <MenuItem value="year">By year</MenuItem>
          </TextField>
          {exportPeriod === 'custom' && (
            <>
              <TextField
                size="small"
                type="date"
                label="From"
                value={exportFrom}
                onChange={event => setExportFrom(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                size="small"
                type="date"
                label="To"
                value={exportTo}
                onChange={event => setExportTo(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </>
          )}
          {exportPeriod === 'month' && (
            <TextField
              size="small"
              type="month"
              label="Month"
              value={exportMonth}
              onChange={event => setExportMonth(event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
          {exportPeriod === 'year' && (
            <TextField
              size="small"
              type="number"
              label="Year"
              value={exportYear}
              onChange={event => setExportYear(event.target.value)}
              slotProps={{ htmlInput: { min: 1900, max: 9999, step: 1 } }}
              sx={{ width: 130 }}
            />
          )}
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportReport}
            disabled={exporting}
            sx={{ textTransform: 'none', fontWeight: 800 }}
          >
            {exporting ? 'Preparing…' : 'Export to Excel'}
          </Button>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
        <TextField
          size="small"
          label="Search enquiries"
          placeholder="Name, phone, email, product, or status"
          value={search}
          onChange={event => {
            setSearch(event.target.value);
            setPage(0);
          }}
          sx={{ width: { xs: '100%', sm: 420 } }}
        />
      </Box>

      <Tabs
        value={activeStatus}
        onChange={(_, value) => {
          setActiveStatus(value);
          setPage(0);
        }}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{ mb: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="" label={`All (${matchingTotal})`} />
        {statusOptions.map(status => (
          <Tab key={status.label} value={status.label} label={`${status.label} (${statusCounts[status.label] || 0})`} />
        ))}
      </Tabs>

      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>CUSTOMER</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>PRODUCT</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>RECEIVED</TableCell>
                <TableCell sx={{ fontWeight: 800, minWidth: 340 }}>STATUS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>Loading enquiries…</TableCell></TableRow>
              ) : enquiries.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center" sx={{ py: 5 }}>No enquiries found for this status.</TableCell></TableRow>
              ) : enquiries.map(enquiry => {
                const currentStatus = enquiry.status || 'Pending';
                return (
                  <TableRow key={enquiry._id} hover>
                    <TableCell>
                      <Typography fontWeight={700}>{enquiry.name}</Typography>
                      <Typography variant="body2">{enquiry.phone}</Typography>
                      {enquiry.email && <Typography variant="body2" color="text.secondary">{enquiry.email}</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={700}>{enquiry.productTitle}</Typography>
                      {enquiry.sku && <Typography variant="body2" color="text.secondary">SKU: {enquiry.sku}</Typography>}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{new Date(enquiry.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        {renderStatusChip(currentStatus)}
                        <TextField
                          select
                          size="small"
                          label="Set status"
                          value={statusDrafts[enquiry._id] || currentStatus}
                          onChange={event => setStatusDrafts(current => ({ ...current, [enquiry._id]: event.target.value }))}
                          sx={{ minWidth: 180, flex: 1 }}
                        >
                          {statusOptions.map(status => (
                            <MenuItem key={status.label} value={status.label}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {renderStatusChip(status.label, status.color)}
                              </Box>
                            </MenuItem>
                          ))}
                        </TextField>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={() => saveStatus(enquiry)}
                          disabled={savingId === enquiry._id}
                        >
                          {savingId === enquiry._id ? 'Saving' : 'Save'}
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          onRowsPerPageChange={event => {
            setRowsPerPage(Number(event.target.value));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog
        open={statusDialogOpen}
        onClose={() => {
          setStatusDialogOpen(false);
          cancelStatusEdit();
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ pb: 1 }}>Manage enquiry statuses</DialogTitle>
        <DialogContent sx={{ display: 'grid', gap: 1.5, pt: '8px !important' }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          <Box sx={{ display: 'grid', gap: 0.75, maxHeight: 280, overflowY: 'auto' }}>
            {statusOptions.map(status => (
              <Box
                key={status.label}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 1,
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5
                }}
              >
                {renderStatusChip(status.label, status.color)}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    aria-label={`Edit ${status.label}`}
                    onClick={() => editStatusOption(status)}
                    disabled={savingStatusOption || Boolean(deletingStatusLabel)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    aria-label={`Delete ${status.label}`}
                    onClick={() => deleteStatusOption(status)}
                    disabled={savingStatusOption || Boolean(deletingStatusLabel)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            ))}
          </Box>
          <Typography variant="caption" color="text.secondary">
            At least one status must remain. Enquiries in a deleted status move to the first remaining status.
          </Typography>
          <Box component="form" onSubmit={saveStatusOption} sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              required
              size="small"
              label={editingStatusLabel ? 'Edit status name' : 'New status name'}
              value={newStatusLabel}
              onChange={event => setNewStatusLabel(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 60 } }}
              sx={{ flex: '1 1 190px' }}
            />
            <TextField
              required
              size="small"
              type="color"
              label="Color"
              value={newStatusColor}
              onChange={event => setNewStatusColor(event.target.value)}
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { 'aria-label': 'Status color' } }}
              sx={{ width: 100 }}
            />
            <Button type="submit" variant="contained" disabled={savingStatusOption}>
              {savingStatusOption ? 'Saving…' : editingStatusLabel ? 'Save' : 'Add'}
            </Button>
            {editingStatusLabel && <Button onClick={cancelStatusEdit} disabled={savingStatusOption}>Cancel</Button>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => {
            setStatusDialogOpen(false);
            cancelStatusEdit();
          }}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
