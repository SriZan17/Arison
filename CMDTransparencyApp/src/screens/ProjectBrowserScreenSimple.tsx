import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import ProjectCard from '../components/project/ProjectCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Card from '../components/common/Card';

// Hooks
import { useProjects } from '../hooks/useApi';

// Types
import { theme } from '../styles/theme';
import { RootStackParamList, MainTabParamList } from '../navigation/AppNavigator';

type ProjectBrowserNavigationProp = NativeStackNavigationProp<
  RootStackParamList & MainTabParamList,
  'Projects'
>;

const ProjectBrowserScreen: React.FC = () => {
  const navigation = useNavigation<ProjectBrowserNavigationProp>();
  const [searchText, setSearchText] = useState('');
  const [selectedMinistry, setSelectedMinistry] = useState<string>('');

  const { data: projects, loading, error, refetch } = useProjects();

  // Get unique ministries for filter
  const ministries = useMemo(() => {
    if (!projects) return [];
    const uniqueMinistries = [...new Set(projects.map(p => p.ministry))].filter(Boolean);
    return uniqueMinistries.sort();
  }, [projects]);

  // Filter projects based on search and ministry
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    let filtered = projects;

    // Filter by ministry
    if (selectedMinistry) {
      filtered = filtered.filter(project => project.ministry === selectedMinistry);
    }

    // Filter by search text
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase().trim();
      filtered = filtered.filter(project => 
        project.procurement_plan?.details_of_work?.toLowerCase().includes(searchLower) ||
        project.budget_subtitle?.toLowerCase().includes(searchLower) ||
        project.ministry?.toLowerCase().includes(searchLower) ||
        project.procurement_plan?.contractor_name?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [projects, searchText, selectedMinistry]);

  const handleProjectPress = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const handleMinistryFilter = (ministry: string) => {
    setSelectedMinistry(selectedMinistry === ministry ? '' : ministry);
  };

  if (loading) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.title}>Project Browser</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refetch}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Project Browser</Text>
        <Text style={styles.subtitle}>
          {filteredProjects.length} of {projects?.length || 0} projects
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search projects, ministries, contractors..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor={theme.colors.textSecondary}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Ministry Filter Pills */}
      {ministries.length > 0 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Filter by Ministry:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterPill, !selectedMinistry && styles.filterPillActive]}
              onPress={() => setSelectedMinistry('')}
            >
              <Text style={[styles.filterPillText, !selectedMinistry && styles.filterPillTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {ministries.map((ministry) => (
              <TouchableOpacity
                key={ministry}
                style={[styles.filterPill, selectedMinistry === ministry && styles.filterPillActive]}
                onPress={() => handleMinistryFilter(ministry)}
              >
                <Text style={[
                  styles.filterPillText, 
                  selectedMinistry === ministry && styles.filterPillTextActive
                ]} numberOfLines={1}>
                  {ministry}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Project List */}
      {filteredProjects.length > 0 ? (
        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={handleProjectPress}
              showDistance={false}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Card style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Projects Found</Text>
            <Text style={styles.emptyText}>
              {searchText || selectedMinistry
                ? 'Try adjusting your search or filter criteria.'
                : 'No projects are currently available.'}
            </Text>
            {(searchText || selectedMinistry) && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => {
                  setSearchText('');
                  setSelectedMinistry('');
                }}
              >
                <Text style={styles.clearButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </Card>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.surface,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.surface,
    opacity: 0.8,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
  },
  filterLabel: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: theme.spacing.sm,
    maxWidth: 150,
  },
  filterPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  filterPillText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: theme.colors.surface,
  },
  listContent: {
    paddingBottom: theme.spacing.lg,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyCard: {
    alignItems: 'center',
    padding: theme.spacing.xl,
    maxWidth: 300,
  },
  emptyTitle: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    color: theme.colors.text,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  clearButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  clearButtonText: {
    color: theme.colors.surface,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  errorText: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.error,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    color: theme.colors.surface,
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
});

export default ProjectBrowserScreen;