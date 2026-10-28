// Design tokens — Liquid Glass (Apple iOS 26). Single source of truth:
// never hardcode colors, sizes or radii in screens.
import { Platform, type TextStyle } from 'react-native';

export const colors = {
  brand: '#FF6100',
  brandSoft: 'rgba(255,97,0,0.12)',

  bg: '#F2F2F7',
  surface: '#FFFFFF',
  label: '#000000',
  label2: 'rgba(60,60,67,0.62)',
  label3: 'rgba(60,60,67,0.32)',
  separator: 'rgba(60,60,67,0.14)',
  fill: 'rgba(120,120,128,0.12)',
  fill2: 'rgba(120,120,128,0.20)',
  gray3: '#C7C7CC',
  white: '#FFFFFF',
  black: '#000000',

  glass: 'rgba(255,255,255,0.62)',
  glassBorder: 'rgba(255,255,255,0.75)',
  glassEdge: 'rgba(0,0,0,0.06)',
  scrim: 'rgba(0,0,0,0.3)',

  soccer: '#30B35A',
  pickleball: '#5B5BD6',
  live: '#FF3B30',
  going: '#30B35A',
  orange: '#FF9500',

  heroDark: '#0B0603',
  heroGlow: '#FF6100',
  heroGlowDeep: '#6B2400',
} as const;

const fontFamily = Platform.select({
  web: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif',
  default: undefined,
});

const t = (fontSize: number, lineHeight: number, fontWeight: TextStyle['fontWeight'], letterSpacing = 0): TextStyle => ({
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
});

// Apple text styles
export const type = {
  hero: t(44, 50, '800', -0.5),
  largeTitle: t(34, 41, '700', 0.37),
  title: t(28, 34, '700', 0.36),
  title2: t(22, 28, '700', 0.35),
  title3: t(20, 25, '600', 0.38),
  headline: t(17, 22, '600', -0.41),
  body: t(17, 22, '400', -0.41),
  callout: t(16, 21, '400', -0.32),
  subhead: t(15, 20, '400', -0.24),
  footnote: t(13, 18, '400', -0.08),
  caption: t(12, 16, '400', 0),
  caption2: t(11, 13, '700', 0.3),
  code: t(36, 44, '600', 1),
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  tile: 14,
  card: 22,
  sheet: 32,
  full: 999,
} as const;

export const layout = {
  tabBarHeight: 62,
  control: 50,
  iconButton: 44,
} as const;

export const shadow = {
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
} as const;
