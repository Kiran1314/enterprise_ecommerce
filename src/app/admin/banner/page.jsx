'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, 
  Checkbox, FormControlLabel, IconButton, Grid, Alert, Switch, Chip
} from '@mui/material';
import { 
  Add, Download, Upload, Search, ChevronLeft, ChevronRight, Edit, Delete, Visibility, Close, DeleteSweep as DeleteIcon 
} from '@mui/icons-material';

export default function AdminBannerPage() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE'); // 'CREATE', 'EDIT', 'VIEW'
  const [currentBanner, setCurrentBanner] = useState(null);

  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState('');

  // Form payload
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    image: '',
    link: '',
    order: 0,
    isActive: true
  });

  const fetchBanners = () => {
    setLoading(true);
    fetch('/api/banners')
      .then(res => res.json())
      .then(data => {
        if (data.success) setBanners(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const filteredBanners = useMemo(() => {
    return banners.filter(banner => 
      banner.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (banner.subtitle && banner.subtitle.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [banners, searchTerm]);

  const totalPages = Math.ceil(filteredBanners.length / itemsPerPage) || 1;
  const paginatedBanners = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBanners.slice(start, start + itemsPerPage);
  }, [filteredBanners, currentPage]);

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setImageUploadError('');
    setFormData({
      title: '',
      subtitle: '',
      image: '',
      link: '',
      order: banners.length + 1,
      isActive: true
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner) => {
    setModalMode('EDIT');
    setImageUploadError('');
    setCurrentBanner(banner);
    setFormData({
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      image: banner.image || '',
      link: banner.link || '',
      order: banner.order || 0,
      isActive: banner.isActive ?? true
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (banner) => {
    setModalMode('VIEW');
    setCurrentBanner(banner);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchBanners();
      } else {
        alert(data.error || 'Failed to delete banner');
      }
    } catch (err) {
      alert('Error deleting banner');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      setImageUploadError('Upload a banner image before saving.');
      return;
    }
    const payload = {
      ...formData,
      order: Number(formData.order)
    };

    try {
      let url = '/api/banners';
      let method = 'POST';
      if (modalMode === 'EDIT' && currentBanner) {
        url = `/api/banners/${currentBanner._id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchBanners();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      alert('An error occurred while saving the banner.');
    }
  };

  const handleBannerImageUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setImageUploading(true);
    setImageUploadError('');
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const response = await fetch('/api/admin/banners/upload', { method: 'POST', body: uploadData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Image upload failed.');
      setFormData(previous => ({ ...previous, image: result.image }));
    } catch (error) {
      setImageUploadError(error.message || 'Image upload failed.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredBanners, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `banners_export_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!Array.isArray(json)) {
          alert('Invalid JSON format.');
          return;
        }

        let successCount = 0;
        for (const item of json) {
          const res = await fetch('/api/banners', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          const data = await res.json();
          if (data.success) successCount++;
        }

        alert(`Successfully imported ${successCount} banners.`);
        fetchBanners();
      } catch (err) {
        alert('Failed to parse uploaded file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary">Promotional Banners Scrolling Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage homepage hero carousels, scrolling promotional sliders, and active ordering.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            startIcon={<Download />} 
            onClick={handleExport}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#cbd5e1', color: '#334155' }}
          >
            Export Filtered ({filteredBanners.length})
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<Upload />} 
            onClick={() => fileInputRef.current?.click()}
            sx={{ borderRadius: 2, textTransform: 'none', borderColor: '#6366f1', color: '#6366f1' }}
          >
            Bulk Upload JSON
          </Button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleBulkUpload} 
            accept=".json,.csv" 
            style={{ display: 'none' }} 
          />
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleOpenCreate}
            sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
          >
            Add Banner
          </Button>
        </Box>
      </Box>

      {/* Bulk Upload Format Note */}
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        <Typography variant="subtitle2" fontWeight="bold">Bulk Import Format Instruction (Excel / CSV / JSON)</Typography>
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          Upload JSON array with keys: <code>title</code>, <code>subtitle</code>, <code>image</code>, <code>link</code>, <code>order</code> (Number), and <code>isActive</code> (Boolean).
        </Typography>
      </Alert>

      {/* Search Toolbar */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <TextField 
          fullWidth size="small" placeholder="Search banners by title or subtitle..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          slotProps={{ input: { startAdornment: <Search sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} /> } }}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </Paper>

      {/* Data Table & Pagination */}
      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>IMAGE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>TITLE & SUBTITLE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>TARGET LINK</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>SCROLL ORDER</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem', color: '#64748b' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>Loading banners...</TableCell></TableRow>
            ) : paginatedBanners.length === 0 ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>No promotional banners found.</TableCell></TableRow>
            ) : (
              paginatedBanners.map(banner => (
                <TableRow key={banner._id} hover>
                  <TableCell>
                    <Box component="img" src={banner.image || 'https://via.placeholder.com/150'} alt="" sx={{ width: 60, height: 36, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="subtitle2" fontWeight="bold">{banner.title}</Typography>
                    <Typography variant="caption" color="text.secondary">{banner.subtitle || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{banner.link || 'N/A'}</Typography></TableCell>
                  <TableCell><Chip label={`#${banner.order}`} size="small" sx={{ fontWeight: 'bold', fontSize: '0.7rem' }} /></TableCell>
                  <TableCell>
                    <Chip 
                      label={banner.isActive ? 'Active' : 'Inactive'} 
                      size="small" 
                      sx={{ 
                        fontWeight: 'bold', 
                        fontSize: '0.7rem',
                        bgcolor: banner.isActive ? '#d1fae5' : '#fee2e2',
                        color: banner.isActive ? '#065f46' : '#991b1b'
                      }} 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleOpenView(banner)}><Visibility fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleOpenEdit(banner)}><Edit fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDelete(banner._id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
          <Typography variant="caption" color="text.secondary">
            Showing <b>{paginatedBanners.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</b> to <b>{Math.min(currentPage * itemsPerPage, filteredBanners.length)}</b> of <b>{filteredBanners.length}</b> entries
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="small" onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} sx={{ border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#fff' }}><ChevronLeft fontSize="small" /></IconButton>
            <Typography variant="body2" fontWeight="bold" sx={{ px: 1 }}>Page {currentPage} of {totalPages}</Typography>
            <IconButton size="small" onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} sx={{ border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#fff' }}><ChevronRight fontSize="small" /></IconButton>
          </Box>
        </Box>
      </TableContainer>

      {/* Dialog */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', pb: 2 }}>
          <Typography component="div" variant="h6" fontWeight="bold">
            {modalMode === 'CREATE' && 'Add New Promotional Banner'}
            {modalMode === 'EDIT' && 'Edit Promotional Banner'}
            {modalMode === 'VIEW' && 'Banner Details'}
          </Typography>
          <IconButton onClick={() => setIsModalOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>

        {modalMode === 'VIEW' ? (
          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Box component="img" src={currentBanner?.image || 'https://via.placeholder.com/400'} alt="" sx={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }} />
              </Grid>
              <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.disabled" fontWeight="bold">TITLE</Typography><Typography variant="body1" fontWeight="bold">{currentBanner?.title}</Typography></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.disabled" fontWeight="bold">SUBTITLE</Typography><Typography variant="body2">{currentBanner?.subtitle || 'N/A'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.disabled" fontWeight="bold">TARGET LINK</Typography><Typography variant="body2">{currentBanner?.link || 'N/A'}</Typography></Grid>
              <Grid size={{ xs: 6 }}><Typography variant="caption" color="text.disabled" fontWeight="bold">SCROLL ORDER</Typography><Typography variant="body2">#{currentBanner?.order}</Typography></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="caption" color="text.disabled" fontWeight="bold">STATUS</Typography><Typography variant="body2">{currentBanner?.isActive ? 'Active' : 'Inactive'}</Typography></Grid>
            </Grid>
          </DialogContent>
        ) : (
          <Box component="form" onSubmit={handleFormSubmit}>
            <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    fullWidth required label="Banner Title" size="small"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField 
                    fullWidth label="Subtitle / Tagline" size="small"
                    value={formData.subtitle}
                    onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <input ref={imageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleBannerImageUpload} hidden />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                      <Button variant="outlined" startIcon={<Upload />} onClick={() => imageInputRef.current?.click()} disabled={imageUploading} sx={{ textTransform: 'none' }}>
                        {imageUploading ? 'Uploading image...' : formData.image ? 'Replace banner image' : 'Upload banner image'}
                      </Button>
                      <Typography variant="caption" color="text.secondary">JPG, PNG, WebP, or GIF. Maximum 8 MB.</Typography>
                    </Box>
                    {formData.image && <Box component="img" src={formData.image} alt="Banner preview" sx={{ width: '100%', height: 150, objectFit: 'cover', border: '1px solid #e2e8f0', borderRadius: 1 }} />}
                    {imageUploadError && <Alert severity="error">{imageUploadError}</Alert>}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 8 }}>
                  <TextField 
                    fullWidth label="Target Link URL" size="small"
                    value={formData.link}
                    onChange={e => setFormData({ ...formData, link: e.target.value })}
                    placeholder="/shop or https://..."
                  />
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField 
                    fullWidth required type="number" label="Scroll Order" size="small"
                    value={formData.order}
                    onChange={e => setFormData({ ...formData, order: e.target.value })}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <FormControlLabel 
                    control={
                      <Switch 
                        checked={formData.isActive}
                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                      />
                    } 
                    label="Active Banner (Show in Scrolling Carousel)" 
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
              <Button onClick={() => setIsModalOpen(false)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 2 }}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={imageUploading} sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>Save Banner</Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}