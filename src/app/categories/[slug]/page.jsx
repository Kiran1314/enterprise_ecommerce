'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Box, Typography, Container, Grid, Paper, Slider, Divider,
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
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [currentSubcategoryName, setCurrentSubcategoryName] = useState('');

  // Vehicle Filter States
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/products').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([catData, prodData, settingsData]) => {
      if (catData.success) {
        setCategories(catData.data);
        // Find subcategory name matching slug[cite: 5]
        catData.data.forEach(cat => {
          cat.subcategories?.forEach(sub => {
            const subSlug = sub.slug || sub.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            if (subSlug === slug) {
              setCurrentSubcategoryName(sub.name);
            }
          });
        });
      }
      if (prodData.success) {
        const prods = prodData.data;
        setProducts(prods);
        const maxP = Math.max(...prods.map(p => p.offerPrice || p.price), 1000);
        setMaxPrice(maxP);
        setPriceRange([0, maxP]);
      }
      if (settingsData.success && settingsData.data?.currencySymbol) {
        setCurrency(settingsData.data.currencySymbol);
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
    const matchesSub = currentSubcategoryName ? p.categories?.includes(currentSubcategoryName) : true;
    const price = p.offerPrice || p.price;
    const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
    const matchesSearch = searchQuery ? p.title.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    
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

    return matchesSub && matchesPrice && matchesSearch && matchesVehicle;
  });

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}>Loading subcategory products...</Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Container maxWidth={false} sx={{ py: 3, px: { xs: 1, sm: 2, md: 3 } }}>
          <Grid container spacing={2}>
            {/* Left Filter Sidebar */}
            <Grid size={{ xs: 12, md: 3 }}>
              <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 80 }}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                  <FilterList sx={{ color: 'var(--auto-red)', fontSize: 20 }} /> Filters ({currentSubcategoryName || slug})
                </Typography>

                {/* Vehicle Filter Section */}
                <Box sx={{ mb: 3 }}>
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

                {/* Price Range Section */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>PRICE RANGE</Typography>
                  <Slider value={priceRange} onChange={(e, val) => setPriceRange(val)} valueLabelDisplay="auto" min={0} max={maxPrice} sx={{ color: 'var(--auto-red)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption">{currency}{priceRange[0]}</Typography>
                    <Typography variant="caption">{currency}{priceRange[1]}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            {/* Right Products Grid */}
            <Grid size={{ xs: 12, md: 9 }}>
              <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#fff' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, borderBottom: '1px solid #f0f0f0', pb: 2, textTransform: 'capitalize' }}>
                  {currentSubcategoryName || slug.replace(/-/g, ' ')} ({filteredProducts.length} items)
                </Typography>

                {filteredProducts.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>No products found in this subcategory</Typography>
                    <Typography variant="body2" color="text.secondary">Try adjusting your vehicle filters, price range, or search terms.</Typography>
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