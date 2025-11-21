import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider } from 'react-redux';

import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/redux/store';
import { theme } from './src/styles/theme';

export default function App() {
  return (
    <Provider store={store}>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor={theme.colors.primary} />
        <AppNavigator />
      </NavigationContainer>
    </Provider>
  );
}
