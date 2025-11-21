import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet } from 'react-native';

import LoadingScreen from './src/components/common/LoadingScreen';
import { theme } from './src/styles/theme';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if ((this.state as any).hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>
            Please restart the app to try again.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.error,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [AppNavigator, setAppNavigator] = useState<React.ComponentType | null>(null);

  useEffect(() => {
    // Dynamic import to handle potential import errors
    const loadApp = async () => {
      try {
        const { default: Navigator } = await import('./src/navigation/AppNavigator');
        setAppNavigator(() => Navigator);
      } catch (error) {
        console.error('Failed to load AppNavigator:', error);
        // Fallback to simple component
        setAppNavigator(() => () => (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Basic App Loaded</Text>
          </View>
        ));
      }
    };

    loadApp();
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={theme.colors.primary} />
        {AppNavigator ? <AppNavigator /> : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Loading App...</Text>
          </View>
        )}
      </NavigationContainer>
    </ErrorBoundary>
  );
}