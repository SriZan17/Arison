import * as Location from 'expo-location';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult extends LocationCoordinates {
  address?: string;
}

export class LocationService {
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  static async getCurrentLocation(): Promise<LocationResult> {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const coordinates = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Get address from coordinates
      try {
        const address = await this.reverseGeocode(coordinates);
        return {
          ...coordinates,
          address: address,
        };
      } catch (addressError) {
        console.warn('Could not get address:', addressError);
        return coordinates;
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      throw new Error('Could not get current location');
    }
  }

  static async reverseGeocode(coordinates: LocationCoordinates): Promise<string> {
    try {
      const results = await Location.reverseGeocodeAsync({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });

      if (results.length > 0) {
        const result = results[0];
        const addressParts = [
          result.streetNumber,
          result.street,
          result.district,
          result.city,
          result.subregion,
          result.region,
          result.country,
        ].filter(Boolean);

        return addressParts.join(', ');
      }

      return 'Unknown location';
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw new Error('Could not get address for coordinates');
    }
  }

  static async geocode(address: string): Promise<LocationCoordinates[]> {
    try {
      const results = await Location.geocodeAsync(address);
      return results.map(result => ({
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw new Error('Could not find coordinates for address');
    }
  }

  static calculateDistance(
    point1: LocationCoordinates,
    point2: LocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) * 
      Math.cos(this.toRadians(point2.latitude)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  static formatDistance(kilometers: number): string {
    if (kilometers < 1) {
      return `${Math.round(kilometers * 1000)}m away`;
    } else {
      return `${kilometers.toFixed(1)}km away`;
    }
  }
}