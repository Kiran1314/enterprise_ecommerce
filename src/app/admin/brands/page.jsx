'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, Pagination,
  IconButton, Grid, Tabs, Tab, Select, MenuItem, FormControl, InputLabel, Divider, Alert 
} from '@mui/material';
import { Add, Edit, Delete, Visibility, Close, Search, Upload, Delete as DeleteIcon, SubdirectoryArrowRight } from '@mui/icons-material';

export default function AdminBrandsCategoriesPage() {
  const [tabValue, setTabValue] = useState(1);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [currentItem, setCurrentItem] = useState(null);

  const [brandForm, setBrandForm] = useState({ name: '', slug: '', logo: '', description: '', isFeatured: false });
  const brandImageInputRef = useRef(null);
  const [brandImageUploading, setBrandImageUploading] = useState(false);
  const [brandImageUploadError, setBrandImageUploadError] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', icon: '', description: '', attributes: [] });
  const [subcategoryForm, setSubcategoryForm] = useState({ parentCategory: '', name: '', slug: '', icon: '', description: '', attributes: [] });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/brands').then(res => res.json()),
      fetch('/api/categories').then(res => res.json())
    ]).then(([brandData, catData]) => {
      if (brandData.success) setBrands(brandData.data);
      if (catData.success) setCategories(catData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [tabValue]);

  const subcategoriesFlatList = useMemo(() => {
    const list = [];
    categories.forEach(cat => {
      cat.subcategories?.forEach(sub => {
        list.push({ ...sub, parentCategoryName: cat.name, parentCategoryId: cat._id, inheritedAttributes: cat.attributes || [] });
      });
    });
    return list;
  }, [categories]);

  const filteredData = useMemo(() => {
    if (tabValue === 0) return brands.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (tabValue === 1) return categories.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
    return subcategoriesFlatList.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [tabValue, brands, categories, subcategoriesFlatList, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage]);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    if (tabValue === 0) {
      setBrandImageUploadError('');
      setBrandForm({ name: '', slug: '', logo: '', description: '', isFeatured: false });
    }
    else if (tabValue === 1) setCategoryForm({ name: '', slug: '', icon: '', description: '', attributes: [] });
    else setSubcategoryForm({ parentCategory: categories[0]?._id || '', name: '', slug: '', icon: '', description: '', attributes: [] });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setModalMode('EDIT');
    setCurrentItem(item);
    if (tabValue === 0) {
      setBrandImageUploadError('');
      setBrandForm({ name: item.name || '', slug: item.slug || '', logo: item.logo || '', description: item.description || '', isFeatured: !!item.isFeatured });
    } else if (tabValue === 1) {
      setCategoryForm({ 
        name: item.name || '', slug: item.slug || '', icon: item.icon || '', description: item.description || '', 
        attributes: item.attributes ? item.attributes.map(a => ({ name: a.name || '', type: a.type || 'text' })) : [] 
      });
    } else {
      setSubcategoryForm({ 
        parentCategory: item.parentCategoryId || '', name: item.name || '', slug: item.slug || '', icon: item.icon || '', description: item.description || '', 
        attributes: item.attributes ? item.attributes.map(a => ({ name: a.name || '', type: a.type || 'text' })) : [] 
      });
    }
    setIsModalOpen(true);
  };

  const handleBrandImageUpload = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setBrandImageUploading(true);
    setBrandImageUploadError('');
    try {
      const uploadData = new FormData();
      uploadData.append('image', file);
      const response = await fetch('/api/admin/brands/upload', { method: 'POST', body: uploadData });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'Brand image upload failed.');
      setBrandForm(previous => ({ ...previous, logo: result.logo }));
    } catch (error) {
      setBrandImageUploadError(error.message || 'Brand image upload failed.');
    } finally {
      setBrandImageUploading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      if (tabValue === 2) {
        const parentCat = categories.find(c => c._id === item.parentCategoryId);
        if (!parentCat) return;
        const updatedSubs = parentCat.subcategories.filter(sub => sub._id !== item._id);
        const res = await fetch(`/api/categories/${parentCat._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parentCat, subcategories: updatedSubs })
        });
        const data = await res.json();
        if (data.success) fetchData();
      } else {
        const endpoint = tabValue === 0 ? `/api/brands/${item._id}` : `/api/categories/${item._id}`;
        const res = await fetch(endpoint, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) fetchData();
      }
    } catch (err) { alert('Error deleting item'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (tabValue === 0) {
        let url = '/api/brands'; let method = modalMode === 'EDIT' ? `PUT` : `POST`;
        if (modalMode === 'EDIT') url += `/${currentItem._id}`;
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brandForm) });
        const data = await res.json();
        if (data.success) { setIsModalOpen(false); fetchData(); }
      } else if (tabValue === 1) {
        let url = '/api/categories'; let method = modalMode === 'EDIT' ? `PUT` : `POST`;
        if (modalMode === 'EDIT') url += `/${currentItem._id}`;
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryForm) });
        const data = await res.json();
        if (data.success) { setIsModalOpen(false); fetchData(); }
      } else {
        const parentCat = categories.find(c => c._id === subcategoryForm.parentCategory);
        if (!parentCat) return;
        let updatedSubs = [...(parentCat.subcategories || [])];
        const subPayload = { name: subcategoryForm.name, slug: subcategoryForm.slug, icon: subcategoryForm.icon, description: subcategoryForm.description, attributes: subcategoryForm.attributes };
        if (modalMode === 'EDIT') {
          updatedSubs = updatedSubs.map(s => s._id === currentItem._id ? { ...s, ...subPayload } : s);
        } else {
          updatedSubs.push(subPayload);
        }
        const res = await fetch(`/api/categories/${parentCat._id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...parentCat, subcategories: updatedSubs })
        });
        const data = await res.json();
        if (data.success) { setIsModalOpen(false); fetchData(); }
      }
    } catch (err) { alert('Error saving.'); }
  };

  const addAttributeField = (isSub = false) => {
    if (isSub) setSubcategoryForm({ ...subcategoryForm, attributes: [...subcategoryForm.attributes, { name: '', type: 'text' }] });
    else setCategoryForm({ ...categoryForm, attributes: [...categoryForm.attributes, { name: '', type: 'text' }] });
  };

  const removeAttributeField = (idx, isSub = false) => {
    if (isSub) setSubcategoryForm({ ...subcategoryForm, attributes: subcategoryForm.attributes.filter((_, i) => i !== idx) });
    else setCategoryForm({ ...categoryForm, attributes: categoryForm.attributes.filter((_, i) => i !== idx) });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Brands & Categories Management</Typography>
          <Typography variant="body2" color="text.secondary">Define attributes with 'Text' or 'Image' swatch types.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ bgcolor: '#6600cc', '&:hover': { bgcolor: '#5200a3' }, borderRadius: 2, textTransform: 'none' }}>
          {tabValue === 0 ? 'Add Brand' : tabValue === 1 ? 'Add Category' : 'Add Subcategory'}
        </Button>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 3 }} elevation={0}>
        <Tabs value={tabValue} onChange={(e, val) => { setTabValue(val); setSearchTerm(''); setCurrentPage(1); }} sx={{ borderBottom: '1px solid #e2e8f0', px: 2 }}>
          <Tab label={`Brands (${brands.length})`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label={`Categories (${categories.length})`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label={`Subcategories (${subcategoriesFlatList.length})`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      <TextField
        fullWidth
        size="small"
        placeholder={`Search ${tabValue === 0 ? 'brands' : tabValue === 1 ? 'categories' : 'subcategories'}...`}
        value={searchTerm}
        onChange={event => { setSearchTerm(event.target.value); setCurrentPage(1); }}
        slotProps={{ input: { startAdornment: <Search sx={{ color: '#94a3b8', mr: 1, fontSize: 20 }} /> } }}
        sx={{ mb: 2 }}
      />

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ICON</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>NAME</TableCell>
              {tabValue === 2 && <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>PARENT</TableCell>}
              <TableCell sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ATTRIBUTES</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '0.75rem' }}>ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedData.map(item => (
              <TableRow key={item._id} hover>
                <TableCell><img src={item.icon || item.logo || 'https://img.icons8.com/ios-filled/50/6600cc/shopping-bag.png'} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} /></TableCell>
                <TableCell><Typography variant="subtitle2" fontWeight="bold">{tabValue === 2 && <SubdirectoryArrowRight fontSize="small" sx={{ mr: 1, color: '#6600cc' }} />} {item.name}</Typography></TableCell>
                {tabValue === 2 && <TableCell><span style={{ background: '#f3e8ff', color: '#6b21a8', padding: '2px 8px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 600 }}>{item.parentCategoryName}</span></TableCell>}
                <TableCell>
                  {(item.attributes || item.inheritedAttributes)?.map((attr, idx) => {
                    const attrName = typeof attr === 'object' ? attr.name : attr;
                    const attrType = typeof attr === 'object' ? attr.type : 'text';
                    return (
                      <span key={idx} style={{ background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, marginRight: 4 }}>
                        {attrName} ({attrType})
                      </span>
                    );
                  })}
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenEdit(item)}><Edit fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleDelete(item)}><Delete fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredData.length ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} {tabValue === 0 ? 'brands' : tabValue === 1 ? 'categories' : 'subcategories'}
        </Typography>
        <Pagination count={totalPages} page={currentPage} onChange={(event, page) => setCurrentPage(page)} color="primary" showFirstButton showLastButton />
      </Box>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc' }}>
          <Typography variant="h6" fontWeight="bold">Manage Record</Typography>
          <IconButton onClick={() => setIsModalOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {tabValue === 2 && (
              <FormControl fullWidth size="small">
                <InputLabel>Parent Category</InputLabel>
                <Select value={subcategoryForm.parentCategory} label="Parent Category" onChange={e => setSubcategoryForm({ ...subcategoryForm, parentCategory: e.target.value })}>
                  {categories.map(c => <MenuItem key={c._id} value={c._id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <TextField fullWidth required label="Name" size="small" value={tabValue === 0 ? brandForm.name : tabValue === 1 ? categoryForm.name : subcategoryForm.name} onChange={e => {
              const name = e.target.value; const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              if (tabValue === 0) setBrandForm({ ...brandForm, name, slug });
              else if (tabValue === 1) setCategoryForm({ ...categoryForm, name, slug });
              else setSubcategoryForm({ ...subcategoryForm, name, slug });
            }} />
            <TextField fullWidth required label="Slug" size="small" value={tabValue === 0 ? brandForm.slug : tabValue === 1 ? categoryForm.slug : subcategoryForm.slug} onChange={e => {
              if (tabValue === 0) setBrandForm({ ...brandForm, slug: e.target.value });
              else if (tabValue === 1) setCategoryForm({ ...categoryForm, slug: e.target.value });
              else setSubcategoryForm({ ...subcategoryForm, slug: e.target.value });
            }} />
            {tabValue === 0 && (
              <Box sx={{ display: 'grid', gap: 1.5 }}>
                <input ref={brandImageInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleBrandImageUpload} hidden />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Button variant="outlined" startIcon={<Upload />} onClick={() => brandImageInputRef.current?.click()} disabled={brandImageUploading} sx={{ textTransform: 'none' }}>
                    {brandImageUploading ? 'Uploading image...' : brandForm.logo ? 'Replace brand image' : 'Upload brand image'}
                  </Button>
                  <Typography variant="caption" color="text.secondary">JPG, PNG, WebP, or GIF. Maximum 8 MB.</Typography>
                </Box>
                {brandForm.logo && <Box component="img" src={brandForm.logo} alt="Brand image preview" sx={{ width: 120, height: 90, objectFit: 'contain', p: 1, border: '1px solid #e2e8f0', borderRadius: 1 }} />}
                {brandImageUploadError && <Alert severity="error">{brandImageUploadError}</Alert>}
              </Box>
            )}
            {tabValue !== 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Attributes (Text or Image type)</Typography>
                  <Button size="small" onClick={() => addAttributeField(tabValue === 2)}>+ Add Attribute</Button>
                </Box>
                {(tabValue === 1 ? categoryForm.attributes : subcategoryForm.attributes).map((attr, idx) => {
                  const attrName = typeof attr === 'object' ? attr.name || '' : attr;
                  const attrType = typeof attr === 'object' ? attr.type || 'text' : 'text';
                  return (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                      <TextField fullWidth size="small" label="Attribute Name (e.g. Color)" value={attrName} onChange={e => {
                        const updated = [...(tabValue === 1 ? categoryForm.attributes : subcategoryForm.attributes)];
                        updated[idx] = { name: e.target.value, type: attrType };
                        if (tabValue === 1) setCategoryForm({ ...categoryForm, attributes: updated });
                        else setSubcategoryForm({ ...subcategoryForm, attributes: updated });
                      }} />
                      <FormControl size="small" sx={{ minWidth: 100 }}>
                        <InputLabel>Type</InputLabel>
                        <Select value={attrType} label="Type" onChange={e => {
                          const updated = [...(tabValue === 1 ? categoryForm.attributes : subcategoryForm.attributes)];
                          updated[idx] = { name: attrName, type: e.target.value };
                          if (tabValue === 1) setCategoryForm({ ...categoryForm, attributes: updated });
                          else setSubcategoryForm({ ...subcategoryForm, attributes: updated });
                        }}>
                          <MenuItem value="text">Text</MenuItem>
                          <MenuItem value="image">Image</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton color="error" onClick={() => removeAttributeField(idx, tabValue === 2)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  );
                })}
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={brandImageUploading} sx={{ bgcolor: '#6600cc' }}>Save</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}