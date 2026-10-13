'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, Container, Grid, Paper, IconButton, Menu, MenuItem,
  FormControl, InputLabel, Select, Rating, Avatar, Alert, Tooltip
} from '@mui/material';
import { ChevronLeft, ChevronRight, KeyboardArrowDown } from '@mui/icons-material';
import Link from 'next/link';
import ProductCard from '@/components/ProductCard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FeaturedCategories from '@/components/FeaturedCategories';

const sampleReviews = [
  { authorName: 'Hammad Rahman', location: 'UAE', rating: 5, reviewText: 'Super RF Japan is a great shop with excellent products and services. The staff is friendly and knowledgeable, and they always go the extra mile to help customers. Highly recommended!', reviewDate: '27 July 2025' },
  { authorName: 'Aisha Al Mansoori', location: 'UAE', rating: 5, reviewText: 'The team helped confirm fitment before I ordered, and the part arrived well packed.' },
  { authorName: 'Khalid Al Nuaimi', location: 'UAE', rating: 5, reviewText: 'Quick response on availability and clear updates while my order was on the way.' },
  { authorName: 'Mariam Al Mazrouei', location: 'UAE', rating: 4, reviewText: 'Found the replacement part I needed without a long search. The listing was easy to follow.' },
  { authorName: 'Rashid Al Suwaidi', location: 'UAE', rating: 5, reviewText: 'Ordering was straightforward, and support answered my compatibility question.' },
  { authorName: 'Noor Al Kaabi', location: 'UAE', rating: 4, reviewText: 'A useful range of parts and helpful guidance when checking vehicle compatibility.' },
  { authorName: 'Saeed Al Ketbi', location: 'UAE', rating: 5, reviewText: 'The parcel arrived as scheduled and the item matched the product details.' }
];

