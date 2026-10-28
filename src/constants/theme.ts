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

// Step flows (login, sign up, team code) and hero screens — measured from the
// Figma frames (390×844): Login 953:839, Sign up 953:840, Join a team 953:841.
export const flowColors = {
  track: '#D9D9D9',
  grabber: '#B0B0B0',
  heroMuted: '#D9D9D9',
  heroShadeTop: 'rgba(0,0,0,0.44)',
  heroShadeBottom: '#000000',
  backdrop: 'rgba(12,12,12,0.2)',
  spinnerTrack: 'rgba(255,255,255,0.35)',
} as const;

export const flow = {
  gutterLeft: 35,
  gutterRight: 43,
  headerTop: 10,
  headerHeight: 32,
  backLeft: 29,
  titleGap: 16,
  fieldGap: 64,
  title: t(36, 44, '700', -0.3),
  input: t(24, 32, '600', 0),
  code: t(40, 48, '800', 1),
  nextSize: 64,
  nextRight: 29,
  nextKeyboardGap: 63,
  progressHeight: 3,
  heroGutter: 37,
  heroTitle: t(36, 44, '700', -0.3),
  heroBody: t(20, 27, '400', 0),
  heroCta: t(18, 24, '700', 0),
  ctaHeight: 64,
  ctaWidth: 316,
  ctaGap: 16,
  sheetLogo: 121,
  sheetLogoRadius: 20,
  grabberWidth: 129,
  grabberHeight: 6,
} as const;

// Stylized map, Apple Maps–like grayscale: soft ground, parks a shade darker,
// white streets (residential ones fade in with zoom), illustrated fields/courts.
export const mapColors = {
  ground: '#EDEDEF',
  park: '#DFE1DD',
  water: '#D3D8DE',
  street: '#FFFFFF',
  majorCasing: '#D8D8DC',
  pinName: '#3A3A3C',
  label: '#8E8E93',
  labelHalo: '#F4F4F6',
  soccerField: '#CDD3CB',
  court: '#C9CDD7',
  fieldLine: '#FFFFFF',
} as const;
