import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Components
import ProjectCard from '../components/project/ProjectCard';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Redux
import { useGetProjectsQuery } from '../redux/api/projectsApi';

// Types
import { theme } from '../styles/theme';
import { Project } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';

type ProjectBrowserNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main'
>;

const ProjectBrowserScreen: React.FC = () => {
  const navigation = useNavigation<ProjectBrowserNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    data: projects, 
    isLoading, 
    refetch 
  } = useGetProjectsQuery({});

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error('Error refreshing projects:', error);
    }
    setRefreshing(false);
  };

  const handleProjectPress = (projectId: string) => {
    navigation.navigate('ProjectDetail', { projectId });
  };

  const renderProject = ({ item }: { item: Project }) => (
    <ProjectCard
      project={item}
      onPress={handleProjectPress}
    />
  );

  if (isLoading && !projects) {
    return <LoadingSpinner message="Loading projects..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        renderItem={renderProject}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContainer: {
    paddingVertical: theme.spacing.md,
  },
});

export default ProjectBrowserScreen;