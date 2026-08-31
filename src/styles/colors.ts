/**
 * JS-side mirror of src/styles/colors.css — for the few spots that need a
 * raw color string (dynamically computed SVG stroke/fill, inline chart
 * colors) rather than a Tailwind class.
 */
export const COLORS = {
  page: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E4E4E1',
  navy: '#10233F',
  blue: '#2563EB',
  sky: '#60A5FA',
  warm: '#C77B4E',
} as const;
