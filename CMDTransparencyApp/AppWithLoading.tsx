import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import LoadingScreen from './src/components/common/LoadingScreen';
import { store } from './src/redux/store';
import { theme } from './src/styles/theme';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isReduxReady, setIsReduxReady] = useState(false);

  useEffect(() => {
    // Initialize Redux store and check if it's ready
    try {
      const state = store.getState();
      setIsReduxReady(true);
    } catch (error) {
      console.error('Redux initialization error:', error);
      // Continue without Redux for now
      setIsReduxReady(false);
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  if (isReduxReady) {
    return (
      <Provider store={store}>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor={theme.colors.primary} />
          <AppNavigator />
        </NavigationContainer>
      </Provider>
    );
  }

  // Fallback without Redux if there are issues
  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor={theme.colors.primary} />
      <AppNavigator />
    </NavigationContainer>
  );
}