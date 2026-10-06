'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Alert, Box, Button, Container, Divider, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Typography
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

export default function BrandProductsPage() {
  const { slug } = useParams();
  const [brand, setBrand] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [fitmentProducts, setFitmentProducts] = useState(null);
  const [makes, setMakes] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    let active = true;
    Promise.all([
      fetch('/api/brands').then(response => response.json()),
      fetch('/api/products').then(response => response.json()),
      fetch('/api/categories').then(response => response.json()),
      fetch(`/api/fitments?brand=${encodeURIComponent(slug)}`).then(response => response.json())
    ]).then(([brandResult, productResult, categoryResult, makeResult]) => {
      if (!active) return;
      const matchedBrand = brandResult.success ? brandResult.data.find(item => item.slug === slug) : null;
      setBrand(matchedBrand || null);
      const brandProducts = productResult.success
        ? productResult.data.filter(product => String(product.brand?._id || product.brand) === String(matchedBrand?._id))
        : [];
      setProducts(brandProducts);
      const usedCategories = new Set(brandProducts.flatMap(product => product.categories || []));
      setCategories(categoryResult.success ? categoryResult.data.filter(category => usedCategories.has(category.name)) : []);
      setMakes(makeResult.success ? makeResult.data : []);
      setLoading(false);
    }).catch(() => {
      if (active) {
        setError('Brand products could not be loaded. Please try again.');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [slug]);

  const loadFitmentOptions = async params => {
    const query = new URLSearchParams({ brand: slug, ...params });
    const response = await fetch(`/api/fitments?${query}`);
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Vehicle options could not be loaded.');
    return result.data;
  };

  const handleMakeChange = async value => {
    setMake(value);
    setModel('');
    setYear('');
    setModels([]);
    setYears([]);
    setFitmentProducts(null);
    setError('');
    if (!value) return;
    try {
      setModels(await loadFitmentOptions({ make: value }));
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const handleModelChange = async value => {
    setModel(value);
    setYear('');
    setYears([]);
    setFitmentProducts(null);
    setError('');
    if (!value) return;
    try {
      setYears(await loadFitmentOptions({ make, model: value }));
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  const handleFitmentSearch = async () => {
    if (!make || !model || !year) return;
    setFilterLoading(true);
    setError('');
    try {
      setFitmentProducts(await loadFitmentOptions({ make, model, year }));
      document.getElementById('brand-product-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setFilterLoading(false);
    }
  };

  const clearVehicleFilter = () => {
    setMake('');
    setModel('');
    setYear('');
    setModels([]);
    setYears([]);
    setFitmentProducts(null);
    setError('');
  };

  const visibleProducts = useMemo(() => {
    const source = fitmentProducts || products;
    const normalizedSearch = searchQuery.trim().toLowerCase();
    return source.filter(product => {
      const matchesCategory = !selectedCategory || product.categories?.includes(selectedCategory);
      const matchesSearch = !normalizedSearch || product.title?.toLowerCase().includes(normalizedSearch) || product.sku?.toLowerCase().includes(normalizedSearch);
      return matchesCategory && matchesSearch;
    });
  }, [fitmentProducts, products, searchQuery, selectedCategory]);

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}>Loading brand catalog...</Box>;
  if (!brand) return <Container sx={{ py: 8 }}><Alert severity="warning">This brand could not be found.</Alert><Button component={Link} href="/" sx={{ mt: 2 }}>Return to store</Button></Container>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 }, px: { xs: 1.5, md: 3 } }}>
          <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 2, border: '1px solid var(--auto-border)', borderTop: '3px solid var(--auto-red)', borderRadius: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box component="img" src={brand.logo || '/assets/images/logo/logo.jpg'} alt={`${brand.name} logo`} sx={{ width: { xs: 64, sm: 88 }, height: { xs: 52, sm: 68 }, objectFit: 'contain', flexShrink: 0 }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h1" variant="h5" fontWeight={850}>{brand.name} parts</Typography>
              <Typography variant="body2" color="text.secondary">Browse the catalog and filter by compatible vehicle.</Typography>
            </Box>
          </Paper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.5, border: '1px solid var(--auto-border)', borderRadius: 1, position: { md: 'sticky' }, top: { md: 110 } }}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}><FilterList fontSize="small" /> Filters</Typography>
                <Typography variant="caption" fontWeight={800} color="text.secondary">CATEGORIES</Typography>
                <Box sx={{ mt: 0.75, display: 'grid', gap: 0.5 }}>
                  <Button onClick={() => setSelectedCategory('')} sx={{ justifyContent: 'flex-start', textTransform: 'none', color: !selectedCategory ? 'var(--auto-red)' : 'text.primary', fontWeight: !selectedCategory ? 800 : 500 }}>All categories</Button>
                  {categories.map(category => <Button key={category._id} onClick={() => setSelectedCategory(category.name)} sx={{ justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none', color: selectedCategory === category.name ? 'var(--auto-red)' : 'text.primary', fontWeight: selectedCategory === category.name ? 800 : 500 }}>{category.name}</Button>)}
                </Box>
                <Divider sx={{ my: 2 }} />
                <Typography variant="caption" fontWeight={800} color="text.secondary">VEHICLE COMPATIBILITY</Typography>
                <Box sx={{ display: 'grid', gap: 1.5, mt: 1 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel id="brand-make-label">Make</InputLabel>
                    <Select labelId="brand-make-label" label="Make" value={make} onChange={event => handleMakeChange(event.target.value)}>
                      {makes.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth disabled={!make}>
                    <InputLabel id="brand-model-label">Model</InputLabel>
                    <Select labelId="brand-model-label" label="Model" value={model} onChange={event => handleModelChange(event.target.value)}>
                      {models.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl size="small" fullWidth disabled={!model}>
                    <InputLabel id="brand-year-label">Year</InputLabel>
                    <Select labelId="brand-year-label" label="Year" value={year} onChange={event => { setYear(event.target.value); setFitmentProducts(null); }}>
                      {years.map(value => <MenuItem key={value} value={value}>{value}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <Button variant="contained" disabled={!make || !model || !year || filterLoading} onClick={handleFitmentSearch} sx={{ bgcolor: 'var(--auto-red)', fontWeight: 800, textTransform: 'none' }}>
                    {filterLoading ? 'Finding parts...' : 'Find compatible parts'}
                  </Button>
                  {(make || fitmentProducts) && <Button onClick={clearVehicleFilter} sx={{ textTransform: 'none' }}>Clear vehicle filter</Button>}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 9 }} id="brand-product-results" sx={{ scrollMarginTop: 100 }}>
              <Typography component="h2" variant="h6" fontWeight={850} sx={{ mb: 2 }}>
                {fitmentProducts ? `${year} ${make} ${model} compatible parts` : selectedCategory || `${brand.name} products`} ({visibleProducts.length})
              </Typography>
              {visibleProducts.length === 0 ? (
                <Paper elevation={0} sx={{ p: 5, textAlign: 'center', border: '1px solid var(--auto-border)', borderRadius: 1 }}>
                  <Typography variant="h6" fontWeight={800}>No matching products</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Try another category or vehicle selection.</Typography>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {visibleProducts.map(product => <Grid key={product._id} size={{ xs: 12, sm: 6, lg: 4 }}><ProductCard product={product} /></Grid>)}
                </Grid>
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
