import React, { useMemo } from 'react';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useProjects } from '../hooks/useApi';
import { theme } from '../styles/theme';
import type { Project } from '../types';

const DEFAULT_REGION: Region = {
  latitude: 27.7172,
  longitude: 85.324,
  latitudeDelta: 2,
  longitudeDelta: 2,
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const getProjectCoordinates = (project: Project | any) => {
  const latCandidate =
    project?.location?.lat ??
    project?.location?.latitude ??
    project?.lat ??
    project?.latitude;
  const lngCandidate =
    project?.location?.lng ??
    project?.location?.longitude ??
    project?.lng ??
    project?.longitude;
  const latitude = toNumber(latCandidate);
  const longitude = toNumber(lngCandidate);
  if (latitude !== null && longitude !== null) {
    return { latitude, longitude };
  }
  return null;
};

const MapViewScreen: React.FC = () => {
  const { data: projects, loading, error } = useProjects();

  const geoProjects = useMemo(() => {
    return (projects || [])
      .map(project => {
        const coords = getProjectCoordinates(project);
        if (!coords) return null;
        return { project, coords };
      })
      .filter(Boolean) as Array<{ project: Project; coords: { latitude: number; longitude: number } }>;
  }, [projects]);

  const initialRegion = useMemo<Region>(() => {
    if (geoProjects.length > 0) {
      return {
        latitude: geoProjects[0].coords.latitude,
        longitude: geoProjects[0].coords.longitude,
        latitudeDelta: 0.3,
        longitudeDelta: 0.3,
      };
    }
    return DEFAULT_REGION;
  }, [geoProjects]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.centeredText}>Loading project locations…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Project Map</Text>
        <Text style={styles.centeredText}>{error}</Text>
      </View>
    );
  }

  if (geoProjects.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Project Map</Text>
        <Text style={styles.centeredText}>No location data available for the current filters.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {geoProjects.map(({ project, coords }) => (
          <Marker
            key={project.id ?? `${coords.latitude}-${coords.longitude}`}
            coordinate={coords}
            title={project.procurement_plan?.details_of_work || project.budget_subtitle}
            description={`Progress: ${project.progress_percentage ?? 'N/A'}%`}
          >
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>
                  {project.procurement_plan?.details_of_work || project.budget_subtitle}
                </Text>
                <Text style={styles.calloutMeta}>{project.ministry}</Text>
                <Text style={styles.calloutMeta}>
                  Progress: {project.progress_percentage ?? 'N/A'}%
                </Text>
                {project.location?.address ? (
                  <Text style={styles.calloutMeta}>{project.location.address}</Text>
                ) : null}
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  map: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  centeredText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
  },
  callout: {
    maxWidth: 240,
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  calloutTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  calloutMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
});

export default MapViewScreen;