export default function HomePage() {
  const [banners, setBanners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [fitmentMakes, setFitmentMakes] = useState([]);
  const [fitmentModels, setFitmentModels] = useState([]);
  const [fitmentYears, setFitmentYears] = useState([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [fitmentProducts, setFitmentProducts] = useState(null);
  const [fitmentLoading, setFitmentLoading] = useState(false);
  const [fitmentError, setFitmentError] = useState('');
  const [visibleProductCount, setVisibleProductCount] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const [activeCategoryMenu, setActiveCategoryMenu] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const catScrollRef = useRef(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/banners').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/products').then(res => res.json()),
      fetch('/api/brands').then(res => res.json())
    ]).then(([bannerData, catData, prodData, brandData]) => {
      if (bannerData.success) {
        let activeBanners = bannerData.data.filter(b => b.isActive);
        if (activeBanners.length > 0 && activeBanners.length < 3) {
          while (activeBanners.length < 3) {
            activeBanners = [...activeBanners, ...activeBanners];
          }
        }
        setBanners(activeBanners);
      }
      if (prodData.success) {
        const spareParts = prodData.data.filter(product => product.sku?.startsWith('SJ-'));
        const storefrontProducts = spareParts.length > 0 ? spareParts : prodData.data;
        setProducts(storefrontProducts);
        if (brandData.success) {
          const storefrontBrandIds = new Set(storefrontProducts.map(product => String(product.brand?._id || product.brand)));
          setBrands(brandData.data.filter(brand => storefrontBrandIds.has(String(brand._id))));
        }
        if (catData.success) {
          const sparePartCategories = new Set(storefrontProducts.flatMap(product => product.categories || []));
          const storefrontCategories = spareParts.length > 0
            ? catData.data.filter(category => sparePartCategories.has(category.name))
            : catData.data;
          setCategories(storefrontCategories);
        }
      } else if (catData.success) {
        setCategories(catData.data);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    Promise.all([
      fetch('/api/fitments').then(res => res.json()),
      fetch('/api/reviews').then(res => res.json())
    ]).then(([fitmentData, reviewData]) => {
      if (fitmentData.success) setFitmentMakes(fitmentData.data);
      if (reviewData.success) setReviews(reviewData.data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (banners.length <= 3 || isPaused || isDragging) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const maxScroll = sliderRef.current.scrollWidth - sliderRef.current.clientWidth;
        if (sliderRef.current.scrollLeft >= maxScroll - 10) {
          sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          sliderRef.current.scrollBy({ left: 350, behavior: 'smooth' });
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused, isDragging]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => { setIsDragging(false); setIsPaused(false); };
  const handleMouseUp = () => { setIsDragging(false); setIsPaused(false); };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleScrollCategories = (direction) => {
    if (catScrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      catScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const updateCatalogSearch = (value) => {
    setSearchQuery(value);
    setFitmentProducts(null);
    setVisibleProductCount(12);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(previous => previous === categoryName ? '' : categoryName);
    setFitmentProducts(null);
    setActiveCategoryMenu(null);
    setVisibleProductCount(12);
    requestAnimationFrame(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleMakeChange = async (make) => {
    setSelectedMake(make);
    setSelectedModel('');
    setSelectedYear('');
    setFitmentModels([]);
    setFitmentYears([]);
    setFitmentProducts(null);
    setVisibleProductCount(12);
    setFitmentError('');
    if (!make) return;

    try {
      const response = await fetch(`/api/fitments?make=${encodeURIComponent(make)}`);
      const result = await response.json();
      if (result.success) setFitmentModels(result.data);
    } catch {
      setFitmentError('Vehicle options could not be loaded. Please try again.');
    }
  };

  const handleModelChange = async (model) => {
    setSelectedModel(model);
    setSelectedYear('');
    setFitmentYears([]);
    setFitmentProducts(null);
    setVisibleProductCount(12);
    setFitmentError('');
    if (!model || !selectedMake) return;

    try {
      const params = new URLSearchParams({ make: selectedMake, model });
      const response = await fetch(`/api/fitments?${params}`);
      const result = await response.json();
      if (result.success) setFitmentYears(result.data);
    } catch {
      setFitmentError('Model years could not be loaded. Please try again.');
    }
  };

  const handleFitmentSearch = async (event) => {
    event.preventDefault();
    if (!selectedMake || !selectedModel || !selectedYear) return;

    setFitmentLoading(true);
    setFitmentError('');
    setSearchQuery('');
    try {
      const params = new URLSearchParams({ make: selectedMake, model: selectedModel, year: selectedYear });
      const response = await fetch(`/api/fitments?${params}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'Search failed');
      setFitmentProducts(result.data);
      setVisibleProductCount(12);
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch {
      setFitmentError('Parts could not be found right now. Please try again.');
    } finally {
      setFitmentLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const catalog = fitmentProducts || products;
    const q = searchQuery.toLowerCase();
    const selectedCategoryData = categories.find(category => category.name === selectedCategory);
    const categoryNames = selectedCategory ? [selectedCategory, ...(selectedCategoryData?.subcategories || []).map(sub => typeof sub === 'string' ? sub : sub.name)] : [];
    return catalog.filter(product => {
      const matchesSearch = !q || product.title?.toLowerCase().includes(q) || product.description?.toLowerCase().includes(q) || product.categories?.some(category => category.toLowerCase().includes(q));
      const matchesCategory = !selectedCategory || product.categories?.some(category => categoryNames.includes(category));
      return matchesSearch && matchesCategory;
    });
  }, [categories, fitmentProducts, products, searchQuery, selectedCategory]);

  const carouselReviews = [...sampleReviews, ...reviews];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={updateCatalogSearch} />

        {categories.length > 0 && (
          <Paper elevation={0} sx={{ bgcolor: 'rgba(255,255,255,.97)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--auto-border)', borderTop: '1px solid var(--auto-border)', py: 0.5, position: 'sticky', top: { xs: '115px', md: '97px' }, zIndex: 40, borderRadius: 0 }}>
            <Container maxWidth="xl" sx={{ px: { xs: 1.5, md: 4 }, display: 'flex', alignItems: 'center', minHeight: 64 }}>
              {categories.length > 9 && (
                <IconButton onClick={() => handleScrollCategories('left')} sx={{ position: 'absolute', left: 8, zIndex: 10, bgcolor: '#fff', boxShadow: 2 }} size="small">
                  <ChevronLeft fontSize="small" />
                </IconButton>
              )}

              <Box 
                ref={catScrollRef}
                sx={{ 
                  display: 'flex', gap: { xs: 0.5, md: 1 }, alignItems: 'center', overflowX: 'auto', overflowY: 'visible', scrollBehavior: 'smooth',
                  scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, mx: categories.length > 9 ? 4 : 0, width: '100%',
                  justifyContent: categories.length <= 9 ? { md: 'center' } : 'flex-start'
                }}
              >
                {categories.map((cat) => (
                  <Tooltip
                    key={cat._id}
                    title={<Typography variant="body2" fontWeight={750} sx={{ whiteSpace: 'normal', overflowWrap: 'anywhere', textAlign: 'center' }}>{cat.name}</Typography>}
                    placement="bottom"
                    arrow
                    enterDelay={250}
                    slotProps={{ tooltip: { sx: { maxWidth: 240, px: 1.5, py: 1, bgcolor: 'var(--auto-ink)', boxShadow: '0 8px 22px rgba(24,32,38,.22)' } }}}
                  >
                  <Box 
                    role="button"
                    tabIndex={0}
                    aria-label={`Show ${cat.name} products`}
                    aria-pressed={selectedCategory === cat.name}
                    onMouseEnter={(e) => {
                      if (cat.subcategories?.length > 0) {
                        setActiveCategoryMenu(cat);
                        setMenuAnchorEl(e.currentTarget);
                      }
                    }}
                    onClick={() => handleCategorySelect(cat.name)}
                    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handleCategorySelect(cat.name); } }}
                    sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                      width: { xs: 78, md: 92 }, minWidth: { xs: 78, md: 92 }, height: 66, flexShrink: 0, position: 'relative', borderRadius: 1,
                      color: selectedCategory === cat.name ? 'var(--auto-red)' : 'var(--auto-ink)',
                      '&:hover, &:focus-visible': { zIndex: 5, outline: 'none', transform: 'translateY(-3px) scale(1.06)' },
                      transition: 'transform 180ms cubic-bezier(.2,.8,.2,1), color 160ms ease'
                    }}
                  >
                    <img src={cat.icon || 'https://img.icons8.com/ios-filled/50/6600cc/shopping-bag.png'} alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 2 }} />
                    <Typography variant="caption" fontWeight={selectedCategory === cat.name ? 800 : 650} sx={{
                      width: '100%', px: 0.5, textAlign: 'center', lineHeight: 1.15, fontSize: '0.68rem',
                      display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden',
                      color: selectedCategory === cat.name ? 'var(--auto-red)' : 'var(--auto-ink)'
                    }}>
                      {cat.name}{cat.subcategories?.length > 0 && <KeyboardArrowDown sx={{ fontSize: 14, verticalAlign: 'middle' }} />}
                    </Typography>
                    <Box sx={{ position: 'absolute', bottom: 0, width: selectedCategory === cat.name ? 26 : 0, height: 2, bgcolor: 'var(--auto-red)', borderRadius: 1, transition: 'width 180ms ease' }} />
                  </Box>
                  </Tooltip>
                ))}
              </Box>

              <Menu
                anchorEl={menuAnchorEl}
                open={Boolean(activeCategoryMenu)}
                onClose={() => setActiveCategoryMenu(null)}
                slotProps={{ 
                  paper: { 
                    sx: { mt: 1, minWidth: 220, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' },
                    onMouseLeave: () => setActiveCategoryMenu(null) 
                  } 
                }}
              >
                <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ px: 2, pt: 1, display: 'block' }}>
                  {activeCategoryMenu?.name} Subcategories
                </Typography>
                {activeCategoryMenu?.subcategories?.map((sub, sIdx) => {
                  const subName = typeof sub === 'string' ? sub : (sub.name || 'Subcategory');
                  const subSlug = typeof sub === 'object' && sub.slug ? sub.slug : subName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                  const subIcon = typeof sub === 'object' && sub.icon ? sub.icon : (activeCategoryMenu.icon || 'https://img.icons8.com/ios-filled/50/6600cc/shopping-bag.png');

                  return (
                    <MenuItem 
                      key={sIdx}
                      component={Link}
                      href={`/categories/${subSlug}`}
                      onClick={() => setActiveCategoryMenu(null)}
                      sx={{ gap: 1.5, py: 1.5, '&:hover': { bgcolor: '#fff1f0', color: 'var(--auto-red)' } }}
                    >
                      <img src={subIcon} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                      <Typography variant="body2" fontWeight="bold">{subName}</Typography>
                    </MenuItem>
                  );
                })}
              </Menu>

              {categories.length > 9 && (
                <IconButton onClick={() => handleScrollCategories('right')} sx={{ position: 'absolute', right: 8, zIndex: 10, bgcolor: '#fff', boxShadow: 2 }} size="small">
                  <ChevronRight fontSize="small" />
                </IconButton>
              )}
            </Container>
          </Paper>
        )}

        <Box
          component="section"
          aria-labelledby="vehicle-search-title"
          sx={{
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: 'var(--auto-ink)',
            backgroundImage: 'linear-gradient(90deg, rgba(31,34,46,.94) 0%, rgba(31,34,46,.84) 48%, rgba(31,34,46,.32) 100%), url("/fullbanner.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center 55%',
            borderBottom: '4px solid var(--auto-red)'
          }}
        >
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 }, py: { xs: 4, md: 5 } }}>
            <Grid container spacing={4} sx={{ alignItems: 'center' }}>
              <Grid size={{ xs: 12, md: 8, lg: 7 }}>
                <Typography variant="overline" sx={{ color: 'var(--auto-yellow)', fontWeight: 800, letterSpacing: 1.5 }}>
                  SUPER JAPAN · PREMIUM QUALITY PARTS
                </Typography>
                <Typography id="vehicle-search-title" variant="h3" component="h1" sx={{ color: '#fff', fontWeight: 900, lineHeight: 1.08, mb: 2, fontSize: { xs: '2rem', md: '2.7rem' } }}>
                  Auto Spare Parts for Sale in UAE
                </Typography>
                <Paper component="form" onSubmit={handleFitmentSearch} elevation={8} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 1, border: '2px solid var(--auto-red)', maxWidth: 760 }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: 'var(--auto-red)', mb: 2 }}>
                    Search Your Part Here
                  </Typography>
                  <Grid container spacing={1.25}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl size="small" fullWidth>
                        <InputLabel id="vehicle-make-label">Select Your Make</InputLabel>
                        <Select labelId="vehicle-make-label" label="Select Your Make" value={selectedMake} onChange={event => handleMakeChange(event.target.value)}>
                          {fitmentMakes.map(make => <MenuItem key={make} value={make}>{make}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl size="small" fullWidth disabled={!selectedMake}>
                        <InputLabel id="vehicle-model-label">Select Your Model</InputLabel>
                        <Select labelId="vehicle-model-label" label="Select Your Model" value={selectedModel} onChange={event => handleModelChange(event.target.value)}>
                          {fitmentModels.map(model => <MenuItem key={model} value={model}>{model}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <FormControl size="small" fullWidth disabled={!selectedModel}>
                        <InputLabel id="vehicle-year-label">Select Your Model Year</InputLabel>
                        <Select labelId="vehicle-year-label" label="Select Your Model Year" value={selectedYear} onChange={event => { setSelectedYear(event.target.value); setFitmentProducts(null); setFitmentError(''); }}>
                          {fitmentYears.map(year => <MenuItem key={year} value={year}>{year}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Button type="submit" fullWidth variant="contained" disabled={!selectedMake || !selectedModel || !selectedYear || fitmentLoading} sx={{ bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' }, color: '#fff', fontWeight: 800, textTransform: 'none', py: 1.15, borderRadius: 5 }}>
                        {fitmentLoading ? 'Searching parts...' : 'Find My Part'}
                      </Button>
                    </Grid>
                  </Grid>
                  {fitmentError && <Typography role="alert" variant="body2" color="error" sx={{ mt: 1.5 }}>{fitmentError}</Typography>}
                  {fitmentMakes.length === 0 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Vehicle fitments are being added to the catalog.</Typography>}
                </Paper>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {banners.length > 0 && (
          <Container maxWidth="xl" sx={{ py: 2, px: { xs: 2, md: 4 } }}>
            <Box 
              ref={sliderRef}
              onMouseDown={handleMouseDown}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              sx={{ display: 'flex', gap: 2, overflowX: 'auto', cursor: isDragging ? 'grabbing' : 'grab', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, py: 1 }}
            >
              {banners.map((banner, idx) => (
                <Box 
                  key={idx}
                  sx={{ 
                    minWidth: { xs: '100%', sm: 'calc(33.333% - 11px)' }, height: 220, borderRadius: 1, overflow: 'hidden', position: 'relative', flexShrink: 0, borderBottom: '4px solid var(--auto-yellow)',
                    boxShadow: '0 2px 4px 0 rgba(0,0,0,.08)', backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${banner.image})`,
                    backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: 3, color: '#fff', userSelect: 'none'
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{banner.title}</Typography>
                  <Typography variant="body2" color="grey.200" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{banner.subtitle}</Typography>
                  <Button component={Link} href={banner.link || '#products'} variant="contained" size="small" sx={{ width: 'fit-content', textTransform: 'none', bgcolor: 'var(--auto-yellow)', color: 'var(--auto-ink)', fontWeight: 'bold', borderRadius: 1, '&:hover': { bgcolor: '#ffd04a' } }}>
                    Explore Now
                  </Button>
                </Box>
              ))}
            </Box>
          </Container>
        )}

     <FeaturedCategories />

 

        {carouselReviews.length > 0 && <Box component="section" aria-labelledby="owner-reviews-title" sx={{ bgcolor: '#fff', py: { xs: 3, md: 4 }, borderBottom: '1px solid var(--auto-border)' }}>
          <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
            <Typography id="owner-reviews-title" variant="h5" component="h2" fontWeight={850} sx={{ mb: 2.5, textAlign: 'center' }}>
              Customer reviews
            </Typography>
            <Box sx={{ overflow: 'hidden', py: 1, '&:hover .review-marquee-track, &:focus-within .review-marquee-track': { animationPlayState: 'paused' }, '@media (prefers-reduced-motion: reduce)': { '& .review-marquee-track': { animation: 'none' } } }}>
              <Box className="review-marquee-track" sx={{ display: 'flex', width: 'max-content', gap: 2, animation: 'review-scroll 42s linear infinite', '@keyframes review-scroll': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } } }}>
                {[...carouselReviews, ...carouselReviews].map((review, index) => (
                  <Tooltip
                    key={`${review._id || review.authorName}-${index}`}
                    title={<Typography variant="body2" sx={{ whiteSpace: 'normal' }}>{review.reviewText}</Typography>}
                    placement="top"
                    arrow
                    enterDelay={250}
                    slotProps={{ tooltip: { sx: { maxWidth: 360, p: 1.5 } } }}
                  >
                    <Paper tabIndex={0} elevation={0} sx={{ width: { xs: 'min(82vw, 320px)', sm: 340 }, height: 190, flexShrink: 0, p: 2.25, border: '1px solid var(--auto-border)', borderTop: '3px solid var(--auto-red)', borderRadius: 1, display: 'flex', flexDirection: 'column', cursor: 'help', '&:focus-visible': { outline: '2px solid var(--auto-red)', outlineOffset: 2 } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
                        <Avatar src={review.profilePhotoUrl} alt={review.authorName} sx={{ width: 38, height: 38, bgcolor: 'var(--auto-ink)' }}>{review.authorName?.[0]}</Avatar>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={800} noWrap>{review.authorName}</Typography>
                          <Typography variant="caption" color="text.secondary">{review.location || 'UAE'}</Typography>
                          <Rating value={review.rating} readOnly size="small" />
                        </Box>
                      </Box>
                      {review.reviewDate && <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5 }}>{review.reviewDate}</Typography>}
                      <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical' }}>{review.reviewText}</Typography>
                    </Paper>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Container>
        </Box>}

        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, md: 4 }, scrollMarginTop: { xs: '190px', md: '166px' } }} id="products">
          <Paper elevation={0} sx={{ p: 3, borderRadius: 1, borderTop: '3px solid var(--auto-red)', boxShadow: '0 2px 8px rgba(32,35,38,.07)', bgcolor: '#fff' }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'text.primary', borderBottom: '1px solid #f0f0f0', pb: 2 }}>
              {fitmentProducts ? `Parts for ${selectedYear} ${selectedMake} ${selectedModel}` : selectedCategory ? `${selectedCategory} parts` : searchQuery ? `Search Results for "${searchQuery}"` : 'Featured Products'}
            </Typography>

            {fitmentProducts?.some(product => product.isDemoData) && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Demo fitment records are for testing only and do not confirm real vehicle compatibility.
              </Alert>
            )}

            {loading ? (
              <Typography color="text.secondary" sx={{ py: 6, textAlign: 'center' }}>Loading catalog...</Typography>
            ) : filteredProducts.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>{fitmentProducts ? 'No parts found for this vehicle' : 'No products found'}</Typography>
                <Button onClick={() => { updateCatalogSearch(''); setSelectedCategory(''); setFitmentProducts(null); }} variant="contained" sx={{ textTransform: 'none', borderRadius: 1, bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' } }}>Clear Filters</Button>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {filteredProducts.slice(0, visibleProductCount).map(product => (
                  <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }} key={product._id}>
                    <ProductCard product={JSON.parse(JSON.stringify(product))} />
                  </Grid>
                ))}
                {filteredProducts.length > visibleProductCount && (
                  <Grid size={{ xs: 12 }} sx={{ display: 'flex', justifyContent: 'center', pt: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => setVisibleProductCount(count => count + 12)}
                      sx={{ px: 5, py: 1, borderColor: 'var(--auto-ink)', color: 'var(--auto-ink)', fontWeight: 800, textTransform: 'none', '&:hover': { borderColor: 'var(--auto-red)', color: 'var(--auto-red)', bgcolor: 'rgba(216,117,50,.06)' } }}
                    >
                      Load More
                    </Button>
                  </Grid>
                )}
              </Grid>
            )}
          </Paper>
        </Container>

        {brands.length > 0 && (
          <Box component="section" aria-labelledby="choose-by-brands-title" sx={{ bgcolor: '#fff', borderTop: '1px solid var(--auto-border)', py: { xs: 3, md: 4 } }}>
            <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 2.5 }}>
                <Typography id="choose-by-brands-title" component="h2" variant="h5" fontWeight={850}>Choose by brands</Typography>
                <Typography variant="body2" color="text.secondary">Browse available parts by manufacturer</Typography>
              </Box>
              <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                {brands.map(brand => (
                  <Grid key={brand._id} size={{ xs: 4, sm: 3, md: 2, lg: 1.5 }}>
                    <Paper component={Link} href={`/brands/${brand.slug}`} elevation={0} sx={{
                      minHeight: { xs: 90, sm: 108 }, p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                      textDecoration: 'none', color: 'var(--auto-ink)', border: '1px solid var(--auto-border)', borderRadius: 1,
                      transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                      '&:hover, &:focus-visible': { transform: 'translateY(-3px)', borderColor: 'var(--auto-red)', boxShadow: '0 8px 20px rgba(24,32,38,.1)', outline: 'none' }
                    }}>
                      <Box component="img" src={brand.logo || '/assets/images/logo/logo.jpg'} alt={`${brand.name} logo`} sx={{ width: '100%', height: { xs: 42, sm: 52 }, objectFit: 'contain' }} />
                      <Typography variant="caption" fontWeight={800} sx={{ textAlign: 'center', lineHeight: 1.2 }}>{brand.name}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        )}
      </Box>

      <Footer />
    </Box>
  );
}