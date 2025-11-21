import React, { CSSProperties, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { useProjects } from '../hooks/useApi';
import { theme } from '../styles/theme';
import type { Project } from '../types';

const DEFAULT_CENTER: [number, number] = [27.7172, 85.324];
// Nepal bounding box: [southWestLat, southWestLng], [northEastLat, northEastLng]
const NEPAL_BOUNDS: [[number, number], [number, number]] = [[26.0, 80.0], [31.0, 88.5]];

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
    return [lat, lon] as [number, number];
  }
  return null;
};

const MapViewScreen: React.FC = () => {
  const { data: projects, loading, error } = useProjects();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined' && !document.querySelector('link[data-leaflet]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.setAttribute('data-leaflet', '1');
      document.head.appendChild(link);
    }

    // Use a simple dot icon (SVG in a divIcon) so the web map does not rely on external marker images.
    // This prevents broken image icons when CDN resources are blocked.
    const dotHtml = `
      <span style="display:block;width:14px;height:14px;border-radius:14px;background:${theme.colors.primary};border:2px solid white;box-shadow:0 1px 2px rgba(0,0,0,0.25)"></span>
    `;
    // Create a reusable divIcon for markers
    (L as any).DotIcon = L.divIcon({ html: dotHtml, className: '', iconSize: [18, 18], iconAnchor: [9, 9] });

    setIsReady(true);
  }, []);

  const projectsWithCoords = useMemo(() => {
    return (projects || [])
      .map(project => {
        const coords = getCoords(project);
        if (!coords) return null;
        return { project, coords };
      })
      .filter(Boolean) as Array<{ project: Project; coords: [number, number] }>;
  }, [projects]);

  const center = useMemo<[number, number]>(() => {
    if (projectsWithCoords.length > 0) {
      return projectsWithCoords[0].coords;
    }
    return DEFAULT_CENTER;
  }, [projectsWithCoords]);

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

  if (!isReady || typeof window === 'undefined') {
    return (
      <View style={styles.webList}>
        <Text style={styles.title}>Project Map</Text>
        {projectsWithCoords.length ? (
          projectsWithCoords.map(({ project, coords }) => (
            <TouchableOpacity
              key={project.id ?? `${coords[0]}-${coords[1]}`}
              style={styles.item}
              onPress={() =>
                Linking.openURL(
                  `https://www.openstreetmap.org/?mlat=${coords[0]}&mlon=${coords[1]}#map=16/${coords[0]}/${coords[1]}`
                )
              }
            >
              <Text style={styles.itemTitle}>
                {project.procurement_plan?.details_of_work || project.budget_subtitle}
              </Text>
              <Text style={styles.itemMeta}>{project.ministry}</Text>
              <Text style={styles.itemMeta}>
                Progress: {project.progress_percentage ?? 'N/A'}%
              </Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.centeredText}>No geolocated projects available.</Text>
        )}
      </View>
    );
  }

  const mapStyle: CSSProperties = { width: '100%', height: '100%' };

  return (
    <View style={styles.webContainer}>
      <Text style={styles.title}>Project Map</Text>
      <View style={styles.webMapWrapper}>
        <MapContainer
          // fit to Nepal and prevent panning outside the country
          bounds={NEPAL_BOUNDS}
          maxBounds={NEPAL_BOUNDS}
          maxBoundsViscosity={1.0}
          center={center}
          zoom={7}
          minZoom={6}
          maxZoom={12}
          style={mapStyle}
          scrollWheelZoom
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {projectsWithCoords.map(({ project, coords }) => (
            <Marker key={project.id ?? `${coords[0]}-${coords[1]}`} position={coords} icon={(L as any).DotIcon}>
              <Popup>
                <div style={{ maxWidth: 220 }}>
                  <strong>
                    {project.procurement_plan?.details_of_work || project.budget_subtitle}
                  </strong>
                  <br />
                  {project.ministry}
                  <br />
                  Progress: {project.progress_percentage ?? 'N/A'}%
                  {project.location?.address ? (
                    <>
                      <br />
                      {project.location.address}
                    </>
                  ) : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  webContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    color: theme.colors.text,
    margin: theme.spacing.md,
  },
  webMapWrapper: {
    flex: 1,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  webList: {
    flex: 1,
    padding: theme.spacing.md,
  },
  item: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  itemTitle: {
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  itemMeta: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption.fontSize,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.background,
  },
  centeredText: {
    marginTop: theme.spacing.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default MapViewScreen;

