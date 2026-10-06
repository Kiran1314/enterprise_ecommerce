'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Button, TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions, 
  Checkbox, FormControlLabel, IconButton, Chip, Grid, Autocomplete, Divider, Pagination
} from '@mui/material';
import { 
  Add, Search, Edit, Delete, Visibility, Close, DeleteSweep as DeleteIcon, Code as CodeIcon 
} from '@mui/icons-material';

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [globalSettings, setGlobalSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('CREATE');
  const [currentProduct, setCurrentProduct] = useState(null);

  const [isTagsModalOpen, setIsTagsModalOpen] = useState(false);
  const [tagInputLabel, setTagInputLabel] = useState('');
  const [tagInputBgColor, setTagInputBgColor] = useState('#6600cc');
  const [editingTagIndex, setEditingTagIndex] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    sku: '',
    description: '',
    price: '',
    offerPrice: '',
    comparePrice: '',
    stock: '',
    images: ['', '', ''],
    brand: null,
    categories: [],
    fitments: [],
    customTags: [],
    attributes: [],
    highlights: [],
    isFeatured: false,
    hasInquiry: false,
    whatsappNumber: ''
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/brands').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([prodData, brandData, catData, settingsData]) => {
      if (prodData.success) setProducts(prodData.data);
      if (brandData.success) setBrands(brandData.data);
      if (catData.success) setCategoriesList(catData.data);
      if (settingsData.success) setGlobalSettings(settingsData.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const currencySymbol = globalSettings?.currencySymbol || '$';

  const availableCategoryOptions = useMemo(() => {
    const list = [];
    categoriesList.forEach(cat => {
      list.push({ label: `${cat.name} (Main)`, value: cat.name, attributes: cat.attributes || [] });
      cat.subcategories?.forEach(sub => {
        list.push({ 
          label: `— ${sub.name} [Sub of ${cat.name}]`, 
          value: sub.name, 
          attributes: [...(cat.attributes || []), ...(sub.attributes || [])] 
        });
      });
    });
    return list;
  }, [categoriesList]);

  const dynamicCategoryAttributes = useMemo(() => {
    const attrMap = new Map();
    formData.categories.forEach(catName => {
      const foundOption = availableCategoryOptions.find(opt => opt.value === catName);
      if (foundOption && foundOption.attributes) {
        foundOption.attributes.forEach(attr => {
          if (attr.name) attrMap.set(attr.name, { name: attr.name, type: attr.type || 'text' });
        });
      }
    });
    return Array.from(attrMap.values());
  }, [formData.categories, availableCategoryOptions]);

  useEffect(() => {
    if (modalMode === 'VIEW') return;
    setFormData(prev => {
      const existingAttributesMap = new Map(prev.attributes?.map(a => [a.key, { type: a.type || 'text', options: a.options || [{ label: '', image: '', variationImages: [''], stock: 0 }], value: a.value || '' }]));
      const updatedAttributes = dynamicCategoryAttributes.map(catAttr => {
        const existing = existingAttributesMap.get(catAttr.name);
        return {
          key: catAttr.name,
          type: catAttr.type,
          options: existing && Array.isArray(existing.options) && existing.options.length > 0 
            ? existing.options.map(opt => ({ ...opt, variationImages: opt.variationImages || [''], stock: opt.stock || 0 })) 
            : [{ label: '', image: '', variationImages: [''], stock: 0 }],
          value: existing && existing.value ? existing.value : ''
        };
      });
      return { ...prev, attributes: updatedAttributes };
    });
  }, [dynamicCategoryAttributes, modalMode]);

  const handleAttributeOptionChange = (attrIndex, optIndex, field, val) => {
    const updated = [...formData.attributes];
    if (!updated[attrIndex].options) updated[attrIndex].options = [{ label: '', image: '', variationImages: [''], stock: 0 }];
    updated[attrIndex].options[optIndex] = { ...updated[attrIndex].options[optIndex], [field]: val };
    setFormData({ ...formData, attributes: updated });
  };

  const handleVariationImageChange = (attrIndex, optIndex, varImgIndex, val) => {
    const updated = [...formData.attributes];
    if (!updated[attrIndex].options[optIndex].variationImages) {
      updated[attrIndex].options[optIndex].variationImages = [''];
    }
    updated[attrIndex].options[optIndex].variationImages[varImgIndex] = val;
    setFormData({ ...formData, attributes: updated });
  };

  const addVariationImageField = (attrIndex, optIndex) => {
    const updated = [...formData.attributes];
    if (!updated[attrIndex].options[optIndex].variationImages) {
      updated[attrIndex].options[optIndex].variationImages = [];
    }
    updated[attrIndex].options[optIndex].variationImages.push('');
    setFormData({ ...formData, attributes: updated });
  };

  const removeVariationImageField = (attrIndex, optIndex, varImgIndex) => {
    const updated = [...formData.attributes];
    updated[attrIndex].options[optIndex].variationImages = updated[attrIndex].options[optIndex].variationImages.filter((_, i) => i !== varImgIndex);
    setFormData({ ...formData, attributes: updated });
  };

  const addAttributeOptionField = (attrIndex) => {
    const updated = [...formData.attributes];
    if (!updated[attrIndex].options) updated[attrIndex].options = [];
    updated[attrIndex].options.push({ label: '', image: '', variationImages: [''], stock: 0 });
    setFormData({ ...formData, attributes: updated });
  };

  const removeAttributeOptionField = (attrIndex, optIndex) => {
    const updated = [...formData.attributes];
    updated[attrIndex].options = updated[attrIndex].options.filter((_, i) => i !== optIndex);
    setFormData({ ...formData, attributes: updated });
  };

  const handleDefaultValueChange = (key, val) => {
    const updated = formData.attributes.map(a => a.key === key ? { ...a, value: val } : a);
    setFormData({ ...formData, attributes: updated });
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || product.categories?.includes(selectedCategory);
    const matchesBrand = selectedBrand === 'ALL' || product.brand?._id === selectedBrand;
    return matchesSearch && matchesCategory && matchesBrand;
  });

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

  const handleOpenCreate = () => {
    setModalMode('CREATE');
    setFormData({
      title: '', slug: '', sku: '', description: '', price: '', offerPrice: '', comparePrice: '', stock: '',
      images: ['', '', ''], brand: brands[0] || null, categories: [], fitments: [], customTags: [], attributes: [], highlights: [],
      isFeatured: false, hasInquiry: false, whatsappNumber: globalSettings?.companyPhone || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product) => {
    setModalMode('EDIT');
    setCurrentProduct(product);
    const matchedBrand = brands.find(b => b._id === (product.brand?._id || product.brand)) || null;

    setFormData({
      title: product.title || '',
      slug: product.slug || '',
      sku: product.sku || '',
      description: product.description || '',
      price: product.price ?? '',
      offerPrice: product.offerPrice ?? '',
      comparePrice: product.comparePrice ?? '',
      stock: product.stock ?? '',
      images: product.images?.length ? [...product.images] : ['', '', ''],
      brand: matchedBrand,
      categories: product.categories || [],
      fitments: (product.fitments || []).map(fitment => ({ ...fitment, stock: fitment.stock ?? 0 })),
      customTags: product.customTags ? [...product.customTags] : [],
      attributes: product.attributes || [],
      highlights: product.highlights ? JSON.parse(JSON.stringify(product.highlights)) : [],
      isFeatured: !!product.isFeatured,
      hasInquiry: !!product.hasInquiry,
      whatsappNumber: product.whatsappNumber || globalSettings?.companyPhone || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenView = (product) => {
    setModalMode('VIEW');
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) { alert('Error deleting product'); }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const incompleteFitment = formData.fitments.some(fitment =>
      (fitment.make.trim() || fitment.model.trim() || fitment.year.trim()) &&
      !(fitment.make.trim() && fitment.model.trim() && fitment.year.trim())
    );
    if (incompleteFitment) {
      alert('Complete Make, Model, and Model Year for every vehicle with stock, or remove the empty vehicle row.');
      return;
    }

    const payload = {
      ...formData,
      brand: formData.brand?._id || formData.brand,
      price: formData.price === '' ? 0 : Number(formData.price),
      offerPrice: formData.offerPrice === '' ? null : Number(formData.offerPrice),
      comparePrice: formData.comparePrice === '' ? null : Number(formData.comparePrice),
      stock: Number(formData.stock),
      images: formData.images.filter(Boolean),
      fitments: formData.fitments
        .filter(fitment => fitment.make.trim() && fitment.model.trim() && fitment.year.trim())
        .map(fitment => ({
          make: fitment.make.trim(),
          model: fitment.model.trim(),
          year: fitment.year.trim(),
          stock: Math.max(0, Math.floor(Number(fitment.stock) || 0)),
          isDemo: Boolean(fitment.isDemo)
        })),
      customTags: formData.customTags,
      highlights: formData.highlights,
      whatsappNumber: globalSettings?.companyPhone || formData.whatsappNumber || ''
    };

    try {
      const url = modalMode === 'EDIT' && currentProduct ? `/api/products/${currentProduct._id}` : '/api/products';
      const method = modalMode === 'EDIT' ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        const savedFitments = data.data?.fitments || [];
        const stockSaveFailed = payload.fitments.some(fitment => {
          const savedFitment = savedFitments.find(saved =>
            saved.make === fitment.make && saved.model === fitment.model && saved.year === fitment.year
          );
          return Number(savedFitment?.stock) !== fitment.stock;
        });
        if (stockSaveFailed) {
          alert('The product was saved, but vehicle stock was not confirmed. Please reopen the product and check the stock values.');
          return;
        }
        setIsModalOpen(false);
        fetchData();
      } else alert(data.error || 'Unable to save product.');
    } catch (err) { alert('An error occurred while saving.'); }
  };

  const addImageField = () => setFormData({ ...formData, images: [...formData.images, ''] });
  const addFitment = () => setFormData({ ...formData, fitments: [...formData.fitments, { make: '', model: '', year: '', stock: 0 }] });
  const updateFitment = (index, field, value) => setFormData(previous => ({
    ...previous,
    fitments: previous.fitments.map((fitment, fitmentIndex) => fitmentIndex === index ? { ...fitment, [field]: value } : fitment)
  }));
  const removeFitment = (index) => setFormData(previous => ({
    ...previous,
    fitments: previous.fitments.filter((_, fitmentIndex) => fitmentIndex !== index)
  }));
  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages.length ? newImages : ['', '', ''] });
  };

  const addMainHighlightHeading = () => {
    setFormData({ ...formData, highlights: [...formData.highlights, { mainHeading: '', items: [{ heading: '', description: '' }] }] });
  };
  const removeMainHighlightHeading = (index) => {
    setFormData({ ...formData, highlights: formData.highlights.filter((_, i) => i !== index) });
  };
  const handleMainHeadingChange = (index, val) => {
    const updated = [...formData.highlights];
    updated[index].mainHeading = val;
    setFormData({ ...formData, highlights: updated });
  };
  const addHighlightItem = (mainIdx) => {
    const updated = [...formData.highlights];
    updated[mainIdx].items.push({ heading: '', description: '' });
    setFormData({ ...formData, highlights: updated });
  };
  const removeHighlightItem = (mainIdx, itemIdx) => {
    const updated = [...formData.highlights];
    updated[mainIdx].items = updated[mainIdx].items.filter((_, i) => i !== itemIdx);
    setFormData({ ...formData, highlights: updated });
  };
  const handleHighlightItemChange = (mainIdx, itemIdx, field, val) => {
    const updated = [...formData.highlights];
    updated[mainIdx].items[itemIdx][field] = val;
    setFormData({ ...formData, highlights: updated });
  };

  const handleOpenTagsModal = () => {
    setTagInputLabel('');
    setTagInputBgColor('#6600cc');
    setEditingTagIndex(null);
    setIsTagsModalOpen(true);
  };

  const handleSaveCustomTag = () => {
    if (!tagInputLabel.trim()) return;
    const newTags = [...formData.customTags];
    if (editingTagIndex !== null) {
      newTags[editingTagIndex] = { label: tagInputLabel, bgColor: tagInputBgColor };
      setEditingTagIndex(null);
    } else {
      newTags.push({ label: tagInputLabel, bgColor: tagInputBgColor });
    }
    setFormData({ ...formData, customTags: newTags });
    setTagInputLabel('');
    setTagInputBgColor('#6600cc');
  };

  const handleEditCustomTag = (index) => {
    setTagInputLabel(formData.customTags[index].label);
    setTagInputBgColor(formData.customTags[index].bgColor || '#6600cc');
    setEditingTagIndex(index);
  };

  const handleDeleteCustomTag = (index) => {
    setFormData({ ...formData, customTags: formData.customTags.filter((_, i) => i !== index) });
    if (editingTagIndex === index) {
      setTagInputLabel('');
      setEditingTagIndex(null);
    }
  };

  const hasColorImageAttribute = formData.attributes?.some(attr => attr.type === 'image' || attr.key.toLowerCase().includes('color'));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" fontWeight="bold">Products Management</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate} sx={{ bgcolor: '#6600cc' }}>Add Product</Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid #e2e8f0', mb: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell>IMAGE</TableCell>
              <TableCell>TITLE</TableCell>
              <TableCell>CUSTOM TAGS</TableCell>
              <TableCell>ATTRIBUTES & STOCK</TableCell>
              <TableCell>PRICE</TableCell>
              <TableCell align="right">ACTIONS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedProducts.map(p => {
              const firstColorAttr = p.attributes?.find(a => a.type === 'image' || a.key.toLowerCase().includes('color'));
              const firstVarImg = firstColorAttr?.options?.[0]?.variationImages?.[0];
              const displayImg = firstVarImg || p.images?.[0] || 'https://via.placeholder.com/150';

              return (
                <TableRow key={p._id} hover>
                  <TableCell><img src={displayImg} alt="" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} /></TableCell>
                  <TableCell><Typography variant="subtitle2" fontWeight="bold">{p.title}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {p.customTags?.map((t, idx) => (
                        <span key={idx} style={{ fontSize: '10px', background: t.bgColor, color: '#fff', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>{t.label}</span>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {p.attributes?.map((attr, aIdx) => (
                        <span key={aIdx} style={{ fontSize: '11px', background: '#f3e8ff', color: '#6b21a8', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                          {attr.key}: {attr.options?.map(o => `${o.label} (Stock: ${o.stock || 0})`).join(', ')}
                        </span>
                      ))}
                      {p.fitments?.map((fitment, fitmentIndex) => (
                        <span key={`${fitment.make}-${fitment.model}-${fitment.year}-${fitmentIndex}`} style={{ fontSize: '11px', background: '#ecfdf5', color: '#166534', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                          {fitment.make} {fitment.model} {fitment.year} (Stock: {fitment.stock ?? 0})
                        </span>
                      ))}
                      {!p.attributes?.length && !p.fitments?.length && (
                        <span style={{ fontSize: '11px', background: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: 4, fontWeight: 'bold' }}>
                          Product stock: {p.stock ?? 0}
                        </span>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{currencySymbol}{p.offerPrice || p.price}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => handleOpenView(p)}><Visibility fontSize="small" /></IconButton>
                    <IconButton onClick={() => handleOpenEdit(p)}><Edit fontSize="small" /></IconButton>
                    <IconButton onClick={() => handleDelete(p._id)}><Delete fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {filteredProducts.length ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
        </Typography>
        <Pagination count={totalPages} page={currentPage} onChange={(event, page) => setCurrentPage(page)} color="primary" showFirstButton showLastButton />
      </Box>

      {/* Product Dialog / Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="md" fullWidth slotProps={{ paper: { sx: { borderRadius: 1, maxHeight: 'calc(100% - 32px)' } } }}>
        <DialogTitle component="div" sx={{ bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">{modalMode === 'VIEW' ? 'Product Details' : 'Manage Product'}</Typography>
          <IconButton onClick={() => setIsModalOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        {modalMode === 'VIEW' && currentProduct ? (
          <DialogContent dividers sx={{ p: { xs: 2, md: 3 }, overflowY: 'auto' }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Product name</Typography><Typography fontWeight={700}>{currentProduct.title || '—'}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">SKU</Typography><Typography>{currentProduct.sku || '—'}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Slug</Typography><Typography sx={{ overflowWrap: 'anywhere' }}>{currentProduct.slug || '—'}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Brand</Typography><Typography>{currentProduct.brand?.name || brands.find(brand => brand._id === currentProduct.brand)?.name || '—'}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Price</Typography><Typography>{currentProduct.price == null ? 'Not set' : `${currencySymbol}${Number(currentProduct.price).toFixed(2)}`}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Offer price</Typography><Typography>{currentProduct.offerPrice == null ? 'Not set' : `${currencySymbol}${Number(currentProduct.offerPrice).toFixed(2)}`}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Product stock</Typography><Typography>{currentProduct.stock ?? 0}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Categories</Typography><Typography>{currentProduct.categories?.join(', ') || '—'}</Typography></Grid>
              <Grid size={{ xs: 12 }}><Divider /><Typography variant="subtitle2" fontWeight={800} sx={{ mt: 1 }}>Description</Typography><Typography sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>{currentProduct.description || '—'}</Typography></Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 1 }} /><Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Images</Typography>
                {currentProduct.images?.length ? <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{currentProduct.images.map((image, index) => <Box key={`${image}-${index}`} component="img" src={image} alt={`${currentProduct.title} ${index + 1}`} sx={{ width: 88, height: 72, objectFit: 'cover', border: '1px solid #dce2e8', borderRadius: 1 }} />)}</Box> : <Typography color="text.secondary">No product images.</Typography>}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 1 }} /><Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Category attributes and option stock</Typography>
                {currentProduct.attributes?.length ? currentProduct.attributes.map((attribute, index) => (
                  <Box key={`${attribute.key}-${index}`} sx={{ mb: 1.5 }}>
                    <Typography fontWeight={700}>{attribute.key} <Typography component="span" variant="caption" color="text.secondary">(default: {attribute.value || '—'})</Typography></Typography>
                    <Typography variant="body2" color="text.secondary">{attribute.options?.map(option => `${option.label}: stock ${option.stock ?? 0}`).join(' · ') || 'No options'}</Typography>
                  </Box>
                )) : <Typography color="text.secondary">No category attributes.</Typography>}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 1 }} /><Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Vehicle compatibility</Typography>
                {currentProduct.fitments?.length ? currentProduct.fitments.map((fitment, index) => <Typography key={index} variant="body2">{fitment.make} {fitment.model} ({fitment.year}) · Stock: {fitment.stock ?? 0}</Typography>) : <Typography color="text.secondary">No vehicle fitments.</Typography>}
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ mb: 1 }} /><Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Product highlights</Typography>
                {currentProduct.highlights?.length ? currentProduct.highlights.map((group, groupIndex) => (
                  <Box key={`${group.mainHeading}-${groupIndex}`} sx={{ mb: 1.5 }}>
                    <Typography fontWeight={700}>{group.mainHeading}</Typography>
                    {group.items?.map((item, itemIndex) => <Typography key={itemIndex} variant="body2" sx={{ ml: 1, mt: 0.5 }}><strong>{item.heading}:</strong> {item.description}</Typography>)}
                  </Box>
                )) : <Typography color="text.secondary">No product highlights.</Typography>}
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Featured</Typography><Typography>{currentProduct.isFeatured ? 'Yes' : 'No'}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">Enquiry enabled</Typography><Typography>{currentProduct.hasInquiry ? 'Yes' : 'No'}</Typography></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Typography variant="overline" color="text.secondary">WhatsApp number</Typography><Typography>{currentProduct.whatsappNumber || '—'}</Typography></Grid>
              <Grid size={{ xs: 12 }}><Typography variant="overline" color="text.secondary">Custom tags</Typography><Typography>{currentProduct.customTags?.map(tag => tag.label).join(', ') || '—'}</Typography></Grid>
            </Grid>
          </DialogContent>
        ) : <Box component="form" onSubmit={handleFormSubmit} sx={{ display: 'flex', minHeight: 0, flexDirection: 'column' }}>
          <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label="Title" size="small" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-') })} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth required label="Slug" size="small" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth required label="SKU" size="small" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth type="number" label="Price" size="small" value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, md: 4 }}><TextField fullWidth type="number" label="Offer Price" size="small" value={formData.offerPrice} onChange={e => setFormData({ ...formData, offerPrice: e.target.value })} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}><Autocomplete options={brands} getOptionLabel={o => o.name || ''} value={formData.brand} onChange={(e, v) => setFormData({ ...formData, brand: v })} renderInput={p => <TextField {...p} label="Brand" size="small" />} /></Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Autocomplete multiple options={availableCategoryOptions} getOptionLabel={o => o.label || o} value={formData.categories} onChange={(e, v) => setFormData({ ...formData, categories: v.map(item => typeof item === 'object' ? item.value : item) })} renderInput={p => <TextField {...p} label="Categories / Subcategories" size="small" />} />
              </Grid>
              {dynamicCategoryAttributes.length === 0 && formData.fitments.length === 0 && (
                <Grid size={{ xs: 12, md: 4 }}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Product Stock Quantity"
                    size="small"
                    value={formData.stock}
                    onChange={event => setFormData({ ...formData, stock: event.target.value })}
                    slotProps={{ htmlInput: { min: 0, step: 1 } }}
                    helperText="Used when the selected categories have no stock attributes."
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle2" fontWeight="bold">Vehicle Compatibility</Typography>
                  <Button size="small" onClick={addFitment} sx={{ textTransform: 'none' }}>Add vehicle</Button>
                </Box>
                {formData.fitments.map((fitment, index) => (
                  <Grid container spacing={1} key={index} sx={{ mb: 1.5, alignItems: 'center' }}>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="Make" value={fitment.make} onChange={e => updateFitment(index, 'make', e.target.value)} /></Grid>
                    <Grid size={{ xs: 12, sm: 4 }}><TextField fullWidth size="small" label="Model" value={fitment.model} onChange={e => updateFitment(index, 'model', e.target.value)} /></Grid>
                    <Grid size={{ xs: 6, sm: 2 }}><TextField fullWidth size="small" label="Model Year" value={fitment.year} onChange={e => updateFitment(index, 'year', e.target.value)} /></Grid>
                    <Grid size={{ xs: 5, sm: 1.5 }}><TextField fullWidth type="number" size="small" label="Stock" value={fitment.stock ?? ''} onChange={e => updateFitment(index, 'stock', e.target.value === '' ? '' : Math.max(0, Math.floor(Number(e.target.value) || 0)))} slotProps={{ htmlInput: { min: 0, step: 1 } }} /></Grid>
                    <Grid size={{ xs: 1, sm: 0.5 }}><IconButton color="error" size="small" onClick={() => removeFitment(index)} aria-label="Remove vehicle"><Close fontSize="small" /></IconButton></Grid>
                  </Grid>
                ))}
              </Grid>

              {/* Custom Tags Configurator Button & Display */}
              <Grid size={{ xs: 12 }}>
                <Button variant="outlined" startIcon={<CodeIcon />} onClick={handleOpenTagsModal} sx={{ textTransform: 'none', borderRadius: 2 }}>Configure Custom Tags</Button>
                <Box sx={{ display: 'flex', gap: 0.5, mt: 1.5, flexWrap: 'wrap' }}>
                  {formData.customTags.map((tag, idx) => (
                    <Chip key={idx} label={tag.label} sx={{ bgcolor: tag.bgColor, color: '#fff', fontWeight: 'bold' }} size="small" />
                  ))}
                </Box>
              </Grid>

              {/* Dynamic Category Attributes */}
              {formData.attributes && formData.attributes.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold" color="#6600cc" sx={{ mb: 1.5 }}>Configure attribute options, variation images, and stock by option</Typography>
                  {formData.attributes.map((attr, attrIdx) => (
                    <Paper key={attrIdx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ mb: 1, color: '#1e293b' }}>
                        Attribute: <span style={{ color: '#6600cc' }}>{attr.key}</span> ({attr.type || 'text'} type)
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        {Array.isArray(attr.options) && attr.options.map((opt, optIdx) => (
                          <Paper key={optIdx} variant="outlined" sx={{ p: 1.5, mb: 1.5, bgcolor: '#fff' }}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1, flexWrap: 'wrap' }}>
                              <TextField sx={{ flex: 2 }} size="small" placeholder="Option Label (e.g. Dark Green / S)" value={opt.label || ''} onChange={e => handleAttributeOptionChange(attrIdx, optIdx, 'label', e.target.value)} />
                              {attr.type === 'image' && (
                                <TextField sx={{ flex: 2 }} size="small" placeholder="Swatch Thumbnail URL" value={opt.image || ''} onChange={e => handleAttributeOptionChange(attrIdx, optIdx, 'image', e.target.value)} />
                              )}
                              <TextField sx={{ flex: 1, minWidth: 100 }} type="number" size="small" label="Stock Qty" value={opt.stock !== undefined ? opt.stock : 0} onChange={e => handleAttributeOptionChange(attrIdx, optIdx, 'stock', Number(e.target.value))} />
                              <IconButton color="error" size="small" onClick={() => removeAttributeOptionField(attrIdx, optIdx)}><Close fontSize="small" /></IconButton>
                            </Box>

                            {attr.type === 'image' && (
                              <Box sx={{ pl: 2, borderLeft: '2px solid #6600cc', mt: 1 }}>
                                <Typography variant="caption" fontWeight="bold" color="text.secondary">Variation Thumbnail Images for {opt.label || `Option #${optIdx + 1}`}:</Typography>
                                {opt.variationImages?.map((varImg, varImgIdx) => (
                                  <Box key={varImgIdx} sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
                                    <TextField fullWidth size="small" placeholder={`Variation Image URL #${varImgIdx + 1}`} value={varImg || ''} onChange={e => handleVariationImageChange(attrIdx, optIdx, varImgIdx, e.target.value)} />
                                    <IconButton color="error" size="small" onClick={() => removeVariationImageField(attrIdx, optIdx, varImgIdx)}><Close fontSize="small" /></IconButton>
                                  </Box>
                                ))}
                                <Button size="small" onClick={() => addVariationImageField(attrIdx, optIdx)} sx={{ mt: 1, textTransform: 'none' }}>+ Add Variation Image</Button>
                              </Box>
                            )}
                          </Paper>
                        ))}
                        <Button size="small" onClick={() => addAttributeOptionField(attrIdx)} sx={{ mt: 1 }}>+ Add Option</Button>
                      </Box>
                      <TextField fullWidth size="small" label="Default Selected Label" value={attr.value || ''} onChange={e => handleDefaultValueChange(attr.key, e.target.value)} />
                    </Paper>
                  ))}
                </Grid>
              )}

              {!hasColorImageAttribute && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" fontWeight="bold">PRODUCT IMAGE URLS (Multiple)</Typography>
                    <Button size="small" onClick={addImageField} sx={{ textTransform: 'none' }}>+ Add Image Slot</Button>
                  </Box>
                  {formData.images.map((img, idx) => (
                    <Box key={idx} sx={{ display: 'flex', gap: 1, mb: 1 }}>
                      <TextField fullWidth required size="small" placeholder={`Image URL #${idx + 1}`} value={img} onChange={e => {
                        const updated = [...formData.images];
                        updated[idx] = e.target.value;
                        setFormData({ ...formData, images: updated });
                      }} />
                      <IconButton color="error" onClick={() => removeImageField(idx)}><DeleteIcon fontSize="small" /></IconButton>
                    </Box>
                  ))}
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <FormControlLabel control={<Checkbox checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} />} label="Featured" />
                <FormControlLabel control={<Checkbox checked={formData.hasInquiry} onChange={e => setFormData({ ...formData, hasInquiry: e.target.checked })} />} label="Enable Inquiry" />
              </Grid>

              {/* Highlights */}
              <Grid size={{ xs: 12 }}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="#6600cc">Custom Multiple Product Highlights ("All Details")</Typography>
                  <Button size="small" variant="contained" onClick={addMainHighlightHeading} sx={{ bgcolor: '#6600cc' }}>+ Add Main Heading Group</Button>
                </Box>
                {formData.highlights.map((mainGroup, mainIdx) => (
                  <Paper key={mainIdx} variant="outlined" sx={{ p: 2, mb: 2, bgcolor: '#f8fafc' }}>
                    <Grid container spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
                      <Grid size={{ xs: 10 }}>
                        <TextField fullWidth required size="small" label="Main Heading" value={mainGroup.mainHeading} onChange={e => handleMainHeadingChange(mainIdx, e.target.value)} />
                      </Grid>
                      <Grid size={{ xs: 2 }} sx={{ textAlign: 'right' }}>
                        <Button size="small" color="error" onClick={() => removeMainHighlightHeading(mainIdx)}>Remove</Button>
                      </Grid>
                    </Grid>
                    <Box sx={{ pl: 2, borderLeft: '3px solid #6600cc' }}>
                      {mainGroup.items.map((item, itemIdx) => (
                        <Grid container spacing={1.5} key={itemIdx} sx={{ mb: 1, alignItems: 'center' }}>
                          <Grid size={{ xs: 5 }}><TextField fullWidth required size="small" label="Heading" value={item.heading} onChange={e => handleHighlightItemChange(mainIdx, itemIdx, 'heading', e.target.value)} /></Grid>
                          <Grid size={{ xs: 6 }}><TextField fullWidth required size="small" label="Description" value={item.description} onChange={e => handleHighlightItemChange(mainIdx, itemIdx, 'description', e.target.value)} /></Grid>
                          <Grid size={{ xs: 1 }}><IconButton color="error" size="small" onClick={() => removeHighlightItem(mainIdx, itemIdx)}><Close fontSize="small" /></IconButton></Grid>
                        </Grid>
                      ))}
                      <Button size="small" onClick={() => addHighlightItem(mainIdx)} sx={{ mt: 1 }}>+ Add Item</Button>
                    </Box>
                  </Paper>
                ))}
              </Grid>

              <Grid size={{ xs: 12 }}><TextField fullWidth required multiline rows={3} label="Description" size="small" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ bgcolor: '#6600cc' }}>Save Product</Button>
          </DialogActions>
        </Box>}
      </Dialog>

      {/* Custom Tags Configurator Popup */}
      <Dialog open={isTagsModalOpen} onClose={() => setIsTagsModalOpen(false)} maxWidth="sm" fullWidth slotProps={{ paper: { sx: { borderRadius: 3 } } }}>
        <DialogTitle component="div" sx={{ bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">Custom Tags Configuration</Typography>
          <IconButton onClick={() => setIsTagsModalOpen(false)} size="small"><Close /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>{editingTagIndex !== null ? 'Edit Tag' : 'Add New Tag'}</Typography>
            <Grid container spacing={2} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 6 }}><TextField fullWidth size="small" label="Tag Label" value={tagInputLabel} onChange={e => setTagInputLabel(e.target.value)} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><TextField fullWidth size="small" type="color" label="Color" value={tagInputBgColor} onChange={e => setTagInputBgColor(e.target.value)} slotProps={{ htmlInput: { sx: { height: 24, cursor: 'pointer' } } }} /></Grid>
              <Grid size={{ xs: 6, md: 3 }}><Button fullWidth variant="contained" onClick={handleSaveCustomTag} sx={{ bgcolor: '#6600cc', height: 40 }}>{editingTagIndex !== null ? 'Update' : 'Add'}</Button></Grid>
            </Grid>
          </Paper>

          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>Active Product Tags ({formData.customTags.length})</Typography>
            {formData.customTags.length === 0 ? (
              <Typography variant="body2" color="text.secondary">No custom tags added to this product yet.</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {formData.customTags.map((tag, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#fff' }}>
                    <Chip label={tag.label} sx={{ bgcolor: tag.bgColor, color: '#fff', fontWeight: 'bold' }} size="small" />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" onClick={() => handleEditCustomTag(idx)}>Edit</Button>
                      <Button size="small" color="error" variant="outlined" onClick={() => handleDeleteCustomTag(idx)}>Delete</Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, bgcolor: '#f8fafc' }}>
          <Button onClick={() => setIsTagsModalOpen(false)} variant="contained" sx={{ bgcolor: '#6600cc' }}>Done</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}