'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Box, Container, Typography } from '@mui/material';

export default function ProductBannerCarousel() {
  const [banners, setBanners] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    let active = true;
    fetch('/api/banners')
      .then(async response => {
        const result = await response.json();
        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Could not load promotional banners.');
        }
        if (active) setBanners(result.data.filter(banner => banner.isActive));
      })
      .catch(error => console.error('Error fetching product page banners:', error));

    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isPaused || banners.length < 2) return undefined;

    const interval = setInterval(() => {
      const carousel = carouselRef.current;
      const firstBanner = carousel?.firstElementChild;
      if (!carousel || !firstBanner) return;

      const maxScroll = carousel.scrollWidth - carousel.clientWidth;
      if (maxScroll <= 1) return;

      const styles = window.getComputedStyle(carousel);
      const gap = Number.parseFloat(styles.columnGap || styles.gap) || 0;
      const step = firstBanner.getBoundingClientRect().width + gap;
      if (carousel.scrollLeft >= maxScroll - 2) {
        carousel.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carousel.scrollBy({ left: step, behavior: 'smooth' });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (banners.length === 0) return null;

  return (
    <Container maxWidth="xl" sx={{ py: 2, px: { xs: 2, md: 4 } }}>
      <Box
        ref={carouselRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={event => {
          if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false);
        }}
        aria-label="Promotional banners"
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          scrollBehavior: 'smooth',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
          py: 1
        }}
      >
        {banners.map(banner => (
          <Box
            component={Link}
            href={banner.link || '/'}
            key={banner._id}
            sx={{
              flex: { xs: '0 0 100%', sm: '0 0 calc(33.333% - 11px)' },
              height: { xs: 180, sm: 220 },
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative',
              scrollSnapAlign: 'start',
              textDecoration: 'none',
              color: '#fff',
              borderBottom: '4px solid #BD5E22',
              boxShadow: '0 2px 4px 0 rgba(0,0,0,.08)',
              backgroundImage: `linear-gradient(0deg, rgba(0,0,0,.78), rgba(0,0,0,.08) 75%), url("${banner.image}")`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              '&:hover': { boxShadow: '0 6px 18px rgba(0,0,0,.2)' },
              '&:focus-visible': { outline: '3px solid #BD5E22', outlineOffset: 2 }
            }}
          >
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>{banner.title}</Typography>
              {banner.subtitle && (
                <Typography variant="body2" sx={{ color: 'grey.200', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {banner.subtitle}
                </Typography>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Container>
  );
}
