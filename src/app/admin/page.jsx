'use client';
import React, { useEffect, useState } from 'react';
import { Alert, Box, Chip, Pagination, Paper, Tabs, Tab, Typography } from '@mui/material';

const formatActivityDate = (dateValue) => {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(year !== today.getFullYear() ? { year: 'numeric' } : {})
  }).format(date);
};

export default function AdminDashboardPage() {
  const [logs, setLogs] = useState([]);
  const [dates, setDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalLogs, setTotalLogs] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const query = new URLSearchParams({ page: String(page) });
        if (selectedDate) query.set('date', selectedDate);
        const response = await fetch(`/api/admin/activity?${query}`);
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Unable to load activity.');
        }
        if (!active) return;

        setLogs(result.data);
        setDates(result.dates);
        setTotalPages(result.pagination.totalPages);
        setTotalLogs(result.pagination.total);
        setError('');
        if (result.selectedDate && result.selectedDate !== selectedDate) {
          setSelectedDate(result.selectedDate);
        }
        if (result.pagination.page !== page) setPage(result.pagination.page);
      } catch (requestError) {
        if (active) setError(requestError.message || 'Unable to load activity.');
      }
    };

    refresh();
    const interval = setInterval(refresh, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [page, selectedDate]);

  return (
    <Box>
      <Typography component="h1" variant="h4" fontWeight={850} sx={{ mb: 3 }}>Dashboard</Typography>
      <Typography component="h2" variant="h6" fontWeight={850} sx={{ mb: 1.5 }}>Live activity</Typography>
      <Paper elevation={0} sx={{ border: '1px solid #dce2e8', borderRadius: 1, overflow: 'hidden' }}>
        {dates.length > 0 && (
          <Tabs
            value={selectedDate || dates[0]}
            onChange={(event, date) => {
              setSelectedDate(date);
              setPage(1);
            }}
            variant="scrollable"
            scrollButtons="auto"
            aria-label="Activity dates"
            sx={{ px: 1, borderBottom: '1px solid #edf0f2' }}
          >
            {dates.map(date => (
              <Tab key={date} value={date} label={formatActivityDate(date)} />
            ))}
          </Tabs>
        )}

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {!error && logs.length === 0 ? (
          <Typography sx={{ p: 3 }} color="text.secondary">No activity for this date.</Typography>
        ) : logs.map(log => (
          <Box key={log._id} sx={{ p: 2, borderBottom: '1px solid #edf0f2', display: 'flex', gap: 1.5, alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" fontWeight={800}>{log.actorName}</Typography>
                <Chip size="small" label={log.actorType} color={log.actorType === 'Admin' ? 'primary' : 'default'} />
              </Box>
              <Typography variant="body2">{log.description}</Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleTimeString()}</Typography>
          </Box>
        ))}

        {totalPages > 1 && (
          <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              {totalLogs} activities · Page {page} of {totalPages}
            </Typography>
            <Pagination count={totalPages} page={page} onChange={(event, nextPage) => setPage(nextPage)} color="primary" size="small" />
          </Box>
        )}
      </Paper>
    </Box>
  );
}
