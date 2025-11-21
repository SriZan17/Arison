import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
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

// Types
import { theme } from '../styles/theme';
import { Project, Statistics } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

interface QuickActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  color?: string;
}

const QuickActionCard: React.FC<QuickActionCardProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  color = theme.colors.primary,
}) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress}>
    <Ionicons name={icon as any} size={32} color={color} />
    <Text style={styles.actionTitle}>{title}</Text>
    <Text style={styles.actionSubtitle}>{subtitle}</Text>
  </TouchableOpacity>
);

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  
  // API hooks
  const { data: statistics, loading: statsLoading, error: statsError, refetch: refetchStats } = useStatistics();
  const { data: projects, loading: projectsLoading, error: projectsError, refetch: refetchProjects } = useProjects({ limit: 5 });
  
  // Local state
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.warn('Location permission denied:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchProjects(),
      ]);
    } catch (error) {
      console.error('Error refreshing:', error);
    }
    setRefreshing(false);
  };

  const handleProjectPress = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'projects':
        navigation.navigate('Main', { screen: 'Projects' });
        break;
      case 'map':
        navigation.navigate('Main', { screen: 'Map' });
        break;
      case 'analytics':
        navigation.navigate('Main', { screen: 'Analytics' });
        break;
      case 'report':
        if (projects && projects.length > 0) {
          navigation.navigate('ReviewSubmission', { projectId: projects[0].id });
        } else {
          Alert.alert('No Projects', 'No projects available for reporting.');
        }
        break;
    }
  };

  const renderStatCard = (title: string, value: string | number, icon: string, color: string) => (
    <Card style={styles.statCard}>
      <View style={styles.statContent}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.statText}>
          <Text style={styles.statValue}>{value}</Text>
          <Text style={styles.statLabel}>{title}</Text>
        </View>
      </View>
    </Card>
  );

  if (statsLoading && !statistics) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <Text style={styles.titleText}>CMD Transparency Portal</Text>
        <Text style={styles.subtitleText}>
          Monitor government procurement projects and contribute to transparency
        </Text>
      </View>

      {/* Error handling */}
      {(statsError || projectsError) && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color={theme.colors.error} />
          <Text style={styles.errorText}>
            {statsError || projectsError}
          </Text>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <QuickActionCard
            icon="folder-outline"
            title="Browse Projects"
            subtitle="View ongoing procurements"
            onPress={() => handleQuickAction('projects')}
            color={theme.colors.primary}
          />
          <QuickActionCard
            icon="map-outline"
            title="Project Map"
            subtitle="Find projects near you"
            onPress={() => handleQuickAction('map')}
            color={theme.colors.secondary}
          />
        </View>
      </View>

      {/* Statistics */}
      {statistics && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview Statistics</Text>
          <View style={styles.statsGrid}>
            {renderStatCard(
              'Total Projects',
              statistics.total_projects,
              'folder',
              theme.colors.primary
            )}
            {renderStatCard(
              'Contract Value',
              `NPR ${(statistics.total_contract_value / 1000000).toFixed(1)}M`,
              'cash',
              theme.colors.success
            )}
            {renderStatCard(
              'Avg Progress',
              `${statistics.average_progress}%`,
              'trending-up',
              theme.colors.secondary
            )}
            {renderStatCard(
              'Citizen Reports',
              statistics.total_citizen_reports,
              'chatbubbles',
              theme.colors.accent
            )}
          </View>
        </View>
      )}

      {/* Recent Projects */}
      {projects && projects.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Projects</Text>
            <Button
              title="View All"
              variant="outline"
              size="small"
              onPress={() => handleQuickAction('projects')}
            />
          </View>
          {projects.slice(0, 3).map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={handleProjectPress}
            />
          ))}
        </View>
      )}

      {/* Location Status */}
      <View style={styles.section}>
        <Card style={styles.locationCard}>
          <View style={styles.locationHeader}>
            <Ionicons 
              name={userLocation ? 'location' : 'location-outline'} 
              size={20} 
              color={userLocation ? theme.colors.success : theme.colors.warning} 
            />
            <Text style={styles.locationTitle}>Location Services</Text>
          </View>
          <Text style={styles.locationText}>
            {userLocation 
              ? 'Location enabled - showing nearby projects'
              : 'Enable location to see projects near you'
            }
          </Text>
          {!userLocation && (
            <Button
              title="Enable Location"
              variant="outline"
              size="small"
              onPress={requestLocationPermission}
              style={styles.locationButton}
            />
          )}
        </Card>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    alignItems: 'center',
    paddingBottom: theme.spacing.xl,
  },
  welcomeText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  titleText: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    color: theme.colors.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  subtitleText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.error + '20',
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.error,
    marginLeft: theme.spacing.sm,
    flex: 1,
  },
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginHorizontal: theme.spacing.xs,
    boxShadow: theme.shadows.sm.boxShadow,
    elevation: theme.shadows.sm.elevation,
  },
  actionTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    marginBottom: theme.spacing.sm,
    marginHorizontal: '1%',
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: theme.typography.small.fontSize,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  locationCard: {
    marginHorizontal: theme.spacing.md,
  },
  locationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  locationTitle: {
    fontSize: theme.typography.h4.fontSize,
    fontWeight: theme.typography.h4.fontWeight,
    color: theme.colors.text,
    marginLeft: theme.spacing.sm,
  },
  locationText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  locationButton: {
    alignSelf: 'flex-start',
  },
});

export default HomeScreen;