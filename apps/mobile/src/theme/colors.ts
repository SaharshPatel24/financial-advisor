// =============================================================================
// Fina — Brand Colour Palette
//
// To rebrand: edit ONLY this file. Every screen, component, and navigator
// imports from here — nothing is hardcoded anywhere else.
// =============================================================================

// ---------------------------------------------------------------------------
// Base palette (raw values — prefer semantic aliases below in components)
// ---------------------------------------------------------------------------
const palette = {
  indigo50:  '#eef2ff',
  indigo100: '#e0e7ff',
  indigo400: '#818cf8',
  indigo500: '#6366f1',
  indigo600: '#4f46e5',
  indigo700: '#4338ca',

  emerald400: '#34d399',
  emerald500: '#10b981',
  emerald600: '#059669',

  red400: '#f87171',
  red500: '#ef4444',

  amber400: '#fbbf24',
  amber500: '#f59e0b',

  slate50:  '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate700: '#334155',
  slate900: '#0f172a',

  white: '#ffffff',
  black: '#000000',
} as const;

// ---------------------------------------------------------------------------
// Semantic aliases — use these in components, never raw palette values
// ---------------------------------------------------------------------------
export const colors = {
  // Brand
  primary:       palette.indigo500,
  primaryDark:   palette.indigo600,
  primaryLight:  palette.indigo400,
  primarySubtle: palette.indigo50,

  // Feedback
  success:       palette.emerald500,
  successLight:  palette.emerald400,
  danger:        palette.red500,
  dangerLight:   palette.red400,
  warning:       palette.amber500,
  warningLight:  palette.amber400,

  // Surfaces
  background:    palette.slate50,
  surface:       palette.white,
  surfaceAlt:    palette.slate100,
  border:        palette.slate200,
  borderStrong:  palette.slate300,

  // Text
  textPrimary:   palette.slate900,
  textSecondary: palette.slate500,
  textMuted:     palette.slate400,
  textInverse:   palette.white,

  // Transaction specific
  income:  palette.emerald500,
  expense: palette.red500,

  // Transparent
  overlay: 'rgba(15, 23, 42, 0.4)',
} as const;

export type ColorKey = keyof typeof colors;
