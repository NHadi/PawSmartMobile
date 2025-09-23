import { useFonts } from 'expo-font';
import {
  Poppins_300Light,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';

/**
 * Custom hook to load all Poppins font variants
 * Returns font loading status
 */
export const usePoppinsFonts = () => {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_300Light,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  return {
    fontsLoaded,
    fontError,
  };
};

/**
 * Font configuration for easy switching between font families
 * To change fonts globally, modify the FONT_FAMILIES object
 */
export const FONT_FAMILIES = {
  // Primary font family - change this to switch fonts app-wide
  poppins: {
    light: 'Poppins_300Light',
    regular: 'Poppins_400Regular',
    medium: 'Poppins_500Medium',
    semibold: 'Poppins_600SemiBold',
    bold: 'Poppins_700Bold',
    extrabold: 'Poppins_800ExtraBold',
  },
  
  // Add other font families here for easy switching
  // roboto: {
  //   light: 'Roboto_300Light',
  //   regular: 'Roboto_400Regular',
  //   medium: 'Roboto_500Medium',
  //   bold: 'Roboto_700Bold',
  // },
  
  // System fallbacks
  system: {
    light: 'System',
    regular: 'System',
    medium: 'System',
    semibold: 'System', 
    bold: 'System',
    extrabold: 'System',
  }
};

/**
 * Get the current active font family
 * Change this to switch font families globally
 */
export const getCurrentFontFamily = () => FONT_FAMILIES.poppins;

/**
 * Font loading status checker
 */
export const fontLoadingUtils = {
  isLoaded: (fontsLoaded: boolean) => fontsLoaded,
  hasError: (fontError: Error | null) => !!fontError,
  getLoadingMessage: () => 'Loading fonts...',
  getErrorMessage: (error: Error | null) => error?.message || 'Font loading failed',
};