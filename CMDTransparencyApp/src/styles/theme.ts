export const theme = {
  colors: {
    primary: '#1E40AF',      // Government blue
    secondary: '#0891B2',    // Transparency teal
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
      fontWeight: '600' as const, 
      lineHeight: 26 
    },
    h4: { 
      fontSize: 18, 
      fontWeight: '600' as const, 
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
    },
    md: {
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    },
    lg: {
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
    },
  },
};

export type Theme = typeof theme;