'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Box, Typography, Container, Grid, Paper, Divider,
  FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';

export default function SubcategoryPage() {
  const params = useParams();
  const slug = params?.slug;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);

  // Vehicle Filter States
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/products').then(res => res.json())
    ]).then(([catData, prodData]) => {
      if (catData.success) {
        const allCategories = Array.isArray(catData.data) ? catData.data : [];
        setCategories(allCategories);
        const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        const matchedCategory = allCategories.find(category =>
          slugify(category.slug || category.name) === slug
        ) || null;
        const matchedSubcategory = allCategories
          .flatMap(category => (category.subcategories || []).map(subcategory => ({ ...subcategory, parentCategory: category })))
          .find(subcategory => slugify(subcategory.slug || subcategory.name) === slug) || null;
        setCurrentCategory(matchedCategory || matchedSubcategory?.parentCategory || null);
        setCurrentSubcategory(matchedSubcategory);
      }
      if (prodData.success) {
        setProducts(Array.isArray(prodData.data) ? prodData.data : []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  // Extract unique fitment data for filter dropdowns
  const availableMakes = useMemo(() => {
    const makes = products.flatMap(p => p.fitments?.map(f => f.make) || []);
    return [...new Set(makes.filter(Boolean))].sort();
  }, [products]);

  const availableModels = useMemo(() => {
    if (!selectedMake) return [];
    const models = products.flatMap(p => 
      p.fitments?.filter(f => f.make === selectedMake).map(f => f.model) || []
    );
    return [...new Set(models.filter(Boolean))].sort();
  }, [products, selectedMake]);

  const availableYears = useMemo(() => {
    if (!selectedModel) return [];
    const years = products.flatMap(p => 
      p.fitments?.filter(f => f.make === selectedMake && f.model === selectedModel).map(f => f.year) || []
    );
    return [...new Set(years.filter(Boolean))].sort();
  }, [products, selectedMake, selectedModel]);

  const handleMakeChange = (e) => {
    setSelectedMake(e.target.value);
    setSelectedModel('');
    setSelectedYear('');
  };

  const handleModelChange = (e) => {
    setSelectedModel(e.target.value);
    setSelectedYear('');
  };

  const filteredProducts = products.filter(p => {
    const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const productCategoryValues = (Array.isArray(p.categories) ? p.categories : [])
      .map(value => String(value || '').trim().toLowerCase());
    const targetNames = currentSubcategory
      ? [currentSubcategory.name, currentSubcategory.slug]
      : [currentCategory?.name, currentCategory?.slug];
    const normalizedTargets = targetNames.filter(Boolean).flatMap(value => [String(value).trim().toLowerCase(), slugify(value)]);
    // Match only the category represented by this URL. Do not fall back to all products
    // when a category slug cannot be resolved.
    const matchesSub = normalizedTargets.length > 0 && productCategoryValues.some(value =>
      normalizedTargets.includes(value) || normalizedTargets.includes(slugify(value))
    );
    const matchesSearch = searchQuery ? String(p.title || '').toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    // Vehicle fitment filter logic
    let matchesVehicle = true;
    if (selectedMake || selectedModel || selectedYear) {
      const fitments = p.fitments || [];
      matchesVehicle = fitments.some(f => {
        const makeMatch = selectedMake ? f.make === selectedMake : true;
        const modelMatch = selectedModel ? f.model === selectedModel : true;
        const yearMatch = selectedYear ? f.year === selectedYear : true;
        return makeMatch && modelMatch && yearMatch;
      });
    }

    return matchesSub && matchesSearch && matchesVehicle;
  });

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}>Loading category products...</Box>;

  const pageTitle = currentSubcategory?.name || currentCategory?.name || slug.replace(/-/g, ' ');

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 1, sm: 2, md: 3 } }}>
          <Grid container spacing={2}>
            {/* Left Filter Sidebar */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 88, alignSelf: 'flex-start', height: 'calc(100vh - 104px)', maxHeight: 'calc(100vh - 104px)', minHeight: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                  <FilterList sx={{ color: 'var(--auto-red)', fontSize: 20 }} /> Categories
                </Typography>

                {/* Category navigation filter */}
                <Box sx={{ mb: 2, flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1.25, display: 'block', flexShrink: 0 }}>BROWSE CATEGORIES</Typography>
                  <Box sx={{ display: 'grid', gap: 0.5, overflowY: 'auto', overscrollBehavior: 'contain', pr: 0.5, minHeight: 100, maxHeight: '34vh', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 6 } }}>
                    {categories.map(category => {
                      const isActive = category._id === currentCategory?._id && !currentSubcategory;
                      return (
                        <Button
                          key={category._id}
                          component={Link}
                          href={`/categories/${category.slug || String(category.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                          fullWidth
                          size="small"
                          sx={{ justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none', color: isActive ? 'var(--auto-red)' : 'text.primary', fontWeight: isActive ? 800 : 500, backgroundColor: isActive ? '#fff4f4' : 'transparent', '&:hover': { backgroundColor: '#fff4f4' } }}
                        >
                          {category.name}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />

                {/* Vehicle Filter Section */}
                <Box sx={{ mb: 1, flex: '0 0 auto', minHeight: 0 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>VEHICLE COMPATIBILITY</Typography>
                  
                  <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                    <InputLabel>Make</InputLabel>
                    <Select value={selectedMake} label="Make" onChange={handleMakeChange}>
                      <MenuItem value=""><em>All Makes</em></MenuItem>
                      {availableMakes.map(make => <MenuItem key={make} value={make}>{make}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={!selectedMake}>
                    <InputLabel>Model</InputLabel>
                    <Select value={selectedModel} label="Model" onChange={handleModelChange}>
                      <MenuItem value=""><em>All Models</em></MenuItem>
                      {availableModels.map(model => <MenuItem key={model} value={model}>{model}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={!selectedModel}>
                    <InputLabel>Year</InputLabel>
                    <Select value={selectedYear} label="Year" onChange={(e) => setSelectedYear(e.target.value)}>
                      <MenuItem value=""><em>All Years</em></MenuItem>
                      {availableYears.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {(selectedMake || selectedModel || selectedYear) && (
                    <Button 
                      fullWidth 
                      variant="outlined" 
                      size="small" 
                      onClick={() => { setSelectedMake(''); setSelectedModel(''); setSelectedYear(''); }}
                      sx={{ color: 'var(--auto-red)', borderColor: 'var(--auto-red)', '&:hover': { borderColor: 'var(--auto-red)', backgroundColor: '#fff5f5' } }}
                    >
                      Clear Vehicle Filters
                    </Button>
                  )}
                </Box>
                
                <Divider sx={{ my: 2 }} />

              </Paper>
            </Grid>

            {/* Right Products Grid */}
            <Grid size={{ xs: 12, md: 9 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#fff' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, borderBottom: '1px solid #f0f0f0', pb: 2, textTransform: 'capitalize' }}>
                  {pageTitle} ({filteredProducts.length} items)
                </Typography>

                {filteredProducts.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>No products found in this category</Typography>
                    <Typography variant="body2" color="text.secondary">Try another category, adjust your vehicle filters, or change your search terms.</Typography>
                  </Box>
                ) : (
                  <Grid container spacing={2}>
                    {filteredProducts.map(product => (
                      <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={product._id}>
                        <ProductCard product={JSON.parse(JSON.stringify(product))} />
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}