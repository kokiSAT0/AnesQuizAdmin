// theme/tokens.ts
// Auto‑generated Material Design 3 color tokens based on source color #4DA6FF.
// Light & dark schemes are provided.  ALWAYS import from this file instead of
// hard‑coding hex values in components.

export const colors = {
  light: {
    /* Primary brand color */
    primary: '#0061A9',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D6E4FF',
    onPrimaryContainer: '#001D36',

    /* Secondary (UI chrome) */
    secondary: '#536579',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#D7E3F8',
    onSecondaryContainer: '#101C2B',

    /* Tertiary (optional accent) */
    tertiary: '#6A5D92',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E7DEFF',
    onTertiaryContainer: '#241A4B',

    /* Error */
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#370003',

    /* Neutral surfaces */
    background: '#FDFBFF',
    onBackground: '#1A1C1E',
    surface: '#FDFBFF',
    onSurface: '#1A1C1E',
    surfaceVariant: '#DEE3EB',
    onSurfaceVariant: '#43474E',
    outline: '#73777F',
    outlineVariant: '#C3C7CF',
    inverseSurface: '#2F3033',
    inverseOnSurface: '#F1F0F4',
    inversePrimary: '#A9C7FF',
    shadow: '#000000',

    /* --- Quiz-App custom chips (light) --------------------- */
    levelChip: '#E8F4FD', // 従来の薄色
    levelChipSelected: '#C2DEF9', // 1トーン濃い

    categoryChip: '#E9F7EF',
    categoryChipSelected: '#C7EFD9',

    progressChip: '#FEF5E7',
    progressChipSelected: '#FCE8CE',
  },

  dark: {
    primary: '#A9C7FF',
    onPrimary: '#00315A',
    primaryContainer: '#004881',
    onPrimaryContainer: '#D6E4FF',

    secondary: '#BBC7DB',
    onSecondary: '#263241',
    secondaryContainer: '#3B4A58',
    onSecondaryContainer: '#D7E3F8',

    tertiary: '#CBC0FF',
    onTertiary: '#352C5B',
    tertiaryContainer: '#4C436F',
    onTertiaryContainer: '#E7DEFF',

    error: '#FFB4AB',
    onError: '#690005',
    errorContainer: '#93000A',
    onErrorContainer: '#FFDAD6',

    background: '#1A1C1E',
    onBackground: '#E3E2E6',
    surface: '#1A1C1E',
    onSurface: '#E3E2E6',
    surfaceVariant: '#43474E',
    onSurfaceVariant: '#C3C7CF',
    outline: '#8D9199',
    outlineVariant: '#43474E',
    inverseSurface: '#E3E2E6',
    inverseOnSurface: '#1A1C1E',
    inversePrimary: '#0061A9',
    shadow: '#000000',

    /* --- Quiz-App custom chips (dark) ---------------------- */
    levelChip: '#27486B',
    levelChipSelected: '#335B85',

    categoryChip: '#234437',
    categoryChipSelected: '#2E5547',

    progressChip: '#56391A',
    progressChipSelected: '#644826',
  },
} as const;

export type ColorScheme = typeof colors.light;
