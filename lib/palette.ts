// lib/palette.ts
// FindBack palette: Navy + Slate + Golden amber.
// `lightPalette` / `darkPalette` have identical keys. Use `useColors()` from
// '@/lib/useColors' inside components so colours follow the active theme.

export const lightPalette = {
  // Core
  background: '#E8EEF5',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F8FC',
  navy: '#1E3A5F', // brand surface (hero, avatars, step circles)
  navyDark: '#14263F', // toast / pressed
  navyLight: '#2F5D8C', // links, spinners
  primary: '#1E3A5F', // foreground use: icons & headings
  gold: '#F5B335',
  goldSoft: '#FDF0D5',
  goldText: '#8A5A00',
  text: '#1A202C',
  textMuted: '#64748B',
  border: '#D5DEE9',
  borderStrong: '#CBD5E1',
  tint: '#D6E2F0',
  unreadBg: '#E3ECF7',
  white: '#FFFFFF',
  overlay: 'rgba(20,38,63,0.55)',

  // Status
  lost: '#B91C1C',
  lostBg: '#FDECEC',
  lostBorder: '#F5C2C2',
  found: '#15803D',
  foundBg: '#E4F5EA',
  foundBorder: '#B9E3C6',
  pending: '#B45309',
  pendingBg: '#FDF0DC',
};

export type Palette = typeof lightPalette;

export const darkPalette: Palette = {
  background: '#0A1224',
  surface: '#131D31',
  surfaceAlt: '#182440',
  navy: '#1E3A5F',
  navyDark: '#22314D',
  navyLight: '#6E9BD1',
  primary: '#86A9D6',
  gold: '#F5B335',
  goldSoft: '#3A2E12',
  goldText: '#F5C25A',
  text: '#E6ECF5',
  textMuted: '#9AA9C0',
  border: '#25324D',
  borderStrong: '#33425F',
  tint: '#1D2B48',
  unreadBg: '#1B2B47',
  white: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.7)',

  lost: '#F87171',
  lostBg: '#3A1A1F',
  lostBorder: '#5C2A30',
  found: '#4ADE80',
  foundBg: '#14301F',
  foundBorder: '#235B38',
  pending: '#FBBF24',
  pendingBg: '#3A2C12',
};

// Static light palette — only for places that never need theming.
export const C = lightPalette;

// Modern soft shadows
export const shadow = {
  card: {
    shadowColor: '#1E3A5F',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#1E3A5F',
    shadowOpacity: 0.16,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
};
