import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProjectCard from '../components/project/ProjectCard';

// Hooks
import { useStatistics, useProjects } from '../hooks/useApi';

// Services
import { LocationService } from '../services/locationService';

// Context
import { useAuth } from '../context/AuthContext';

// Types
import { theme } from '../styles/theme';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList & MainTabParamList,
  'Home'
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { user, logout } = useAuth();
  
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // API calls using our custom hooks
  const { 
    data: statistics, 
    loading: statsLoading, 
    refetch: refetchStats 
  } = useStatistics();
  
  const { 
    data: recentProjects, 
    loading: projectsLoading,
    refetch: refetchProjects 
  } = useProjects();

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation({
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (error) {
      console.warn('Could not get location:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchProjects(),
        requestLocation(),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };

  const handleReportIssue = () => {
    // Navigate to project browser to select a project first
    Alert.alert(
      'Report Issue',
      'Please select a project from the Projects tab to submit a report.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Browse Projects', 
          onPress: () => navigation.navigate('Projects')
        },
      ]
    );
  };

  const handleViewProject = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        },
      ]
    );
  };

  if (statsLoading || projectsLoading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const formatCurrency = (amount: number) => {
    return `NPR ${(amount / 1000000).toFixed(1)}M`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={theme.colors.primary} 
        translucent={Platform.OS === 'android'}
      />
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.welcomeText}>
              Welcome, {user?.name || 'User'}
            </Text>
            <Text style={styles.titleText}>E-निरीक्षण</Text>
            <Text style={styles.subtitleText}>
              Monitor government procurement projects and contribute to transparency
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleReportIssue}
        >
          <Ionicons name="flag-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Report Issue</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Projects')}
        >
          <Ionicons name="search-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>Find Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.actionText}>View Map</Text>
        </TouchableOpacity>
      </View>

      {/* Statistics Cards */}
      {statistics && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Overview</Text>
          
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{statistics.total_projects}</Text>
              <Text style={styles.statLabel}>Total Projects</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>
                {formatCurrency(statistics.total_contract_value)}
              </Text>
              <Text style={styles.statLabel}>Contract Value</Text>
            </Card>
          </View>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{statistics.average_progress}%</Text>
              <Text style={styles.statLabel}>Avg Progress</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statNumber}>{statistics.total_citizen_reports}</Text>
              <Text style={styles.statLabel}>Citizen Reports</Text>
            </Card>
          </View>
        </View>
      )}

      {/* Recent Projects */}
      <View style={styles.recentProjects}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Projects</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {recentProjects && recentProjects.length > 0 ? (
          recentProjects.slice(0, 5).map((project: any) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={handleViewProject}
            />
          ))
        ) : (
          <Card>
            <Text style={styles.noProjectsText}>No recent projects available</Text>
          </Card>
        )}
      </View>

      {/* Location Status */}
      {userLocation && (
        <Card style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons name="location-outline" size={20} color={theme.colors.success} />
            <Text style={styles.locationTitle}>Location Services Active</Text>
          </View>
          <Text style={styles.locationText}>
            You'll receive notifications about projects near your location.
          </Text>
        </Card>
      )}
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  logoutButton: {
    padding: theme.spacing.sm,
    marginTop: -theme.spacing.sm,
  },
  welcomeText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.surface,
    opacity: 0.8,
  },
  titleText: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.surface,
    marginVertical: theme.spacing.xs,
  },
  subtitleText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.surface,
    opacity: 0.9,
    lineHeight: 18,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    marginTop: -theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.md,
  },
  actionButton: {
    alignItems: 'center',
    padding: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.primary,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  statsContainer: {
    padding: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  statCard: {
    flex: 0.48,
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  statNumber: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  recentProjects: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  viewAllText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  noProjectsText: {
    textAlign: 'center',
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body.fontSize,
    padding: theme.spacing.lg,
  },
  locationCard: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    backgroundColor: theme.colors.success + '10',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.success,
    marginLeft: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default HomeScreen;