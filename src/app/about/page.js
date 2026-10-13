'use client';
import React, { useState, useEffect } from 'react';
import { Box, Container, Grid, Paper, Typography, Button, Fade } from '@mui/material';
import { ArrowBack, EmojiEvents, Groups} from '@mui/icons-material';
import StarsIcon from '@mui/icons-material/Stars';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

// Upgraded counter with an ease-out exponential function
const AnimatedCounter = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    let animationFrame;

    // Smooth ease-out function for a premium matrix-loading feel
    const easeOutExpo = (x) => {
      return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
    };

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      let percentage = Math.min(progress / duration, 1);
      
      const easedProgress = easeOutExpo(percentage);
      setCount(Math.floor(easedProgress * end));
      
      if (percentage < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration]);

  return (
    <Typography 
      variant="h3" 
      fontWeight="900" 
      sx={{ 
        background: 'linear-gradient(90deg, #252D3C 0%, #BD5E22 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 1 
      }}
    >
      {count}{suffix}
    </Typography>
  );
};

export default function AboutUsPage() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <Header />

      <Container maxWidth="lg" sx={{ py: 6, flexGrow: 1 }}>
        
        {/* Back to Home Link */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'flex-start' }}>
          <Button 
            component={Link} 
            href="/" 
            startIcon={<ArrowBack />} 
            sx={{ 
              color: 'text.secondary', 
              textTransform: 'none', 
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': { color: '#BD5E22', bgcolor: 'transparent' } 
            }}
          >
            Back to Home
          </Button>
        </Box>

        {/* TWO-COLUMN SECTION: About Us Data (Left) & Video Player (Right) */}
        {/* FIXED: Moved alignItems into the sx prop */}
        <Grid container spacing={6} sx={{ alignItems: 'center', mb: 10 }}>
          
          {/* COLUMN 1: About Us Data */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Fade in={loaded} timeout={800}>
              <Box>
                <Typography variant="h3" fontWeight="900" color="#0f172a" gutterBottom sx={{ letterSpacing: '-1px' }}>
                  About <span style={{ color: '#BD5E22' }}>SuperRFJapan</span>
                </Typography>
                <Typography variant="h6" sx={{ color: '#64748b', mb: 4, fontWeight: 500 }}>
                  Premium Auto Spare Parts in the UAE
                </Typography>
                
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.8, fontSize: '1.05rem' }}>
                  Welcome to SuperRFJapan Auto Spare Parts Company, your trusted partner for high-quality automotive components in the United Arab Emirates. We specialize in providing a comprehensive range of genuine and aftermarket spare parts to keep your vehicles running at peak performance.
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.8, fontSize: '1.05rem' }}>
                  We ensure that you get the right part, at the right price, exactly when you need it.
                </Typography>
              </Box>
            </Fade>
          </Grid>
          
          {/* COLUMN 2: Video Player */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Fade in={loaded} timeout={1200}>
              <Box sx={{ 
                width: '100%', 
                height: { xs: 280, sm: 380, md: 420 }, 
                borderRadius: 6, 
                overflow: 'hidden', 
                boxShadow: '0 20px 40px -10px rgba(189, 94, 34, 0.2)', 
                bgcolor: '#000',
                position: 'relative'
              }}>
                <video 
                  src="https://e2muzpjmksmg0rxf.public.blob.vercel-storage.com/Videos/Superjapan_promo.mp4" 
                  autoPlay 
                  loop 
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </Box>
            </Fade>
          </Grid>
        </Grid>

        {/* MATRIX SECTION: Perfectly Center Aligned */}
        <Box sx={{ mb: 10, display: 'flex', justifyContent: 'center' }}>
          {/* FIXED: Moved justifyContent and alignItems into the sx prop */}
          <Grid container spacing={4} sx={{ justifyContent: 'center', alignItems: 'center', maxWidth: 900 }}>
            {[
              { end: 2500, suffix: '+', title: 'Happy Customers Throughout UAE', icon: <Groups fontSize="large" sx={{ color: '#BD5E22' }}/> },
              { end: 5, suffix: '+', title: 'Years of Completion', icon: <EmojiEvents fontSize="large" sx={{ color: '#BD5E22' }}/> },
              { end: 10, suffix: '+', title: 'Years of Experience', icon: <StarsIcon fontSize="large" sx={{ color: '#BD5E22' }}/> }
            ].map((stat, index) => (
              <Grid size={{ xs: 12, sm: 4 }} key={index} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Fade in={loaded} timeout={1000 + (index * 400)}>
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      width: '100%',
                      maxWidth: 280,
                      borderRadius: 4, 
                      border: '1px solid #e2e8f0', 
                      bgcolor: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      textAlign: 'center',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 24px -10px rgba(189, 94, 34, 0.25)',
                        borderColor: '#BD5E22'
                      }
                    }}
                  >
                    <Box sx={{ 
                      width: 64, 
                      height: 64, 
                      borderRadius: '50%', 
                      bgcolor: 'rgba(189, 94, 34, 0.1)', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      mb: 2 
                    }}>
                      {stat.icon}
                    </Box>
                    <AnimatedCounter end={stat.end} duration={2500} suffix={stat.suffix} />
                    <Typography variant="h6" color="text.secondary" fontWeight="600" sx={{ mt: 1 }}>
                      {stat.title}
                    </Typography>
                  </Paper>
                </Fade>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Company Logos Section */}
        <Fade in={loaded} timeout={2000}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h4" fontWeight="800" color="#0f172a" gutterBottom>
              Brands We Trust
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 6, maxWidth: 600, mx: 'auto' }}>
              We partner with top global manufacturers to bring you the best and most reliable auto spare parts available in the market today.
            </Typography>
            
            <Box sx={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              justifyContent: 'center', 
              gap: { xs: 3, md: 5 }
            }}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Box 
                  key={item} 
                  sx={{ 
                    width: { xs: 100, md: 140 }, 
                    height: 70, 
                    bgcolor: '#ffffff',
                    border: '1px solid #e2e8f0', 
                    borderRadius: 3, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    transition: 'all 0.3s ease',
                    filter: 'grayscale(100%) opacity(70%)',
                    '&:hover': { 
                      filter: 'grayscale(0%) opacity(100%)', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                      borderColor: '#BD5E22', 
                      cursor: 'pointer',
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" color="#94a3b8">
                    LOGO {item}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Fade>

      </Container>

      <Footer />
    </Box>
  );
}