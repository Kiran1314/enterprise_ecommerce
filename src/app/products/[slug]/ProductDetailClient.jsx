'use client';
import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  Box, Typography, Button, Container, Grid, Paper, IconButton, TextField, Collapse, Divider, Dialog, MenuItem
} from '@mui/material';
import { ExpandMore, ExpandLess, FilterList, ZoomIn, Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductPricing } from '@/lib/productPricing';
import { useCart } from '@/components/Providers';
import { getProductEnquiryMessage } from '@/lib/productEnquiryMessage';

const ProductCard = dynamic(() => import('@/components/ProductCard'), {
  loading: () => <Box sx={{ minHeight: 320, bgcolor: '#f8fafc', borderRadius: 1 }} />,
});
const ProductBannerCarousel = dynamic(() => import('@/components/ProductBannerCarousel'), {
  loading: () => <Box aria-hidden="true" sx={{ minHeight: { xs: 120, md: 180 } }} />,
});

export default function ProductDetailClient({ initialProduct, slug }) {
  const product = initialProduct;
  const [categories, setCategories] = useState([]);
  const [relatedProductsState, setRelatedProductsState] = useState({ key: '', products: [], error: '' });
  const [currency, setCurrency] = useState('$');

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState(() => Object.fromEntries(
    (initialProduct.attributes || []).map(attr => [attr.key, attr.value || attr.options?.[0]?.label])
  ));
  const [selectedFitment, setSelectedFitment] = useState(null);
  const [activeHighlightTab, setActiveHighlightTab] = useState(0);
  const [isAllDetailsExpanded, setIsAllDetailsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllCategories, setShowAllCategories] = useState(false);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const thumbnailScrollRef = useRef(null);
  const relatedProductsScrollRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!slug) return;
    let active = true;

    Promise.all([
      fetch('/api/categories').then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Categories could not be loaded.');
        return result;
      }),
      fetch('/api/settings').then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Store settings could not be loaded.');
        return result;
      })
    ]).then(([categoryResult, settingsResult]) => {
      if (!active) return;
      setCategories(categoryResult.data);
      if (settingsResult.data?.currencySymbol) setCurrency(settingsResult.data.currencySymbol);
    }).catch(error => {
      if (active) console.error('Error fetching product page supporting data:', error);
    });

    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!product) return undefined;

    const controller = new AbortController();
    const requestKey = JSON.stringify([
      product.slug || slug,
      product.categories || [],
      selectedFitment?.make || '',
      selectedFitment?.model || '',
      selectedFitment?.year || ''
    ]);
    const query = new URLSearchParams({ slug: product.slug || slug });
    [...new Set((product.categories || []).filter(Boolean))]
      .forEach(category => query.append('category', category));
    if (selectedFitment) {
      query.set('make', selectedFitment.make);
      query.set('model', selectedFitment.model);
      query.set('year', selectedFitment.year);
    }

    fetch(`/api/products/related?${query}`, { signal: controller.signal })
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not load related products.');
        }
        setRelatedProductsState({ key: requestKey, products: result.data, error: '' });
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error loading related products:', error);
          setRelatedProductsState({ key: requestKey, products: [], error: 'Related products could not be loaded.' });
        }
      });

    return () => controller.abort();
  }, [product, selectedFitment, slug]);

  // Determine active images based on selected color option variation images
  const colorAttr = product.attributes?.find(a => a.type === 'image' || a.key.toLowerCase().includes('color'));
  const activeColorValue = colorAttr ? selectedAttributes[colorAttr.key] : null;
  const matchedColorOption = colorAttr?.options?.find(o => o.label === activeColorValue);
  
  const activeImages = (matchedColorOption?.variationImages && matchedColorOption.variationImages.length > 0 && matchedColorOption.variationImages[0])
    ? matchedColorOption.variationImages.filter(Boolean)
    : (product.images?.length > 0 ? product.images : ['https://via.placeholder.com/400']);

  const pricing = getProductPricing(product);
  const priceAvailable = pricing.price !== null;
  const hasOffer = pricing.hasOffer;
  const isQuoteOnly = !priceAvailable;
  const discountPercent = hasOffer ? Math.round(((pricing.price - pricing.offerPrice) / pricing.price) * 100) : 0;
  const finalPrice = pricing.displayPrice;
  const hasVehicleFitments = product.fitments?.length > 0;
  const canAddToCart = !isQuoteOnly && (!hasVehicleFitments || (selectedFitment && Number(selectedFitment.stock) > 0));
  const relatedProductsKey = JSON.stringify([
    product.slug || slug,
    product.categories || [],
    selectedFitment?.make || '',
    selectedFitment?.model || '',
    selectedFitment?.year || ''
  ]);
  const hasRelatedProductCategories = (product.categories || []).some(Boolean);
  const relatedProductsLoading = hasRelatedProductCategories && relatedProductsState.key !== relatedProductsKey;
  const relatedProducts = relatedProductsState.key === relatedProductsKey ? relatedProductsState.products : [];
  const relatedProductsError = relatedProductsState.key === relatedProductsKey ? relatedProductsState.error : '';
  const productCategories = categories.filter(cat => product.categories?.includes(cat.name));
  const otherCategories = categories.filter(cat => !product.categories?.includes(cat.name));

  const handleAddToCart = () => {
    if (!canAddToCart) return;
    const selectedOptions = Object.values(selectedAttributes).filter(Boolean).join(', ');
    const vehicleLabel = selectedFitment ? `${selectedFitment.make} ${selectedFitment.model} ${selectedFitment.year}` : '';
    addToCart({
      ...product,
      price: finalPrice,
      title: selectedOptions || vehicleLabel ? `${product.title} (${[selectedOptions, vehicleLabel].filter(Boolean).join(' · ')})` : product.title,
      images: activeImages,
      selectedFitment: selectedFitment ? { make: selectedFitment.make, model: selectedFitment.model, year: selectedFitment.year } : null
    });
  };

  const handleWhatsApp = () => {
    const phone = (product.whatsappNumber || '1234567890').replace(/\D/g, '');
    const message = getProductEnquiryMessage(product);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' });
    }
  };

  const scrollRelatedProducts = direction => {
    const carousel = relatedProductsScrollRef.current;
    const firstCard = carousel?.firstElementChild;
    if (!carousel || !firstCard) return;

    const styles = window.getComputedStyle(carousel);
    const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
    carousel.scrollBy({
      left: direction * (firstCard.getBoundingClientRect().width + gap),
      behavior: 'smooth'
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2, md: 3 } }}>
          <Grid container spacing={2}>
            
            <Grid size={{ xs: 12, md: 2.5 }} sx={{ order: { xs: 2, md: 1 } }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 76 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                  <FilterList sx={{ color: 'var(--auto-red)', fontSize: 16 }} /> Filters
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>CATEGORIES</Typography>
                  {productCategories.map(cat => {
                    return (
                      <Typography
                        key={cat._id}
                        variant="body2"
                        sx={{
                          fontSize: '0.8rem',
                          px: 1,
                          py: 0.5,
                          mb: 0.25,
                          borderLeft: '3px solid',
                          borderColor: '#BD5E22',
                          borderRadius: '0 4px 4px 0',
                          bgcolor: 'rgba(189, 94, 34, 0.1)',
                          color: '#BD5E22',
                          fontWeight: 'bold'
                        }}
                      >
                        {cat.name}
                      </Typography>
                    );
                  })}
                  {productCategories.length === 0 && !showAllCategories && (
                    <Typography variant="body2" color="text.secondary" sx={{ px: 1, py: 0.5 }}>
                      No categories assigned to this product.
                    </Typography>
                  )}
                  {otherCategories.length > 0 && (
                    <>
                      <Button
                        size="small"
                        onClick={() => setShowAllCategories(previous => !previous)}
                        startIcon={showAllCategories ? <ExpandLess /> : <ExpandMore />}
                        sx={{ mt: 0.5, display: { xs: 'inline-flex', md: 'none' }, textTransform: 'none' }}
                      >
                        {showAllCategories ? 'Hide other categories' : `Show all categories (${otherCategories.length})`}
                      </Button>
                      <Box sx={{ display: { xs: showAllCategories ? 'block' : 'none', md: 'block' } }}>
                        {otherCategories.map(cat => (
                          <Typography
                            key={cat._id}
                            variant="body2"
                            sx={{ fontSize: '0.8rem', px: 1, py: 0.5, mb: 0.25, color: 'text.secondary' }}
                          >
                            {cat.name}
                          </Typography>
                        ))}
                      </Box>
                    </>
                  )}
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 9.5 }} sx={{ order: { xs: 1, md: 2 } }}>
              <Grid container spacing={2}>
                
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 76 }}>
                    
                    {/* Main Active Image View */}
                    <Box onClick={() => { setLightboxIndex(selectedImage); setIsLightboxOpen(true); }} sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff', position: 'relative', overflow: 'hidden', cursor: 'zoom-in', mb: 2 }}>
                      <img src={activeImages[selectedImage] || activeImages[0]} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                      <Box sx={{ position: 'absolute', bottom: 8, right: 8, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', p: 0.5, borderRadius: 1 }}>
                        <ZoomIn sx={{ fontSize: 18 }} />
                      </Box>
                    </Box>

                    {/* Horizontal Thumbnail Scroller matching Flipkart/Amazon/Louis Philippe */}
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <IconButton onClick={() => scrollThumbnails('left')} sx={{ position: 'absolute', left: -10, zIndex: 10, bgcolor: '#fff', boxShadow: 2, '&:hover': { bgcolor: 'var(--auto-canvas)' } }} size="small">
                        <ChevronLeft fontSize="small" />
                      </IconButton>

                      <Box ref={thumbnailScrollRef} sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', scrollBehavior: 'smooth', py: 1, px: 2, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' }, width: '100%' }}>
                        {activeImages.map((img, idx) => (
                          <Box key={idx} onClick={() => setSelectedImage(idx)} sx={{ width: 65, height: 65, border: selectedImage === idx ? '2px solid #111' : '1px solid #e0e0e0', borderRadius: 1.5, overflow: 'hidden', cursor: 'pointer', flexShrink: 0, p: 0.5 }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        ))}
                      </Box>

                      <IconButton onClick={() => scrollThumbnails('right')} sx={{ position: 'absolute', right: -10, zIndex: 10, bgcolor: '#fff', boxShadow: 2, '&:hover': { bgcolor: 'var(--auto-canvas)' } }} size="small">
                        <ChevronRight fontSize="small" />
                      </IconButton>
                    </Box>

                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, bgcolor: '#fff', mb: 2 }}>
                    <Typography component="h1" variant="h6" fontWeight="bold" color="text.primary" gutterBottom>
                      {product.title} ({product.sku})
                    </Typography>
                    {!isQuoteOnly && <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 1 }}>
                      {hasOffer ? (
                        <>
                          <Typography variant="h5" fontWeight="black" color="text.primary">{currency}{pricing.offerPrice.toFixed(2)}</Typography>
                          <Typography variant="body1" color="text.disabled" sx={{ textDecoration: 'line-through' }}>{currency}{pricing.price.toFixed(2)}</Typography>
                          <Typography variant="caption" fontWeight="bold" sx={{ color: '#388e3c', bgcolor: '#e8f5e9', px: 1, py: 0.5, borderRadius: 1 }}>{discountPercent}% OFF</Typography>
                        </>
                      ) : (
                        <Typography variant="h5" fontWeight="black" color="text.primary">{currency}{pricing.price.toFixed(2)}</Typography>
                      )}
                    </Box>}

                    {/* Attribute Swatches Rendering */}
                    {product.attributes?.length > 0 && (
                      <Box sx={{ my: 2, borderTop: '1px solid #f0f0f0', pt: 1.5 }}>
                        {product.attributes.map((attr, idx) => {
                          const isImageSwatch = attr.type === 'image';
                          return (
                            <Box key={idx} sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
                                Selected {attr.key}: <span style={{ fontWeight: 400, color: '#555' }}>{selectedAttributes[attr.key]}</span>
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                {attr.options?.map((opt, optIdx) => {
                                  const isSelected = selectedAttributes[attr.key] === opt.label;
                                  return (
                                    <Box
                                      key={optIdx}
                                      onClick={() => {
                                        setSelectedAttributes(prev => ({ ...prev, [attr.key]: opt.label }));
                                        setSelectedImage(0); // Reset thumbnail index on color switch
                                      }}
                                      sx={{
                                        cursor: 'pointer',
                                        border: isSelected ? '2px solid #111' : '1px solid #e0e0e0',
                                        borderRadius: 2,
                                        p: isImageSwatch ? 0.5 : 1.5,
                                        width: isImageSwatch ? 60 : 'auto',
                                        height: isImageSwatch ? 60 : 'auto',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: isImageSwatch ? '#fff' : (isSelected ? '#fff1f0' : '#fafafa'),
                                        color: isSelected ? 'var(--auto-red)' : '#333',
                                        fontWeight: 'bold',
                                        fontSize: '0.8rem'
                                      }}
                                    >
                                      {isImageSwatch && opt.image ? (
                                        <img src={opt.image} alt={opt.label} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                                      ) : (
                                        opt.label
                                      )}
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    {hasVehicleFitments && (
                      <Box sx={{ my: 2, borderTop: '1px solid #f0f0f0', pt: 1.5 }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Vehicle compatibility</Typography>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Select Make / Model / Year"
                          value={selectedFitment ? `${selectedFitment.make}|${selectedFitment.model}|${selectedFitment.year}` : ''}
                          onChange={event => {
                            const fitment = product.fitments.find(item => `${item.make}|${item.model}|${item.year}` === event.target.value);
                            setSelectedFitment(fitment || null);
                          }}
                        >
                          {product.fitments.map((fitment, index) => (
                            <MenuItem
                              key={`${fitment.make}-${fitment.model}-${fitment.year}-${index}`}
                              value={`${fitment.make}|${fitment.model}|${fitment.year}`}
                              disabled={Number(fitment.stock || 0) < 1}
                            >
                              {fitment.make} · {fitment.model} · {fitment.year}
                            </MenuItem>
                          ))}
                        </TextField>
                        {selectedFitment && (
                          <Typography
                            variant="caption"
                            color={Number(selectedFitment.stock || 0) > 0 ? 'success.main' : 'error'}
                            sx={{ display: 'block', mt: 0.75 }}
                          >
                            {Number(selectedFitment.stock || 0) > 0 ? 'In stock' : 'Out of stock'}
                          </Typography>
                        )}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1.5, mt: 3 }}>
                      {!isQuoteOnly && <Button fullWidth variant="contained" size="small" onClick={handleAddToCart} disabled={!canAddToCart} sx={{ bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' }, fontWeight: 'bold', textTransform: 'none', py: 1.2, borderRadius: 1 }}>
                        {hasVehicleFitments && !selectedFitment ? 'Select vehicle to add' : selectedFitment && Number(selectedFitment.stock) < 1 ? 'Out of stock' : 'Add to Cart'}
                      </Button>}
                      {(product.hasInquiry || isQuoteOnly) && (
                        <Button fullWidth variant="contained" size="small" onClick={handleWhatsApp} sx={{ bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' }, fontWeight: 'bold', textTransform: 'none', py: 1.2, borderRadius: 1 }}>
                          Enquiry
                        </Button>
                      )}
                    </Box>
                  </Paper>

                  {(product.description || product.highlights?.length > 0) && (
                    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 1, bgcolor: '#fff', mb: 2 }}>
                      <Typography variant="h6" fontWeight={800} sx={{ mb: 1.5 }}>Product details</Typography>
                      {product.description && <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', mb: product.highlights?.length ? 2 : 0 }}>{product.description}</Typography>}
                      {product.highlights?.map((group, groupIndex) => (
                        <Box key={`${group.mainHeading}-${groupIndex}`} sx={{ mb: groupIndex < product.highlights.length - 1 ? 2 : 0 }}>
                          <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 0.75 }}>{group.mainHeading}</Typography>
                          <Box component="dl" sx={{ m: 0, display: 'grid', gap: 1.25 }}>
                            {group.items?.map((item, itemIndex) => (
                              <Box key={`${item.heading}-${itemIndex}`} sx={{ borderLeft: '3px solid var(--auto-red)', pl: 1.5 }}>
                                <Typography component="dt" variant="body2" fontWeight={750}>{item.heading}</Typography>
                                <Typography component="dd" variant="body2" color="text.secondary" sx={{ m: 0, mt: 0.25, whiteSpace: 'pre-wrap' }}>{item.description}</Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                    </Paper>
                  )}
                </Grid>

              </Grid>
            </Grid>

          </Grid>
        </Container>
      </Box>

      {hasRelatedProductCategories && (
        <Container maxWidth="xl" sx={{ py: 3, px: { xs: 2, md: 4 } }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h5" fontWeight={800}>
              {selectedFitment ? 'More for your vehicle' : 'Related products'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {selectedFitment
                ? `Matching ${selectedFitment.make} ${selectedFitment.model} ${selectedFitment.year} and related categories`
                : 'More products from related categories'}
            </Typography>
          </Box>
          {relatedProductsError ? (
            <Typography role="alert" variant="body2" color="error">{relatedProductsError}</Typography>
          ) : relatedProductsLoading ? (
            <Typography variant="body2" color="text.secondary">Finding products for you…</Typography>
          ) : relatedProducts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No in-stock related products match this category and vehicle yet.
            </Typography>
          ) : (
            <Box sx={{ position: 'relative' }}>
              {relatedProducts.length > 1 && (
                <>
                  <IconButton
                    aria-label="Scroll related products left"
                    onClick={() => scrollRelatedProducts(-1)}
                    sx={{
                      position: 'absolute',
                      left: { xs: 0, md: -20 },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      bgcolor: '#fff',
                      boxShadow: 2,
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                  <IconButton
                    aria-label="Scroll related products right"
                    onClick={() => scrollRelatedProducts(1)}
                    sx={{
                      position: 'absolute',
                      right: { xs: 0, md: -20 },
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 1,
                      bgcolor: '#fff',
                      boxShadow: 2,
                      '&:hover': { bgcolor: '#f8fafc' }
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                </>
              )}
              <Box
                ref={relatedProductsScrollRef}
                aria-label="Related products"
                sx={{
                  display: 'flex',
                  gap: 2,
                  overflowX: 'auto',
                  scrollBehavior: 'smooth',
                  scrollSnapType: 'x mandatory',
                  scrollbarWidth: 'none',
                  '&::-webkit-scrollbar': { display: 'none' },
                  px: { xs: 0.5, md: 0 },
                  py: 1
                }}
              >
                {relatedProducts.map(relatedProduct => (
                  <Box
                    key={relatedProduct._id}
                    sx={{
                      flex: { xs: '0 0 48%', sm: '0 0 31%', md: '0 0 24%' },
                      minWidth: 0,
                      scrollSnapAlign: 'start'
                    }}
                  >
                    <ProductCard product={relatedProduct} />
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Container>
      )}
      <ProductBannerCarousel />
      <Footer />
    </Box>
  );
}