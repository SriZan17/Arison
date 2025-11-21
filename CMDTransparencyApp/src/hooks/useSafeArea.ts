import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';

export const useSafeArea = () => {
  const insets = useSafeAreaInsets();
  
  return {
    // Raw insets
    top: insets.top,
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    
    // Helper values for common UI patterns
    tabBarHeight: 60 + (Platform.OS === 'ios' ? Math.max(insets.bottom, 0) : 0),
    headerHeight: 44 + insets.top,
    statusBarHeight: Platform.select({
      ios: insets.top,
      android: 24,
      default: 24,
    }),
    
    // Safe area styles for common patterns
    safeAreaStyle: {
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    
    // Container style with safe area (common pattern)
    containerStyle: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    
    // Content padding (excludes top/bottom for headers/tab bars)
    contentStyle: {
      paddingLeft: insets.left,
      paddingRight: insets.right,
    },
    
    // Screen padding (for screens without navigation)
    screenStyle: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: Math.max(insets.bottom, 16),
      paddingLeft: Math.max(insets.left, 16),
      paddingRight: Math.max(insets.right, 16),
    },
  };
};

// Safe area utility functions
export const getSafeAreaStyle = (edges: ('top' | 'bottom' | 'left' | 'right')[]) => {
  const insets = useSafeAreaInsets();
  const style: any = {};
  
  if (edges.includes('top')) style.paddingTop = insets.top;
  if (edges.includes('bottom')) style.paddingBottom = insets.bottom;
  if (edges.includes('left')) style.paddingLeft = insets.left;
  if (edges.includes('right')) style.paddingRight = insets.right;
  
  return style;
};

export default useSafeArea;