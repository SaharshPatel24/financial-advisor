// =============================================================================
// Fina — Typography Scale
// Uses the device system font (SF Pro on iOS, Roboto on Android).
// =============================================================================

export const typography = {
  // Sizes
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 28,
    '3xl': 34,
  },

  // Weights (React Native uses string literals)
  weight: {
    regular:  '400' as const,
    medium:   '500' as const,
    semibold: '600' as const,
    bold:     '700' as const,
  },

  // Line heights
  leading: {
    tight:  1.2,
    normal: 1.5,
    loose:  1.75,
  },
} as const;
