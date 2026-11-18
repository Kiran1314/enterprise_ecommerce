'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Box, Typography, Container, Grid, Paper, Divider,
  Autocomplete, Button, TextField
} from '@mui/material';
import { ExpandLess, ExpandMore, FilterList } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import PageLoader from '@/components/PageLoader';
import { getProductAvailableStock } from '@/lib/productAvailability';

const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function SubcategoryPage() {
  const params = useParams();
  const slug = params?.slug;

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedSlug, setLoadedSlug] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [currentCategory, setCurrentCategory] = useState(null);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);

  // Vehicle Filter States
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [mobileVehicleFilterOpen, setMobileVehicleFilterOpen] = useState(true);
  const [mobileCategoryFilterOpen, setMobileCategoryFilterOpen] = useState(false);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/products').then(res => res.json())
    ]).then(([catData, prodData]) => {
      if (catData.success) {
        const allCategories = Array.isArray(catData.data) ? catData.data : [];
        setCategories(allCategories);
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
      setLoadedSlug(slug);
    }).catch(() => {
      setLoading(false);
      setLoadedSlug(slug);
    });
  }, [slug]);

  const categoryProducts = useMemo(() => {
    const targetNames = currentSubcategory
      ? [currentSubcategory.name, currentSubcategory.slug]
      : [currentCategory?.name, currentCategory?.slug];
    const normalizedTargets = targetNames
      .filter(Boolean)
      .flatMap(value => [String(value).trim().toLowerCase(), slugify(value)]);

    return products.filter(product => {
      if (getProductAvailableStock(product) <= 0 || normalizedTargets.length === 0) return false;
      const productCategoryValues = (Array.isArray(product.categories) ? product.categories : [])
        .map(value => String(value || '').trim().toLowerCase());
      return productCategoryValues.some(value =>
        normalizedTargets.includes(value) || normalizedTargets.includes(slugify(value))
      );
    });
  }, [products, currentCategory, currentSubcategory]);

  // Extract unique fitment data only from available products in this category.
  const availableMakes = useMemo(() => {
    const makes = categoryProducts.flatMap(product =>
      product.fitments?.filter(fitment => Number(fitment.stock) > 0).map(fitment => fitment.make) || []
    );
    return [...new Set(makes.filter(Boolean))].sort();
  }, [categoryProducts]);

  const availableModels = useMemo(() => {
    if (!selectedMake) return [];
    const models = categoryProducts.flatMap(product =>
      product.fitments?.filter(fitment => fitment.make === selectedMake && Number(fitment.stock) > 0).map(fitment => fitment.model) || []
    );
    return [...new Set(models.filter(Boolean))].sort();
  }, [categoryProducts, selectedMake]);

  const availableYears = useMemo(() => {
    if (!selectedModel) return [];
    const years = categoryProducts.flatMap(product =>
      product.fitments?.filter(fitment =>
        fitment.make === selectedMake &&
        fitment.model === selectedModel &&
        Number(fitment.stock) > 0
      ).map(fitment => fitment.year) || []
    );
    return [...new Set(years.filter(Boolean))].sort();
  }, [categoryProducts, selectedMake, selectedModel]);

  const handleMakeChange = make => {
    setSelectedMake(make);
    setSelectedModel('');
    setSelectedYear('');
  };

  const handleModelChange = model => {
    setSelectedModel(model);
    setSelectedYear('');
  };

  const filteredProducts = categoryProducts.filter(product => {
    const matchesSearch = searchQuery ? String(product.title || '').toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
    // Vehicle fitment filter logic
    let matchesVehicle = true;
    if (selectedMake || selectedModel || selectedYear) {
      const fitments = product.fitments || [];
      matchesVehicle = fitments.some(f => {
        const makeMatch = selectedMake ? f.make === selectedMake : true;
        const modelMatch = selectedModel ? f.model === selectedModel : true;
        const yearMatch = selectedYear ? f.year === selectedYear : true;
        return makeMatch && modelMatch && yearMatch && Number(f.stock) > 0;
      });
    }

    return matchesSearch && matchesVehicle;
  });

  if (loading || loadedSlug !== slug) return <PageLoader title="Loading category products..." />;

  const pageTitle = currentSubcategory?.name || currentCategory?.name || slug.replace(/-/g, ' ');
  const selectedBrowseCategory = categories.find(category => category._id === currentCategory?._id);
  const renderCategoryLinks = categoryList => categoryList.map(category => {
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
  });
  const categoryLinks = renderCategoryLinks(categories);
  const otherCategoryLinks = renderCategoryLinks(
    categories.filter(category => category._id !== selectedBrowseCategory?._id)
  );
  const vehicleFilterControls = (
    <>
      <Autocomplete
        options={availableMakes}
        value={selectedMake || null}
        onChange={(event, value) => handleMakeChange(value || '')}
        renderInput={params => <TextField {...params} label="Make" placeholder="Search makes" size="small" />}
        isOptionEqualToValue={(option, value) => option === value}
        sx={{ mb: 2 }}
      />

      <Autocomplete
        options={availableModels}
        value={selectedModel || null}
        onChange={(event, value) => handleModelChange(value || '')}
        renderInput={params => <TextField {...params} label="Model" placeholder="Search models" size="small" />}
        isOptionEqualToValue={(option, value) => option === value}
        disabled={!selectedMake}
        sx={{ mb: 2 }}
      />

      <Autocomplete
        options={availableYears}
        value={selectedYear || null}
        onChange={(event, value) => setSelectedYear(value || '')}
        renderInput={params => <TextField {...params} label="Year" placeholder="Search years" size="small" />}
        isOptionEqualToValue={(option, value) => option === value}
        disabled={!selectedModel}
        sx={{ mb: 2 }}
      />

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
    </>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 1, sm: 2, md: 3 } }}>
          <Paper elevation={0} sx={{ display: { xs: 'block', md: 'none' }, p: 1.5, mb: 2, borderRadius: 1, bgcolor: '#fff' }}>
            <Button
              fullWidth
              onClick={() => setMobileVehicleFilterOpen(previous => !previous)}
              startIcon={<FilterList sx={{ color: 'var(--auto-red)' }} />}
              endIcon={mobileVehicleFilterOpen ? <ExpandLess /> : <ExpandMore />}
              aria-controls="mobile-vehicle-filter-options"
              aria-expanded={mobileVehicleFilterOpen}
              sx={{ justifyContent: 'space-between', textTransform: 'none', fontWeight: 'bold', color: 'text.primary' }}
            >
              VEHICLE COMPATIBILITY
            </Button>
            <Box id="mobile-vehicle-filter-options" sx={{ display: mobileVehicleFilterOpen ? 'block' : 'none', pt: 1.5 }}>
              {vehicleFilterControls}
            </Box>
          </Paper>

          <Grid container spacing={2}>
            {/* Left Filter Sidebar */}
            <Grid size={{ xs: 12, md: 3 }} sx={{ display: { xs: 'none', md: 'block' } }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 88, alignSelf: 'flex-start', height: 'calc(100vh - 104px)', maxHeight: 'calc(100vh - 104px)', minHeight: 320, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                  <FilterList sx={{ color: 'var(--auto-red)', fontSize: 20 }} /> Categories
                </Typography>

                {/* Category navigation filter */}
                <Box sx={{ mb: 2, flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1.25, display: 'block', flexShrink: 0 }}>BROWSE CATEGORIES</Typography>
                  <Box sx={{ display: 'grid', gap: 0.5, overflowY: 'auto', overscrollBehavior: 'contain', pr: 0.5, minHeight: 100, maxHeight: '34vh', scrollbarWidth: 'thin', '&::-webkit-scrollbar': { width: 6 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#cbd5e1', borderRadius: 6 } }}>
                    {categoryLinks}
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />

                {/* Vehicle Filter Section */}
                <Box sx={{ mb: 1, flex: '0 0 auto', minHeight: 0 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>VEHICLE COMPATIBILITY</Typography>
                  {vehicleFilterControls}
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

          <Paper elevation={0} sx={{ display: { xs: 'block', md: 'none' }, mt: 2, p: 1.5, borderRadius: 1, bgcolor: '#fff' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              CATEGORIES
            </Typography>
            {selectedBrowseCategory && (
              <Button
                component={Link}
                href={`/categories/${selectedBrowseCategory.slug || String(selectedBrowseCategory.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                fullWidth
                size="small"
                sx={{ justifyContent: 'flex-start', textAlign: 'left', textTransform: 'none', color: 'var(--auto-red)', fontWeight: 800, backgroundColor: '#fff4f4' }}
              >
                {currentSubcategory ? `${selectedBrowseCategory.name} / ${currentSubcategory.name}` : selectedBrowseCategory.name}
              </Button>
            )}
            <Button
              fullWidth
              size="small"
              onClick={() => setMobileCategoryFilterOpen(previous => !previous)}
              endIcon={mobileCategoryFilterOpen ? <ExpandLess /> : <ExpandMore />}
              aria-controls="mobile-other-category-links"
              aria-expanded={mobileCategoryFilterOpen}
              sx={{ justifyContent: 'space-between', mt: 0.5, textTransform: 'none' }}
            >
              {mobileCategoryFilterOpen ? 'Hide other categories' : 'Browse other categories'}
            </Button>
            <Box id="mobile-other-category-links" sx={{ display: mobileCategoryFilterOpen ? 'grid' : 'none', gap: 0.5, mt: 0.5, maxHeight: '35vh', overflowY: 'auto' }}>
              {otherCategoryLinks}
            </Box>
          </Paper>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}