import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProjectBrowserScreen from '../screens/ProjectBrowserScreenSimple';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ReviewSubmissionScreen from '../screens/ReviewSubmissionScreen';
import MapViewScreen from '../screens/MapViewScreen';
import AnalyticsScreen from '../screens/AnalyticsScreenSimple';

// Navigation
import AuthNavigator from './AuthNavigator';

// Context
import { useAuth } from '../context/AuthContext';

import { theme } from '../styles/theme';

export type RootStackParamList = {
  Main: undefined;
  ProjectDetail: { projectId: string };
  ReviewSubmission: { projectId: string };
};

export type MainTabParamList = {
  Home: undefined;
  Projects: undefined;
  Map: undefined;
  Analytics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Projects':
              iconName = focused ? 'folder' : 'folder-outline';
              break;
            case 'Map':
              iconName = focused ? 'map' : 'map-outline';
              break;
            case 'Analytics':
              iconName = focused ? 'stats-chart' : 'stats-chart-outline';
              break;
            default:
              iconName = 'home-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 8) : 12,
          height: Platform.OS === 'ios' ? 60 + Math.max(insets.bottom, 0) : 70,
          paddingHorizontal: 16,
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerSafeAreaInsets: {
          top: insets.top,
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ title: 'E-निरीक्षण' }}
      />
      <Tab.Screen 
        name="Projects" 
        component={ProjectBrowserScreen}
        options={{ title: 'Browse Projects' }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapViewScreen}
        options={{ title: 'Project Map' }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{ title: 'Analytics' }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication status
  if (loading) {
    return null; // Could return a splash screen component here
  }

  // Show auth navigator if user is not authenticated
  if (!user) {
    return <AuthNavigator />;
  }
  
  // Show main app if user is authenticated
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.surface,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ProjectDetail" 
        component={ProjectDetailScreen}
        options={{ title: 'Project Details' }}
      />
      <Stack.Screen 
        name="ReviewSubmission" 
        component={ReviewSubmissionScreen}
        options={{ title: 'Submit Review' }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
