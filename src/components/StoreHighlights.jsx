'use client';

import React, { useRef, useState } from 'react';
import {
  Box, Card, Chip, Container, Dialog, DialogContent, DialogTitle, IconButton, Typography
} from '@mui/material';
import { ChevronLeft, ChevronRight, Close, PlayArrow } from '@mui/icons-material';

function HighlightCard({ highlight, onClick }) {
  return (
    <Card
      component="button"
      type="button"
      onClick={onClick}
      aria-label={`Play ${highlight.title}`}
      elevation={0}
      sx={{
        position: 'relative',
        display: 'block',
        flex: '0 0 auto',
        width: { xs: 176, sm: 198, md: 220 },
        aspectRatio: '9 / 16',
        overflow: 'hidden',
        p: 0,
        border: '1px solid #e3e7ea',
        borderRadius: 2,
        color: '#fff',
        textAlign: 'left',
        cursor: 'pointer',
        scrollSnapAlign: 'start',
        background: 'linear-gradient(145deg, #1d2730 5%, #ba402f 58%, #e6a14a 100%)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover, &:focus-visible': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 28px rgba(24,32,38,.2)',
          outline: '2px solid var(--auto-red)',
          outlineOffset: 2
        }
      }}
    >
      {(highlight.coverImage || highlight.thumbnailUrl) && (
        <Box
          component="img"
          src={highlight.coverImage || highlight.thumbnailUrl}
          alt=""
          loading="lazy"
          sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: 1.5,
        background: 'linear-gradient(180deg, rgba(0,0,0,.26), transparent 34%, rgba(0,0,0,.8))'
      }}>
        <Chip label={highlight.platform} size="small" sx={{
          alignSelf: 'flex-start',
          color: '#fff',
          bgcolor: 'rgba(0,0,0,.48)',
          fontWeight: 700
        }} />
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <Box sx={{
            display: 'grid',
            placeItems: 'center',
            width: 52,
            height: 52,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,.94)',
            color: 'var(--auto-red)'
          }}>
            <PlayArrow sx={{ fontSize: 36, ml: 0.3 }} />
          </Box>
          <Typography component="span" variant="subtitle2" fontWeight={800} sx={{
            width: '100%',
            textAlign: 'center',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {highlight.title}
          </Typography>
        </Box>
      </Box>
    </Card>
  );
}

export default function StoreHighlights({ highlights = [] }) {
  const sliderRef = useRef(null);
  const [selectedHighlight, setSelectedHighlight] = useState(null);

  if (highlights.length === 0) return null;

  const scroll = direction => {
    sliderRef.current?.scrollBy({ left: direction * 250, behavior: 'smooth' });
  };

  return (
    <Box component="section" aria-labelledby="store-highlights-title" sx={{
      py: { xs: 3, md: 4 },
      bgcolor: '#f8f9fa',
      borderTop: '1px solid var(--auto-border)',
      borderBottom: '1px solid var(--auto-border)'
    }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2.5 }}>
          <Box>
            <Typography id="store-highlights-title" component="h2" variant="h5" fontWeight={850}>
              Store Highlights
            </Typography>
            <Typography variant="body2" color="text.secondary">
              A closer look at our store and products
            </Typography>
          </Box>
          {highlights.length > 1 && (
            <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
              <IconButton aria-label="Scroll highlights left" onClick={() => scroll(-1)} sx={{ border: '1px solid var(--auto-border)', bgcolor: '#fff' }}>
                <ChevronLeft />
              </IconButton>
              <IconButton aria-label="Scroll highlights right" onClick={() => scroll(1)} sx={{ border: '1px solid var(--auto-border)', bgcolor: '#fff' }}>
                <ChevronRight />
              </IconButton>
            </Box>
          )}
        </Box>

        {highlights.length === 1 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <HighlightCard highlight={highlights[0]} onClick={() => setSelectedHighlight(highlights[0])} />
          </Box>
        ) : (
          <Box ref={sliderRef} sx={{
            display: 'flex',
            gap: { xs: 1.5, md: 2 },
            overflowX: 'auto',
            px: 0.5,
            py: 1,
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'thin',
            '&::-webkit-scrollbar': { height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#c7ccd1', borderRadius: 8 }
          }}>
            {highlights.map(highlight => (
              <HighlightCard
                key={highlight._id}
                highlight={highlight}
                onClick={() => setSelectedHighlight(highlight)}
              />
            ))}
          </Box>
        )}
      </Container>

      <Dialog
        open={Boolean(selectedHighlight)}
        onClose={() => setSelectedHighlight(null)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="store-highlight-dialog-title"
        slotProps={{ paper: { sx: { bgcolor: '#101010', color: '#fff', borderRadius: 2 } } }}
      >
        <DialogTitle id="store-highlight-dialog-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography component="span" variant="subtitle1" fontWeight={800}>
            {selectedHighlight?.title}
          </Typography>
          <IconButton aria-label="Close video" onClick={() => setSelectedHighlight(null)} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ px: 2, pb: 2 }}>
          {selectedHighlight && (
            <>
              <Box sx={{
                width: 'min(100%, 430px)',
                aspectRatio: '9 / 16',
                maxHeight: 'min(78vh, 760px)',
                mx: 'auto',
                bgcolor: '#000'
              }}>
                <Box
                  component="iframe"
                  src={selectedHighlight.embedUrl}
                  title={`${selectedHighlight.title} video`}
                  allow="autoplay; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                  sx={{ display: 'block', width: '100%', height: '100%', border: 0 }}
                />
              </Box>
              <Typography variant="caption" color="grey.400" sx={{ display: 'block', textAlign: 'center', mt: 1.5 }}>
                {selectedHighlight.platform === 'Facebook'
                  ? 'Facebook may start autoplay muted. Tap the speaker icon in the player to unmute.'
                  : `Playback and audio controls are provided by ${selectedHighlight.platform}.`}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}