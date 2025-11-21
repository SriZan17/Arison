import { Linking, Alert, Platform } from 'react-native';

export interface LocationCoordinates {
  lat: number;
  lng: number;
}

/**
 * Opens the device's default map application with the given coordinates
 * Tries multiple map providers in order of preference:
 * 1. Native Maps app (iOS/Android)
 * 2. Google Maps
 * 3. OpenStreetMap (fallback)
 */
export const openInMaps = async (coordinates: LocationCoordinates): Promise<void> => {
  const { lat, lng } = coordinates;
  
  // Define map URL schemes in order of preference
  const schemes = Platform.select({
    ios: [
      `maps://maps.apple.com/?q=${lat},${lng}`, // iOS Maps
      `comgooglemaps://?q=${lat},${lng}`, // Google Maps iOS
      `https://maps.google.com/maps?q=${lat},${lng}`, // Google Maps web
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` // OpenStreetMap
    ],
    android: [
      `geo:${lat},${lng}`, // Android default maps
      `https://maps.google.com/maps?q=${lat},${lng}`, // Google Maps
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` // OpenStreetMap
    ],
    default: [
      `https://maps.google.com/maps?q=${lat},${lng}`, // Google Maps web
      `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}` // OpenStreetMap
    ]
  }) || [];

  /**
   * Recursively try each map scheme until one works
   */
  const tryOpenMap = async (index = 0): Promise<void> => {
    if (index >= schemes.length) {
      Alert.alert(
        'Map Unavailable',
        'Could not open map application. Please check if you have a maps app installed.',
        [{ text: 'OK' }]
      );
      return;
    }

    const scheme = schemes[index];
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) {
        await Linking.openURL(scheme);
      } else {
        await tryOpenMap(index + 1);
      }
    } catch (error) {
      console.warn(`Failed to open map with scheme: ${scheme}`, error);
      await tryOpenMap(index + 1);
    }
  };

  await tryOpenMap();
};

/**
 * Opens a map with directions from current location to the given coordinates
 */
export const openDirections = async (coordinates: LocationCoordinates): Promise<void> => {
  const { lat, lng } = coordinates;
  
  const schemes = Platform.select({
    ios: [
      `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`, // iOS Maps with directions
      `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`, // Google Maps iOS directions
      `https://maps.google.com/maps?daddr=${lat},${lng}` // Google Maps web directions
    ],
    android: [
      `google.navigation:q=${lat},${lng}`, // Google Maps navigation
      `https://maps.google.com/maps?daddr=${lat},${lng}` // Google Maps web directions
    ],
    default: [
      `https://maps.google.com/maps?daddr=${lat},${lng}` // Google Maps web directions
    ]
  }) || [];

  const tryOpenDirections = async (index = 0): Promise<void> => {
    if (index >= schemes.length) {
      // Fallback to regular map opening
      await openInMaps(coordinates);
      return;
    }

    const scheme = schemes[index];
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      if (canOpen) {
        await Linking.openURL(scheme);
      } else {
        await tryOpenDirections(index + 1);
      }
    } catch (error) {
      console.warn(`Failed to open directions with scheme: ${scheme}`, error);
      await tryOpenDirections(index + 1);
    }
  };

  await tryOpenDirections();
};

/**
 * Formats coordinates for display
 */
export const formatCoordinates = (coordinates: LocationCoordinates): string => {
  return `${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`;
};