// Font Configuration - Easy to change for entire app
const FONT_CONFIG = {
  // Primary font family - Change this to switch fonts globally
  PRIMARY_FONT: 'Poppins',
  
  // Font weights mapping for different variants
  WEIGHTS: {
    light: '300',
    regular: '400', 
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  
  // Fallback fonts for different platforms
  FALLBACKS: {
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }
};

// Helper function to get font family with weight
const getFontFamily = (weight: keyof typeof FONT_CONFIG.WEIGHTS = 'regular') => {
  const baseFont = FONT_CONFIG.PRIMARY_FONT;
  const weightValue = FONT_CONFIG.WEIGHTS[weight];
  
  // For Poppins and other Google Fonts, use weight-specific names
  switch (weight) {
    case 'light':
      return `${baseFont}_300Light`;
    case 'regular':
      return `${baseFont}_400Regular`;
    case 'medium':
      return `${baseFont}_500Medium`;
    case 'semibold':
      return `${baseFont}_600SemiBold`;
    case 'bold':
      return `${baseFont}_700Bold`;
    case 'extrabold':
      return `${baseFont}_800ExtraBold`;
    default:
      return `${baseFont}_400Regular`;
  }
};

export const Typography = {
  // Font families with easy configuration
  fontFamily: {
    light: getFontFamily('light'),
    regular: getFontFamily('regular'),
    medium: getFontFamily('medium'),
    semibold: getFontFamily('semibold'),
    bold: getFontFamily('bold'),
    extrabold: getFontFamily('extrabold'),
    
    // Legacy support - maps to new system for backward compatibility
    default: getFontFamily('regular'),
  },
  
  // Font sizes - easy to modify globally
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 36,
    '6xl': 40,
  },
  
  // Font weights - matches the font family variants
  fontWeight: {
    light: '300' as '300',
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
    extrabold: '800' as '800',
  },
  
  // Line heights for better readability
  lineHeight: {
    tight: 1.2,
    snug: 1.3,
    normal: 1.5,
    relaxed: 1.8,
    loose: 2.0,
  },
  
  // Letter spacing for fine-tuning
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },
};

// Helper function to create consistent text styles
export const createTextStyle = (config: {
  size?: keyof typeof Typography.fontSize;
  weight?: keyof typeof Typography.fontFamily;
  lineHeight?: keyof typeof Typography.lineHeight;
  letterSpacing?: keyof typeof Typography.letterSpacing;
  color?: string;
}) => ({
  fontSize: config.size ? Typography.fontSize[config.size] : Typography.fontSize.base,
  fontFamily: config.weight ? Typography.fontFamily[config.weight] : Typography.fontFamily.regular,
  lineHeight: config.lineHeight ? Typography.fontSize[config.size || 'base'] * Typography.lineHeight[config.lineHeight] : Typography.fontSize[config.size || 'base'] * Typography.lineHeight.normal,
  letterSpacing: config.letterSpacing ? Typography.letterSpacing[config.letterSpacing] : Typography.letterSpacing.normal,
  color: config.color || '#000000',
});

// Common text style presets for consistency
export const TextStyles = {
  // Headings
  h1: createTextStyle({ size: '4xl', weight: 'bold', lineHeight: 'tight' }),
  h2: createTextStyle({ size: '3xl', weight: 'bold', lineHeight: 'tight' }),
  h3: createTextStyle({ size: '2xl', weight: 'semibold', lineHeight: 'snug' }),
  h4: createTextStyle({ size: 'xl', weight: 'semibold', lineHeight: 'snug' }),
  h5: createTextStyle({ size: 'lg', weight: 'medium', lineHeight: 'normal' }),
  h6: createTextStyle({ size: 'base', weight: 'medium', lineHeight: 'normal' }),
  
  // Body text
  bodyLarge: createTextStyle({ size: 'lg', weight: 'regular', lineHeight: 'relaxed' }),
  body: createTextStyle({ size: 'base', weight: 'regular', lineHeight: 'normal' }),
  bodySmall: createTextStyle({ size: 'sm', weight: 'regular', lineHeight: 'normal' }),
  
  // Special text
  caption: createTextStyle({ size: 'xs', weight: 'regular', lineHeight: 'normal' }),
  button: createTextStyle({ size: 'base', weight: 'semibold', lineHeight: 'normal' }),
  link: createTextStyle({ size: 'base', weight: 'medium', lineHeight: 'normal' }),
  
  // Input and form text
  input: createTextStyle({ size: 'base', weight: 'regular', lineHeight: 'normal' }),
  label: createTextStyle({ size: 'sm', weight: 'medium', lineHeight: 'normal' }),
  placeholder: createTextStyle({ size: 'base', weight: 'regular', lineHeight: 'normal' }),
};

// Export font configuration for easy modification
export const FontConfig = FONT_CONFIG;