import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../styles/theme';
import { useProjects } from '../hooks/useApi';
import { openInMaps } from '../utils/mapUtils';
import type { Project } from '../types';

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getCoords = (project: Project | any) => {
  const latCandidate =
    project?.location?.lat ??
    project?.location?.latitude ??
    project?.lat ??
    project?.latitude;
  const lonCandidate =
    project?.location?.lng ??
    project?.location?.longitude ??
    project?.lng ??
    project?.longitude;
  const lat = toNumber(latCandidate);
  const lon = toNumber(lonCandidate);
  if (lat !== null && lon !== null) {
    return { latitude: lat, longitude: lon };
  }
  return null;
};

const MapViewScreen: React.FC = () => {
  const { data: projects, loading, error } = useProjects();

  const projectsWithCoords = useMemo(() => {
    return (projects || [])
      .map((p) => ({ project: p, coords: getCoords(p) }))
      .filter((item) => item.coords);
  }, [projects]);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.message}>Loading project locations…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Project Map</Text>
        <Text style={styles.message}>{error}</Text>
      </View>
    );
  }

  if (!projectsWithCoords.length) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>Project Map</Text>
        <Text style={styles.message}>
          No geolocated projects available. You can enable map features or add project coordinates in the
          backend.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <Text style={styles.title}>Project Map</Text>
      <FlatList
        data={projectsWithCoords}
        keyExtractor={(item) => item.project.id}
        renderItem={({ item }) => {
          const { project, coords } = item;
          return (
            <View style={styles.item}>
              <View style={styles.dotsContainer}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>
              <View style={styles.meta}>
                <Text style={styles.itemTitle} numberOfLines={2}>
                  {project.procurement_plan?.details_of_work || project.budget_subtitle}
                </Text>
                <Text style={styles.itemMeta}>
                  {project.ministry} • Progress: {project.progress_percentage ?? 'N/A'}%
                </Text>
              </View>
              <TouchableOpacity
                style={styles.openBtn}
                onPress={() => openInMaps({ lat: coords!.latitude, lng: coords!.longitude })}
              >
                <Text style={styles.openText}>Open</Text>
              </TouchableOpacity>
            </View>
          );
        }}
        contentContainerStyle={styles.content}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.md,
  },
  listContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
  },
  content: {
    paddingBottom: theme.spacing.lg,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  message: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  meta: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  dotsContainer: {
    width: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.border,
    marginVertical: 2,
  },
  itemTitle: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    marginTop: 6,
  },
  openBtn: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  openText: {
    color: theme.colors.surface,
    fontWeight: '600',
  },
});

export default MapViewScreen;