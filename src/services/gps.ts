export interface GPSCoordinate {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
  locationName: string;
  timestamp: string;
}

export async function getCurrentGPSPosition(): Promise<GPSCoordinate> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({
        latitude: 22.9868,
        longitude: 72.3789,
        accuracyMeters: 15,
        locationName: 'Sanand Industrial Estate, Gujarat (Manual Coordinate)',
        timestamp: new Date().toISOString()
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: parseFloat(position.coords.latitude.toFixed(5)),
          longitude: parseFloat(position.coords.longitude.toFixed(5)),
          accuracyMeters: Math.round(position.coords.accuracy),
          locationName: `Site Lat: ${position.coords.latitude.toFixed(4)}°, Lng: ${position.coords.longitude.toFixed(4)}°`,
          timestamp: new Date().toISOString()
        });
      },
      (_err) => {
        // Fallback realistic solar site coordinates if permission denied or unavailable
        resolve({
          latitude: 22.9868,
          longitude: 72.3789,
          accuracyMeters: 10,
          locationName: 'GIDC Sanand Solar Site (Simulated GPS Fix)',
          timestamp: new Date().toISOString()
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000
      }
    );
  });
}
