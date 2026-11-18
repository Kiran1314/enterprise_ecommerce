'use client';

import { Box, Typography } from '@mui/material';
import { Build, Settings } from '@mui/icons-material';

export default function PageLoader({
  title = 'Loading...',
  description = 'Getting your spare part ready',
  minHeight = '65vh',
  compact = false,
}) {
  const iconSize = compact ? 64 : 92;

  return (
    <Box
      role="status"
      aria-live="polite"
      sx={{
        minHeight,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: compact ? 1 : 2,
        bgcolor: 'var(--auto-canvas)',
        color: 'text.primary',
      }}
    >
      <Box sx={{ width: iconSize, height: iconSize, position: 'relative', display: 'grid', placeItems: 'center' }}>
        <Settings
          aria-hidden="true"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            color: 'var(--auto-red)',
            animation: 'page-loader-spin 5s linear infinite',
            '@keyframes page-loader-spin': { to: { transform: 'rotate(360deg)' } },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
        <Build
          aria-hidden="true"
          sx={{
            color: '#fff',
            zIndex: 1,
            fontSize: compact ? 24 : 34,
            p: compact ? 0.5 : 0.75,
            borderRadius: '50%',
            bgcolor: 'var(--auto-red)',
            animation: 'page-loader-pulse 1.4s ease-in-out infinite',
            '@keyframes page-loader-pulse': {
              '0%, 100%': { transform: 'scale(0.9)' },
              '50%': { transform: 'scale(1.08)' },
            },
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
          }}
        />
      </Box>
      <Typography fontWeight={700}>{title}</Typography>
      {description && <Typography variant="body2" color="text.secondary">{description}</Typography>}
    </Box>
  );
}
