export const DEFAULT_ENQUIRY_STATUSES = [
  { label: 'Pending', color: '#b45309' },
  { label: 'Quotation Sent', color: '#1d4ed8' },
  { label: 'Product Unavailable', color: '#b91c1c' },
  { label: 'Waiting for Stock', color: '#7c3aed' },
  { label: 'Delivered', color: '#15803d' }
];

export const CUSTOM_STATUS_COLOR_PALETTE = [
  '#0f766e', '#a21caf', '#0369a1', '#4d7c0f', '#c2410c', '#4338ca',
  '#be123c', '#047857', '#6d28d9', '#0e7490', '#9d174d', '#3f6212'
];

function hslToHex(hue, saturation = 68, lightness = 36) {
  const saturationRatio = saturation / 100;
  const lightnessRatio = lightness / 100;
  const chroma = (1 - Math.abs(2 * lightnessRatio - 1)) * saturationRatio;
  const section = hue / 60;
  const second = chroma * (1 - Math.abs((section % 2) - 1));
  const offset = lightnessRatio - chroma / 2;
  const components = section < 1 ? [chroma, second, 0]
    : section < 2 ? [second, chroma, 0]
      : section < 3 ? [0, chroma, second]
        : section < 4 ? [0, second, chroma]
          : section < 5 ? [second, 0, chroma]
            : [chroma, 0, second];
  return `#${components.map(component => Math.round((component + offset) * 255).toString(16).padStart(2, '0')).join('')}`;
}

export function getNextCustomStatusColor(statuses) {
  const usedColors = new Set(statuses.map(status => status.color.toLowerCase()));
  const availablePaletteColor = CUSTOM_STATUS_COLOR_PALETTE.find(color => !usedColors.has(color));
  if (availablePaletteColor) return availablePaletteColor;

  const startingHue = statuses.length * 137 % 360;
  for (const saturation of [68, 78, 58]) {
    for (const lightness of [36, 42, 30]) {
      for (let offset = 0; offset < 360; offset += 1) {
        const color = hslToHex((startingHue + offset * 137) % 360, saturation, lightness);
        if (!usedColors.has(color)) return color;
      }
    }
  }
  throw new Error('No unused status colors are available.');
}

export function getStatusTextColor(color) {
  const hex = color.replace('#', '');
  if (!/^[a-f\d]{6}$/i.test(hex)) return '#ffffff';
  const channels = [0, 2, 4].map(index => parseInt(hex.slice(index, index + 2), 16) / 255);
  const luminance = channels
    .map(channel => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((total, channel, index) => total + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return luminance > 0.48 ? '#1f2937' : '#ffffff';
}
