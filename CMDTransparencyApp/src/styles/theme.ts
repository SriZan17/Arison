import { Platform } from 'react-native';

export const theme = {
  colors: {
  primary: '#092153',      // Government blue (UPDATED)
  secondary: '#ea312c',    // Transparency teal (UPDATED)
    success: '#059669',      // Green for completed
    warning: '#D97706',      // Orange for issues
    error: '#DC2626',        // Red for alerts
    background: '#F8FAFC',   // Light gray background
    surface: '#FFFFFF',      // White cards/surfaces
    text: '#1F2937',         // Dark gray text
    textSecondary: '#6B7280', // Medium gray text
    border: '#E5E7EB',       // Light border
    accent: '#7C3AED',       // Purple accent
    disabled: '#9CA3AF',     // Disabled state
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  typography: {
    h1: { 
      fontSize: 28, 
      fontWeight: 'bold' as const, 
      lineHeight: 34 
    },
    h2: { 
      fontSize: 24, 
      fontWeight: 'bold' as const, 
      lineHeight: 30 
    },
    h3: { 
      fontSize: 20, 
      fontWeight: 'bold' as const, 
      lineHeight: 26 
    },
    h4: { 
      fontSize: 18, 
      fontWeight: 'bold' as const, 
      lineHeight: 24 
    },
    body: { 
      fontSize: 16, 
      fontWeight: 'normal' as const, 
      lineHeight: 22 
    },
    caption: { 
      fontSize: 14, 
      fontWeight: 'normal' as const, 
      lineHeight: 20 
    },
    small: { 
      fontSize: 12, 
      fontWeight: 'normal' as const, 
      lineHeight: 18 
    },
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  shadows: {
    sm: {
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
      boxShadow: '0 1px 1px rgba(0,0,0,0.18)',
    },
    md: {
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
    },
    lg: {
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
      boxShadow: '0 4px 8px rgba(0,0,0,0.30)',
    },
  },
  // Safe area helpers
  safeArea: {
    // Default safe area padding
    padding: Platform.select({
      ios: 20,
      android: 16,
      default: 16,
    }),
    // Status bar height
    statusBarHeight: Platform.select({
      ios: 44,
      android: 24,
      default: 24,
    }),
    // Tab bar height
    tabBarHeight: Platform.select({
      ios: 83,
      android: 60,
      default: 60,
    }),
  },
};

export type Theme = typeof theme;