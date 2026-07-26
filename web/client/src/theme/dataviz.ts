// Categorical + sequential palettes for the analytics charts, validated for
// CVD separation and contrast against this app's dark panel surface
// (#14171c) via the dataviz skill's validator. Categorical hues are assigned
// in fixed order (never cycled) as drivers are selected; always paired with
// a direct label (car number/name), since the 8-slot set sits in the CVD
// floor band, not the clear-separation band.
export const DRIVER_PALETTE = [
  '#3987e5', // blue
  '#199e70', // aqua
  '#c98500', // yellow
  '#008300', // green
  '#9085e9', // violet
  '#e66767', // red
  '#d55181', // magenta
  '#d95926', // orange
] as const;

export function colorForIndex(index: number): string {
  return DRIVER_PALETTE[index % DRIVER_PALETTE.length];
}

// Sequential single-hue (blue) ramp, light->dark, for the lap-time heatmap:
// lightest = at/near personal-best pace, darkest = furthest off pace.
export const SEQUENTIAL_RAMP = [
  '#cde2fb', // 100
  '#9ec5f4', // 200
  '#6da7ec', // 300
  '#3987e5', // 400
  '#256abf', // 500
  '#184f95', // 600
  '#0d366b', // 700
] as const;

export function sequentialStep(fraction: number): string {
  const clamped = Math.max(0, Math.min(1, fraction));
  const idx = Math.round(clamped * (SEQUENTIAL_RAMP.length - 1));
  return SEQUENTIAL_RAMP[idx];
}
