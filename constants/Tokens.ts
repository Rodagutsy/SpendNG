/**
 * SpendNG Design Tokens
 * Source: design-tokens.tokens.json & visual-refinement.md
 */

export const Palette = {
  primary: {
    10: '#001A4D',
    50: '#0B5CFF',
    60: '#3377FF',
    90: '#E6EEFF',
  },
  neutral: {
    10: '#191919',
    20: '#333333',
    90: '#E6E6E6',
    93: '#EDEDED',
    96: '#F5F5F5',
    100: '#FFFFFF',
  },
  neutralVariant: {
    20: '#2B2A27',
    30: '#474540',
    50: '#7B786F',
    80: '#C5C3BF',
  },
  error: {
    main: '#D30000',
    30: '#490000ff',
    90: '#ffdedeff',
  },
  warning: {
    main: '#FFA000',
    30: '#623c00ff',
    90: '#ffdbb1ff',
  },
  success: {
    main: '#00BD00',
    30: '#044504ff',
    90: '#ccffccff',
  },
  gradients: {
    primary: ['#6B4EFF', '#A294FF'],
    secondary: ['#E6E0FF', '#F3F0FF'],
    balance: ['#7B61FF', '#BFAFFF'],
  }
};

export const Colors = {

  main: {
    primary: Palette.primary[50],
    secondary: Palette.primary[60],
    success: Palette.success.main,
    warning: Palette.warning.main,
    error: Palette.error.main,
    background: Palette.neutral[10],
    surface: Palette.neutral[20],
    onBackground: Palette.neutral[96],
    onSurface: Palette.neutral[96],
  },

  light: {
    background: Palette.neutral[96],
    surface: Palette.neutral[100],
    onBackground: Palette.neutral[10],
    onSurface: Palette.neutral[10],
    primary: Palette.primary[50],
    onPrimary: Palette.neutral[100],
    primaryContainer: Palette.primary[90],
    onPrimaryContainer: Palette.primary[10],
    outline: Palette.neutralVariant[50],
    outlineVariant: Palette.neutralVariant[80],
    error: Palette.error[90],
    warning: Palette.warning[90],
    success: Palette.success[90],
    ripple: Palette.neutral[93],
    surfaceContainerLowest: Palette.neutral[100],
    surfaceContainerLow: Palette.neutral[96],
    surfaceContainer: Palette.neutral[93],

    roles: {
      primary: Palette.primary[50],
      success: Palette.success.main,
      warning: Palette.warning.main,
      error: Palette.error.main,
      surface: Palette.neutral[100],
      onSurface: Palette.neutral[10],
      outline: Palette.neutralVariant[50],
    }
  },
  dark: {
    background: Palette.neutral[10],
    surface: Palette.neutral[20],
    onBackground: Palette.neutral[96],
    onSurface: Palette.neutral[96],
    primary: Palette.primary[60],
    onPrimary: Palette.neutral[100],
    primaryContainer: Palette.primary[10],
    onPrimaryContainer: Palette.primary[90],
    outline: Palette.neutralVariant[30],
    outlineVariant: Palette.neutralVariant[20],
    error: Palette.error[30],
    warning: Palette.warning[30],
    success: Palette.success[30],
    ripple: Palette.neutral[20],
    surfaceContainerLowest: Palette.neutral[10],
    surfaceContainerLow: Palette.neutral[20],
    surfaceContainer: Palette.neutralVariant[20],

    roles: {
      primary: Palette.primary[60],
      success: Palette.success.main,
      warning: Palette.warning.main,
      error: Palette.error.main,
      surface: Palette.neutral[20],
      onSurface: Palette.neutral[96],
      outline: Palette.neutralVariant[30],
    }
  }
};

export const Typography = {
  fonts: {
    display: 'Poppins-SemiBold',
    title: 'Poppins-Medium',
    body: 'Poppins',
    medium: 'Poppins-Medium',
  },
  sizes: {
    displayL: 72,
    displayM: 56,
    displayS: 40,
    headlineL: 32,
    headlineM: 28,
    headlineS: 24,
    titleL: 22,
    titleM: 20,
    titleS: 18,
    bodyL: 18,
    bodyM: 16,
    bodyS: 15,
    labelL: 14,
    labelM: 12,
    labelS: 11,
    buttonL: 16,
    buttonM: 14,
    buttonS: 12,
  },
  styles: {
    displaySmallB: {
      fontFamily: 'Poppins-Bold',
      fontSize: 40,
      lineHeight: 52,
    },
    headlineSmallSb: {
      fontFamily: 'Poppins-SemiBold',
      fontSize: 24,
      lineHeight: 32,
    },
    bodyMediumR: {
      fontFamily: 'Poppins',
      fontSize: 16,
      lineHeight: 22,
    },
    bodyMediumM: {
      fontFamily: 'Poppins-Medium',
      fontSize: 16,
      lineHeight: 22,
    },
    labelLargeM: {
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
      lineHeight: 20,
    },
    buttonMedium: {
      fontFamily: 'Poppins-Medium',
      fontSize: 14,
      lineHeight: 14,
    }
  }
};

export const Spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
};

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#1C1C1C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  normal: {
    shadowColor: '#1C1C1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#1C1C1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  }
};

export const ZIndex = {
  base: 0,
  raised: 10,
  sticky: 50,
  nav: 100,
  overlay: 200,
  modal: 300,
  banner: 400,
  toast: 500,
  top: 999,
};
