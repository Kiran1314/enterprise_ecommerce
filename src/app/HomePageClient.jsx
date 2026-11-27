'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Box, Typography, Button, Container, Grid, Paper, IconButton, Menu, MenuItem,
  Rating, Avatar, Alert, Tooltip, Fade
} from '@mui/material';
import { ChevronLeft, ChevronRight, KeyboardArrowDown, Settings } from '@mui/icons-material';
import Link from 'next/link';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import FitmentSearch from './FitmentSearch';
import FeaturedCategories from '@/components/FeaturedCategories';
import Footer from '@/components/Footer';
import StoreHighlights from '@/components/StoreHighlights';

const sampleReviews = [
  { authorName: 'Hammad Rahman', location: 'UAE', rating: 5, reviewText: 'Super RF Japan is a great shop with excellent products and services. The staff is friendly and knowledgeable, and they always go the extra mile to help customers. Highly recommended!', reviewDate: '27 July 2025' },
  { authorName: 'Aisha Al Mansoori', location: 'UAE', rating: 5, reviewText: 'The team helped confirm fitment before I ordered, and the part arrived well packed.' },
  { authorName: 'Khalid Al Nuaimi', location: 'UAE', rating: 5, reviewText: 'Quick response on availability and clear updates while my order was on the way.' },
  { authorName: 'Mariam Al Mazrouei', location: 'UAE', rating: 4, reviewText: 'Found the replacement part I needed without a long search. The listing was easy to follow.' },
  { authorName: 'Rashid Al Suwaidi', location: 'UAE', rating: 5, reviewText: 'Ordering was straightforward, and support answered my compatibility question.' },
  { authorName: 'Noor Al Kaabi', location: 'UAE', rating: 4, reviewText: 'A useful range of parts and helpful guidance when checking vehicle compatibility.' },
  { authorName: 'Saeed Al Ketbi', location: 'UAE', rating: 5, reviewText: 'The parcel arrived as scheduled and the item matched the product details.' }
];

