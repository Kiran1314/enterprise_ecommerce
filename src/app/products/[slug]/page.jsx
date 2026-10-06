'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Container, Grid, Paper, IconButton, TextField, Collapse, Slider, Divider, Dialog, MenuItem
} from '@mui/material';
import { ExpandMore, ExpandLess, FilterList, ZoomIn, Close, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getProductPricing } from '@/lib/productPricing';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/components/Providers';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [product, setProduct] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currency, setCurrency] = useState('$');
  const [loading, setLoading] = useState(true);

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [selectedFitment, setSelectedFitment] = useState(null);
  const [activeHighlightTab, setActiveHighlightTab] = useState(0);
  const [isAllDetailsExpanded, setIsAllDetailsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [filterCategory, setFilterCategory] = useState('ALL');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxProductPrice, setMaxProductPrice] = useState(1000);

  const thumbnailScrollRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch(`/api/products/${slug}`).then(res => res.json()),
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([prodData, allProdData, catData, settingsData]) => {
      if (prodData.success) {
        const p = prodData.data;
        setProduct(p);
        setSelectedFitment(null);
        const defaults = {};
        p.attributes?.forEach(attr => { defaults[attr.key] = attr.value || attr.options?.[0]?.label; });
        setSelectedAttributes(defaults);
      }
      if (allProdData.success) {
        setAllProducts(allProdData.data);
        const maxP = Math.max(...allProdData.data.map(p => p.offerPrice || p.price), 1000);
        setMaxProductPrice(maxP);
        setPriceRange([0, maxP]);
      }
      if (catData.success) setCategories(catData.data);
      if (settingsData.success && settingsData.data?.currencySymbol) setCurrency(settingsData.data.currencySymbol);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}>Loading product details...</Box>;
  if (!product) return <Box sx={{ p: 8, textAlign: 'center' }}>Product not found.</Box>;

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
    const message = `Please quote ${product.title} (${product.sku})`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const scrollThumbnails = (direction) => {
    if (thumbnailScrollRef.current) {
      thumbnailScrollRef.current.scrollBy({ left: direction === 'left' ? -150 : 150, behavior: 'smooth' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'var(--auto-canvas)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Box>
        <Header categories={categories} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

        <Container maxWidth={false} sx={{ py: 2, px: { xs: 1, sm: 2, md: 3 } }}>
          <Grid container spacing={2}>
            
            <Grid size={{ xs: 12, md: 2.5 }}>
              <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 76 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, borderBottom: '1px solid #f0f0f0', pb: 1 }}>
                  <FilterList sx={{ color: 'var(--auto-red)', fontSize: 16 }} /> Filters
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>CATEGORIES</Typography>
                  {categories.map(cat => (
                    <Typography key={cat._id} variant="body2" onClick={() => setFilterCategory(cat.name)} sx={{ cursor: 'pointer', fontSize: '0.8rem', py: 0.5, color: filterCategory === cat.name ? 'var(--auto-red)' : 'text.secondary', fontWeight: filterCategory === cat.name ? 'bold' : 'normal' }}>
                      {cat.name}
                    </Typography>
                  ))}
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box>
                  <Typography variant="caption" fontWeight="bold" color="text.secondary" sx={{ mb: 1, display: 'block' }}>PRICE RANGE</Typography>
                  <Slider value={priceRange} onChange={(e, val) => setPriceRange(val)} valueLabelDisplay="auto" min={0} max={maxProductPrice} sx={{ color: 'var(--auto-red)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption">{currency}{priceRange[0]}</Typography>
                    <Typography variant="caption">{currency}{priceRange[1]}</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 9.5 }}>
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
                    <Typography variant="h6" fontWeight="bold" color="text.primary" gutterBottom>{product.title}</Typography>
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
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>Vehicle compatibility and availability</Typography>
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
                            <MenuItem key={`${fitment.make}-${fitment.model}-${fitment.year}-${index}`} value={`${fitment.make}|${fitment.model}|${fitment.year}`} disabled={Number(fitment.stock || 0) < 1}>
                              {fitment.make} · {fitment.model} · {fitment.year} · {Number(fitment.stock || 0) > 0 ? `${fitment.stock} in stock` : 'Out of stock'}
                            </MenuItem>
                          ))}
                        </TextField>
                        {selectedFitment && <Typography variant="caption" color={Number(selectedFitment.stock || 0) > 0 ? 'success.main' : 'error'} sx={{ display: 'block', mt: 0.75 }}>
                          {selectedFitment.make} {selectedFitment.model} {selectedFitment.year}: {selectedFitment.stock ?? 0} available
                        </Typography>}
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

      <Footer />
    </Box>
  );
}