// Design tokens — single source of truth for all visual constants.
// Never hardcode colors, spacing, or radius values in components.

export const colors = {
  // Brand — #FF6100 is the actual brand color from the logo SVG
  primary: '#FF6100',
  primaryLight: '#FFF4ED',
  primaryBorder: '#FFD4A8',
  primaryMid: '#FFEBCF',

  // Neutral
  black: '#1A1A1A',
  white: '#FFFFFF',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  gray100: '#D1D1D1',
  gray500: '#5D5D5D',
  gray600: '#4F4F4F',
  gray800: '#3D3D3D',

  // Sport pin colors — each sport has a fixed color
  soccer: '#FF6100',
  pickleball: '#7F77DD',
  basketball: '#D85A30',
  tennis: '#1D9E75',
  running: '#378ADD',

  // Semantic
  success: '#1D9E75',
  error: '#E24B4A',
  warning: '#EF9F27',

  // Gamification
  gold: '#F9CF3C',
  goldText: '#B08C09',
} as const;

export const typography = {
  // Nunito Sans throughout — falls back to system font until loaded
  fontFamily: {
    regular: 'NunitoSans_400Regular',
    bold: 'NunitoSans_700Bold',
  },

  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },

  weights: {
    regular: '400' as const,
    bold: '700' as const,
  },

  // Letter spacing from Figma
  tracking: {
    tight: -0.44,
    normal: -0.308,
  },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  full: 999,
} as const;

// Component-level tokens derived from Figma specs
export const components = {
  button: {
    height: 64,
    paddingHorizontal: 24,
    borderRadius: radius.full,
  },
  header: {
    height: 113,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    background: colors.primaryLight,
  },
  navBar: {
    width: 240,
    height: 52,
    borderRadius: radius.full,
    padding: 6,
    itemSize: 40,
    background: colors.primaryMid,
    border: colors.primaryBorder,
  },
  teamCard: {
    width: 174,
    height: 140,
    borderRadius: radius.md,
    paddingVertical: 18,
    paddingHorizontal: spacing.lg,
    border: colors.gray100,
  },
  eventCard: {
    width: 355,
    height: 116,
    borderRadius: radius.md,
  },
  pin: {
    size: 28,
    borderWidth: 2,
    borderColor: colors.white,
  },
} as const;

// Sport definitions — static config for all supported sports
export const sports = [
  { id: 'soccer' as const, label: 'Soccer', emoji: '⚽', color: colors.soccer },
  { id: 'pickleball' as const, label: 'Pickleball', emoji: '🏓', color: colors.pickleball },
  { id: 'basketball' as const, label: 'Basketball', emoji: '🏀', color: colors.basketball },
  { id: 'tennis' as const, label: 'Tennis', emoji: '🎾', color: colors.tennis },
  { id: 'running' as const, label: 'Running', emoji: '🏃', color: colors.running },
];

export type SportId = 'soccer' | 'pickleball' | 'basketball' | 'tennis' | 'running';