export default function HomePageClient({ initialData, initialFitmentProducts, fitmentSearch }) {
  const { banners, categories, brands, products, reviews, storeHighlights = [] } = initialData;
  const { make: selectedMake, model: selectedModel, year: selectedYear } = fitmentSearch;
  const [fitmentProducts, setFitmentProducts] = useState(initialFitmentProducts);
  const [visibleProductCount, setVisibleProductCount] = useState(12);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [activeCategoryMenu, setActiveCategoryMenu] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);

  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const catScrollRef = useRef(null);

  // Staggered Cascade Animation State
  const pageLoaded = true;

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
    setSelectedCategory(''); // Ensure category state is cleared so search heading displays
    setFitmentProducts(null);
    setVisibleProductCount(12);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(previous => previous === categoryName ? '' : categoryName);
    setSearchQuery(''); // Clear search query when selecting a category
    setFitmentProducts(null);
    setActiveCategoryMenu(null);
    setVisibleProductCount(12);
    requestAnimationFrame(() => document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const filteredProducts = useMemo(() => {
    const catalog = fitmentProducts || products;
    const q = searchQuery.toLowerCase();
    const selectedCategoryData = categories.find(category => category.name === selectedCategory);
    const categoryNames = selectedCategory ? [selectedCategory, ...(selectedCategoryData?.subcategories || []).map(sub => typeof sub === 'string' ? sub : sub.name)] : [];
    return catalog.filter(product => {
      const matchesSearch = !q || product.title?.toLowerCase().includes(q) || product.sku?.toLowerCase().includes(q) || product.description?.toLowerCase().includes(q) || product.categories?.some(category => category.toLowerCase().includes(q));
      const matchesCategory = !selectedCategory || product.categories?.some(category => categoryNames.includes(category));
      return matchesSearch && matchesCategory;
    });
  }, [categories, fitmentProducts, products, searchQuery, selectedCategory]);

  const brandsForDisplay = brands.filter(brand => brand.name?.trim().toLowerCase() !== 'generic');
  const carouselReviews = [...sampleReviews, ...reviews];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header 
          categories={categories} 
          brands={brands}
          products={products}
          searchQuery={searchQuery} 
          setSearchQuery={updateCatalogSearch} 
        />

        {/* 1. Categories Menu */}
        {categories.length > 0 && (
          <Fade in={pageLoaded} timeout={600}>
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
                  {categories.map((cat, index) => (
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
                        '@keyframes fadeCat': { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
                        animation: 'fadeCat 0.4s ease-out forwards',
                        animationDelay: `${index * 30}ms`,
                        opacity: 0,
                        '&:hover, &:focus-visible': { zIndex: 5, outline: 'none', transform: 'translateY(-3px) scale(1.06)' },
                        transition: 'transform 180ms cubic-bezier(.2,.8,.2,1), color 160ms ease'
                      }}
                    >
                      <img loading="lazy" src={cat.icon || 'https://img.icons8.com/ios-filled/50/6600cc/shopping-bag.png'} alt="" style={{ width: 28, height: 28, objectFit: 'contain', marginBottom: 2 }} />
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
                        <img loading="lazy" src={subIcon} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />
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
          </Fade>
        )}

        {/* 2. Hero Fitment Search Section Fade */}
        <Fade in={pageLoaded} timeout={1000}>
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
                  <FitmentSearch
                    modelsByMake={initialData.modelsByMake}
                    makes={initialData.fitmentMakes}
                    initialMake={fitmentSearch.make}
                    initialModel={fitmentSearch.model}
                    initialYear={fitmentSearch.year}
                  />
                </Grid>
              </Grid>
            </Container>
          </Box>
        </Fade>

        {/* 3. Featured Categories Component Fade */}
        <Fade in={pageLoaded} timeout={1400}>
          <Box>
            <FeaturedCategories
              initialCategories={initialData.featuredCategories}
              initialSortMode={initialData.categorySortMode}
            />
          </Box>
        </Fade>

        {/* 4. Clickable Banners Fade (with #BD5E22 highlighted Explore Products) */}
        {banners.length > 0 && (
          <Fade in={pageLoaded} timeout={1800}>
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
                    component={Link}
                    href={banner.link || '#products'}
                    key={idx}
                    sx={{ 
                      minWidth: { xs: '100%', sm: 'calc(33.333% - 11px)' }, 
                      height: 220, 
                      borderRadius: 1, 
                      overflow: 'hidden', 
                      position: 'relative', 
                      flexShrink: 0, 
                      textDecoration: 'none',
                      borderBottom: '4px solid #BD5E22',
                      boxShadow: '0 2px 4px 0 rgba(0,0,0,.08)', 
                      backgroundImage: `url(${banner.image})`,
                      backgroundSize: 'cover', 
                      backgroundPosition: 'center', 
                      userSelect: 'none',
                      // Interactive Hover State Animations
                      '&:hover .banner-overlay': { bgcolor: 'rgba(0,0,0,0.85)' },
                      '&:hover .banner-content': { opacity: 1, transform: 'translateY(0)' },
                      '&:hover .banner-gear': { transform: 'rotate(180deg)' }
                    }}
                  >
                    {/* Dark Background Overlay */}
                    <Box className="banner-overlay" sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.15)', transition: 'background-color 0.4s ease' }} />
                    
                    {/* Rotating Gear Icon */}
                    <Settings className="banner-gear" sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', opacity: 0.9, transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', zIndex: 2 }} />
                    
                    {/* Content Data (Fades and slides up on hover) */}
                    <Box 
                      className="banner-content" 
                      sx={{ 
                        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', 
                        justifyContent: 'flex-end', p: 3, opacity: 0, transform: 'translateY(20px)', 
                        transition: 'all 0.4s ease', zIndex: 1, color: '#fff' 
                      }}
                    >
                      <Typography variant="h6" fontWeight="bold" gutterBottom>{banner.title}</Typography>
                      <Typography variant="body2" color="grey.200" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{banner.subtitle}</Typography>
                      
                      {/* Highlighted #BD5E22 Explore Products Button inside Banner */}
                      <Box 
                        component="span"
                        sx={{ 
                          width: 'fit-content', 
                          px: 2, py: 0.75, 
                          bgcolor: '#BD5E22', 
                          color: '#fff', 
                          fontWeight: 'bold', 
                          borderRadius: 1, 
                          fontSize: '0.875rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'background-color 0.3s',
                          '&:hover': { bgcolor: '#9c4c1a' } 
                        }}
                      >
                        Explore Products ↗
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Container>
          </Fade>
        )}

        {/* 5. Customer Reviews Fade */}
        {carouselReviews.length > 0 && (
          <Fade in={pageLoaded} timeout={2200}>
            <Box component="section" aria-labelledby="owner-reviews-title" sx={{ bgcolor: '#fff', py: { xs: 3, md: 4 }, borderBottom: '1px solid var(--auto-border)' }}>
              <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
                <Typography id="owner-reviews-title" variant="h5" component="h2" fontWeight={850} sx={{ mb: 2.5, textAlign: 'center' }}>
                  Customer reviews
                </Typography>
                <Box sx={{ overflowX: 'auto', py: 1 }}>
                  <Box className="review-list" sx={{ display: 'flex', width: 'max-content', gap: 2 }}>
                    {carouselReviews.map((review, index) => (
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
            </Box>
          </Fade>
        )}

        {/* 6. Products Grid Fade */}
        <Fade in={pageLoaded} timeout={2600}>
          <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, md: 4 }, scrollMarginTop: { xs: '190px', md: '166px' } }} id="products">
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, borderTop: '3px solid var(--auto-red)', boxShadow: '0 2px 8px rgba(32,35,38,.07)', bgcolor: '#fff' }}>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, color: 'text.primary', borderBottom: '1px solid #f0f0f0', pb: 2 }}>
                {/* Ensure correct priority order for rendering title strings */}
                {searchQuery ? `Search Results for "${searchQuery}"` : fitmentProducts ? `Parts for ${selectedYear} ${selectedMake} ${selectedModel}` : selectedCategory ? `${selectedCategory} parts` : 'Featured Products'}
              </Typography>

              {fitmentProducts?.some(product => product.isDemoData) && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Demo fitment records are for testing only and do not confirm real vehicle compatibility.
                </Alert>
              )}

              {filteredProducts.length === 0 ? (
                <Box sx={{ p: 6, textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight="bold" gutterBottom>{fitmentProducts ? 'No parts found for this vehicle' : 'No products found'}</Typography>
                  <Button component={Link} href="/" variant="contained" sx={{ textTransform: 'none', borderRadius: 1, bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' } }}>Clear Filters</Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {filteredProducts.slice(0, visibleProductCount).map(product => (
                    <Grid size={{ xs: 12, sm: 6, md: 3, lg: 2.4 }} key={product._id}>
                      {/* Using Box instead of Link to prevent nested <a> tags */}
                      <Box sx={{ height: '100%' }}>
                        <ProductCard product={JSON.parse(JSON.stringify(product))} />
                      </Box>
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
        </Fade>

        <StoreHighlights highlights={storeHighlights} />

        {/* 7. Brands Grid Fade */}
        {brandsForDisplay.length > 0 && (
          <Fade in={pageLoaded} timeout={3000}>
            <Box component="section" aria-labelledby="choose-by-brands-title" sx={{ bgcolor: '#fff', borderTop: '1px solid var(--auto-border)', py: { xs: 3, md: 4 } }}>
              <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 2, mb: 2.5 }}>
                  <Typography id="choose-by-brands-title" component="h2" variant="h5" fontWeight={850}>Choose by brands</Typography>
                  <Typography variant="body2" color="text.secondary">Browse available parts by manufacturer</Typography>
                </Box>
                <Grid container spacing={{ xs: 1, sm: 1.5, md: 2 }}>
                  {brandsForDisplay.map(brand => (
                    <Grid key={brand._id} size={{ xs: 4, sm: 3, md: 2, lg: 1.5 }}>
                      <Paper component={Link} href={`/brands/${brand.slug}`} elevation={0} sx={{
                        minHeight: { xs: 90, sm: 108 }, p: 1.5, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1,
                        textDecoration: 'none', color: 'var(--auto-ink)', border: '1px solid var(--auto-border)', borderRadius: 1,
                        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
                        '&:hover, &:focus-visible': { transform: 'translateY(-3px)', borderColor: 'var(--auto-red)', boxShadow: '0 8px 20px rgba(24,32,38,.1)', outline: 'none' }
                      }}>
                        <Box component="img" loading="lazy" src={brand.logo || '/assets/images/logo/logo.jpg'} alt={`${brand.name} logo`} sx={{ width: '100%', height: { xs: 42, sm: 52 }, objectFit: 'contain' }} />
                        <Typography variant="caption" fontWeight={800} sx={{ textAlign: 'center', lineHeight: 1.2 }}>{brand.name}</Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Container>
            </Box>
          </Fade>
        )}
      </Box>

      {/* 8. Footer Fade */}
      <Fade in={pageLoaded} timeout={3400}>
        <Box>
          <Footer />
        </Box>
      </Fade>
    </Box>
  );
}