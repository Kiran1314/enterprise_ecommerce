'use client';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, Container, Grid, Paper, IconButton, Badge, TextField, Collapse, Slider, Divider 
} from '@mui/material';
import { ShoppingBag, Search, ExpandMore, ExpandLess, FilterList } from '@mui/icons-material';
import Link from 'next/link';
import { useCart } from '@/components/Providers';
import { useParams } from 'next/navigation';
import ProductCard from '@/components/ProductCard';

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
  const [activeHighlightTab, setActiveHighlightTab] = useState(0);
  const [isAllDetailsExpanded, setIsAllDetailsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Sidebar Filter States
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [maxProductPrice, setMaxProductPrice] = useState(1000);

  const highlightTabsRef = useRef(null);
  const { cart, addToCart, setIsCartOpen } = useCart();
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (!slug) return;
    Promise.all([
      fetch('/api/products').then(res => res.json()),
      fetch('/api/categories').then(res => res.json()),
      fetch('/api/settings').then(res => res.json())
    ]).then(([prodData, catData, settingsData]) => {
      if (prodData.success) {
        const prods = prodData.data;
        setAllProducts(prods);
        const currentProd = prods.find(p => p.slug === slug || p._id === slug);
        if (currentProd) {
          setProduct(currentProd);
          const defaults = {};
          currentProd.attributes?.forEach(attr => {
            if (attr.options?.length > 0) defaults[attr.key] = attr.options[0];
          });
          setSelectedAttributes(defaults);
        }
        const maxP = Math.max(...prods.map(p => p.offerPrice || p.price), 1000);
        setMaxProductPrice(maxP);
        setPriceRange([0, maxP]);

        if (currentProd) {
          try {
            const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
            const updated = [currentProd._id, ...viewed.filter(i => i !== currentProd._id)].slice(0, 4);
            localStorage.setItem('recentlyViewed', JSON.stringify(updated));
          } catch (e) {}
        }
      }
      if (catData.success) setCategories(catData.data);
      if (settingsData.success && settingsData.data?.currencySymbol) {
        setCurrency(settingsData.data.currencySymbol);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <Box sx={{ p: 8, textAlign: 'center' }}>Loading product details...</Box>;
  if (!product) return <Box sx={{ p: 8, textAlign: 'center' }}>Product not found.</Box>;

  const hasOffer = product.offerPrice && product.offerPrice < product.price;
  const discountPercent = hasOffer ? Math.round(((product.price - product.offerPrice) / product.price) * 100) : 0;
  const finalPrice = hasOffer ? product.offerPrice : product.price;

  const handleAddToCart = () => {
    const productWithAttrs = {
      ...product,
      price: finalPrice,
      title: `${product.title} (${Object.entries(selectedAttributes).map(([k, v]) => `${v}`).join(', ')})`
    };
    addToCart(productWithAttrs);
  };

  const handleWhatsApp = () => {
    const attrSummary = Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(', ');
    const text = encodeURIComponent(`Hi, I am interested in inquiring about: ${product.title} (SKU: ${product.sku}) [${attrSummary}]`);
    window.open(`https://wa.me/${product.whatsappNumber || '1234567890'}?text=${text}`, '_blank');
  };

  const recentlyViewedProducts = allProducts.filter(p => {
    try {
      const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      return viewed.includes(p._id) && p._id !== product._id;
    } catch (e) {
      return false;
    }
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f1f3f6' }}>
      <Box component="header" sx={{ bgcolor: '#6600cc', position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 2px 4px 0 rgba(0,0,0,.08)' }}>
        <Container maxWidth="xl" sx={{ height: 64, px: { xs: 2, md: 4 }, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <Typography variant="h6" fontWeight="extrabold" color="#fff" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontStyle: 'italic' }}>
              <Storefront sx={{ color: '#ffcc00' }} /> EnterpriseStore
            </Typography>
          </Link>
          <Box sx={{ flex: 1, maxWidth: 600, mx: 2 }}>
            <TextField 
              fullWidth size="small" placeholder="Search for products, brands and more"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              slotProps={{ input: { startAdornment: <Search sx={{ color: '#878787', mr: 1, fontSize: 20 }} /> } }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1, bgcolor: '#fff', '& fieldset': { border: 'none' } } }}
            />
          </Box>
          <IconButton onClick={() => setIsCartOpen(true)} sx={{ color: '#fff' }}>
            <Badge badgeContent={cartItemCount} color="warning"><ShoppingBag /></Badge>
          </IconButton>
        </Container>
      </Box>

      <Container maxWidth="xl" sx={{ py: 3, px: { xs: 1, md: 3 } }}>
        <Grid container spacing={3}>
          {/* Left Sidebar Filters */}
          <Grid size={{ xs: 12, md: 3 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#fff', position: 'sticky', top: 80 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, borderBottom: '1px solid #f0f0f0', pb: 1.5 }}>
                <FilterList sx={{ color: '#6600cc' }} /> Filters
              </Typography>
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Categories</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Typography 
                    variant="body2" onClick={() => setFilterCategory('ALL')}
                    sx={{ cursor: 'pointer', fontWeight: filterCategory === 'ALL' ? 'bold' : 'normal', color: filterCategory === 'ALL' ? '#6600cc' : 'text.secondary' }}
                  >
                    All Categories
                  </Typography>
                  {categories.map(cat => (
                    <Typography 
                      key={cat._id} variant="body2" onClick={() => setFilterCategory(cat.name)}
                      sx={{ cursor: 'pointer', fontWeight: filterCategory === cat.name ? 'bold' : 'normal', color: filterCategory === cat.name ? '#6600cc' : 'text.secondary' }}
                    >
                      {cat.name}
                    </Typography>
                  ))}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Price Range</Typography>
                <Slider value={priceRange} onChange={(e, val) => setPriceRange(val)} valueLabelDisplay="auto" min={0} max={maxProductPrice} sx={{ color: '#6600cc' }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Typography variant="caption">{currency}{priceRange[0]}</Typography>
                  <Typography variant="caption">{currency}{priceRange[1]}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Right Product View */}
          <Grid size={{ xs: 12, md: 9 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 5 }}>
                <Paper elevation={0} sx={{ p: 2, borderRadius: 1, bgcolor: '#fff', display: 'flex', gap: 2, position: 'sticky', top: 80 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, maxHeight: 450, overflowY: 'auto' }}>
                    {product.images?.map((img, idx) => (
                      <Box key={idx} onClick={() => setSelectedImage(idx)} sx={{ width: 60, height: 60, border: selectedImage === idx ? '2px solid #6600cc' : '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden', cursor: 'pointer' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ flex: 1, height: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
                    <img src={product.images?.[selectedImage] || product.images?.[0]} alt={product.title} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, md: 7 }}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#fff', mb: 2 }}>
                  <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>{product.title}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
                    {hasOffer ? (
                      <>
                        <Typography variant="h4" fontWeight="black" color="text.primary">{currency}{product.offerPrice.toFixed(2)}</Typography>
                        <Typography variant="h6" color="text.disabled" sx={{ textDecoration: 'line-through' }}>{currency}{product.price.toFixed(2)}</Typography>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#388e3c' }}>{discountPercent}% off</Typography>
                      </>
                    ) : (
                      <Typography variant="h4" fontWeight="black" color="text.primary">{currency}{product.price.toFixed(2)}</Typography>
                    )}
                  </Box>
                  <p className="text-gray-600 text-sm mt-2">{product.description}</p>

                  {product.attributes?.length > 0 && (
                    <Box sx={{ my: 3, borderTop: '1px solid #f0f0f0', pt: 2 }}>
                      {product.attributes.map((attr, idx) => (
                        <Box key={idx} sx={{ mb: 2 }}>
                          <Typography variant="body2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>
                            {attr.key}: <span style={{ color: '#6600cc' }}>{selectedAttributes[attr.key]}</span>
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {attr.options?.map((opt, optIdx) => {
                              const isSelected = selectedAttributes[attr.key] === opt;
                              return (
                                <Button 
                                  key={optIdx} variant={isSelected ? 'contained' : 'outlined'} size="small"
                                  onClick={() => setSelectedAttributes(prev => ({ ...prev, [attr.key]: opt }))}
                                  sx={{ textTransform: 'none', borderRadius: 1, bgcolor: isSelected ? '#6600cc' : 'transparent', borderColor: isSelected ? '#6600cc' : '#e0e0e0', color: isSelected ? '#fff' : '#333' }}
                                >
                                  {opt}
                                </Button>
                              );
                            })}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                    <Button fullWidth variant="contained" size="large" onClick={handleAddToCart} sx={{ bgcolor: '#ff9f00', '&:hover': { bgcolor: '#fb641b' }, fontWeight: 'bold', textTransform: 'none', py: 1.5, borderRadius: 1 }}>
                      ADD TO CART
                    </Button>
                    {product.hasInquiry && (
                      <Button fullWidth variant="contained" size="large" onClick={handleWhatsApp} sx={{ bgcolor: '#fb641b', '&:hover': { bgcolor: '#e05512' }, fontWeight: 'bold', textTransform: 'none', py: 1.5, borderRadius: 1 }}>
                        WHATSAPP INQUIRY
                      </Button>
                    )}
                  </Box>
                </Paper>

                {/* Collapsible All Details */}
                <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#fff', mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0', pb: 2, mb: 3 }}>
                    <Typography variant="h6" fontWeight="bold">All Details</Typography>
                    <IconButton onClick={() => setIsAllDetailsExpanded(!isAllDetailsExpanded)} size="small">
                      {isAllDetailsExpanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>

                  <Collapse in={isAllDetailsExpanded}>
                    {(!product.highlights || product.highlights.length === 0) ? (
                      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>No additional highlights available.</Typography>
                    ) : (
                      <Box>
                        <Box ref={highlightTabsRef} sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, mb: 3, borderBottom: '1px solid #e0e0e0', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                          {product.highlights.map((group, gIdx) => {
                            const isActive = activeHighlightTab === gIdx;
                            return (
                              <Button 
                                key={gIdx} onClick={() => setActiveHighlightTab(gIdx)}
                                sx={{ textTransform: 'none', fontWeight: 'bold', whiteSpace: 'nowrap', px: 3, py: 1, borderRadius: 1, bgcolor: isActive ? '#f3e8ff' : 'transparent', color: isActive ? '#6600cc' : 'text.secondary', borderBottom: isActive ? '2px solid #6600cc' : 'none' }}
                              >
                                {group.mainHeading}
                              </Button>
                            );
                          })}
                        </Box>
                        {product.highlights[activeHighlightTab] && (
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold" color="#6600cc" sx={{ mb: 2 }}>{product.highlights[activeHighlightTab].mainHeading}</Typography>
                            <Grid container spacing={2}>
                              {product.highlights[activeHighlightTab].items.map((item, iIdx) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={iIdx}>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', p: 1.5, bgcolor: '#f8fafc', borderRadius: 1, height: '100%' }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight="bold">{item.heading}</Typography>
                                    <Typography variant="body2" fontWeight="600" color="text.primary" sx={{ mt: 0.5 }}>{item.description}</Typography>
                                  </Box>
                                </Grid>
                              ))}
                            </Grid>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Collapse>
                </Paper>
              </Grid>
            </Grid>

            {recentlyViewedProducts.length > 0 && (
              <Paper elevation={0} sx={{ p: 3, borderRadius: 1, bgcolor: '#fff', mt: 3 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 3, borderBottom: '1px solid #f0f0f0', pb: 2 }}>Recently Viewed Products</Typography>
                <Grid container spacing={2}>
                  {recentlyViewedProducts.map(p => (
                    <Grid size={{ xs: 12, sm: 6, md: 3 }} key={p._id}>
                      <ProductCard product={JSON.parse(JSON.stringify(p))} />
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}