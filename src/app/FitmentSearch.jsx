'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, FormControl, Grid, InputLabel, Paper, Select, Typography } from '@mui/material';

export default function FitmentSearch({
  makes,
  modelsByMake,
  initialMake,
  initialModel,
  initialYear
}) {
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [year, setYear] = useState(initialYear);
  const allModels = [...new Set(Object.values(modelsByMake).flatMap(models => Object.keys(models)))].sort();
  const allYears = [...new Set(Object.values(modelsByMake).flatMap(models => Object.values(models).flat()))].sort();
  const models = make ? Object.keys(modelsByMake[make] || {}) : allModels;
  const years = model ? modelsByMake[make]?.[model] || [] : allYears;
  const searchHref = `/?${new URLSearchParams({ make, model, year }).toString()}#products`;

  return (
    <Paper elevation={8} sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 1, border: '2px solid var(--auto-red)', maxWidth: 760 }}>
      <Typography variant="h6" fontWeight={800} sx={{ color: 'var(--auto-red)', mb: 2 }}>
        Search Your Part Here
      </Typography>
      <Grid container spacing={1.25}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl size="small" fullWidth>
            <InputLabel id="vehicle-make-label">Select Your Make</InputLabel>
            <Select
              native
              labelId="vehicle-make-label"
              id="vehicle-make-select"
              label="Select Your Make"
              value={make}
              onChange={event => {
                setMake(event.target.value);
                setModel('');
                setYear('');
              }}
            >
              <option value="">Select Your Make</option>
              {makes.map(makeOption => <option key={makeOption} value={makeOption}>{makeOption}</option>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl size="small" fullWidth disabled={!make}>
            <InputLabel id="vehicle-model-label">Select Your Model</InputLabel>
            <Select
              native
              labelId="vehicle-model-label"
              id="vehicle-model-select"
              label="Select Your Model"
              value={model}
              onChange={event => {
                setModel(event.target.value);
                setYear('');
              }}
            >
              <option value="">Select Your Model</option>
              {models.map(modelOption => <option key={modelOption} value={modelOption}>{modelOption}</option>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl size="small" fullWidth disabled={!model}>
            <InputLabel id="vehicle-year-label">Select Your Model Year</InputLabel>
            <Select
              native
              labelId="vehicle-year-label"
              id="vehicle-year-select"
              label="Select Your Model Year"
              value={year}
              onChange={event => setYear(event.target.value)}
            >
              <option value="">Select Your Model Year</option>
              {years.map(yearOption => <option key={yearOption} value={yearOption}>{yearOption}</option>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid size={{ xs: 12 }}>
          <Button
            component={Link}
            href={searchHref}
            fullWidth
            variant="contained"
            disabled={!make || !model || !year}
            sx={{ bgcolor: 'var(--auto-red)', '&:hover': { bgcolor: 'var(--auto-red-hover)' }, color: '#fff', fontWeight: 800, textTransform: 'none', py: 1.15, borderRadius: 5 }}
          >
            Find My Part
          </Button>
        </Grid>
      </Grid>
      {makes.length === 0 && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          No vehicle fitments are currently available.
        </Typography>
      )}
    </Paper>
  );
}
