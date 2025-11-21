import React from 'react';
import { StatusBar, Platform, ViewStyle } from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { theme } from '../styles/theme';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  edges?: Edge[];
  style?: ViewStyle;
  showStatusBar?: boolean;
}

const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  backgroundColor = theme.colors.background,
  statusBarStyle = 'light-content',
  edges = ['top', 'bottom', 'left', 'right'],
  style,
  showStatusBar = true,
}) => {
  return (
    <>
      {showStatusBar && (
        <StatusBar 
          barStyle={statusBarStyle}
          backgroundColor={Platform.OS === 'android' ? theme.colors.primary : backgroundColor}
          translucent={Platform.OS === 'android'}
        />
      )}
      <SafeAreaView 
        style={[
          { 
            flex: 1, 
            backgroundColor 
          }, 
          style
        ]}
        edges={edges}
      >
        {children}
      </SafeAreaView>
    </>
  );
};

export default SafeAreaWrapper;