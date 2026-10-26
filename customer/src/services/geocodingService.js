import { PALAMANER_COORDINATES } from './firebase';

// Known popular landmarks in Palamaner, Andhra Pradesh
export const PALAMANER_LANDMARKS = [
  {
    name: 'Palamaner RTC Bus Stand',
    address: 'RTC Complex, Palamaner Main Road, AP 517408',
    latitude: 13.2014,
    longitude: 78.7491,
  },
  {
    name: 'Palamaner Clock Tower (Gandhi Circle)',
    address: 'Gandhi Road, Center Circle, Palamaner, AP 517408',
    latitude: 13.2001,
    longitude: 78.7512,
  },
  {
    name: 'Government Area Hospital Palamaner',
    address: 'Hospital Road, Palamaner, AP 517408',
    latitude: 13.1978,
    longitude: 78.7475,
  },
  {
    name: 'PES Institute of Medical Sciences / Kuppam Road',
    address: 'Kuppam Highway Junction, Palamaner, AP 517408',
    latitude: 13.1925,
    longitude: 78.7440,
  },
  {
    name: 'Palamaner Forest Guest House / Reserve',
    address: 'Forest Division Office, Chittoor Road, Palamaner',
    latitude: 13.2045,
    longitude: 78.7560,
  },
  {
    name: 'Byreddipalli Cross Junction',
    address: 'NH 42 Junction, Palamaner, AP',
    latitude: 13.2080,
    longitude: 78.7420,
  },
  {
    name: 'Bangarupalem / Chittoor Highway Bypass',
    address: 'Bangalore-Chennai NH Bypass, Palamaner',
    latitude: 13.2120,
    longitude: 78.7610,
  },
  {
    name: 'V.Kota Road Junction',
    address: 'Venkatagirikota Road, Palamaner, AP',
    latitude: 13.1940,
    longitude: 78.7535,
  },
];

export const geocodingService = {
  /**
   * Search for locations in Palamaner and nearby areas
   */
  async searchLocations(queryText) {
    if (!queryText || queryText.trim().length < 2) return [];

    const queryLower = queryText.toLowerCase().trim();

    // 1. Check local Palamaner landmark matches first
    const matchedLandmarks = PALAMANER_LANDMARKS.filter(
      (lm) =>
        lm.name.toLowerCase().includes(queryLower) ||
        lm.address.toLowerCase().includes(queryLower)
    ).map((lm) => ({
      name: lm.name,
      address: lm.address,
      latitude: lm.latitude,
      longitude: lm.longitude,
      isLandmark: true,
    }));

    // 2. Query OpenStreetMap Nominatim with viewbox focused on Palamaner region
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        queryText + ', Palamaner, Andhra Pradesh'
      )}&viewbox=78.50,13.05,79.05,13.35&bounded=0&limit=5`;

      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'GoPlmrCustomerApp/1.0',
        },
      });

      if (response.ok) {
        const results = await response.json();
        const osmResults = results.map((item) => ({
          name: item.display_name.split(',')[0],
          address: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
          isLandmark: false,
        }));

        // Deduplicate against landmarks
        const combined = [...matchedLandmarks];
        osmResults.forEach((osm) => {
          if (!combined.some((c) => Math.abs(c.latitude - osm.latitude) < 0.001 && Math.abs(c.longitude - osm.longitude) < 0.001)) {
            combined.push(osm);
          }
        });

        return combined.slice(0, 6);
      }
    } catch (err) {
      console.warn('Nominatim search failed, returning local landmark matches:', err);
    }

    return matchedLandmarks;
  },

  /**
   * Reverse geocode coordinates to an address string
   */
  async reverseGeocode(latitude, longitude) {
    // Check if close to known landmarks (< 100 meters)
    for (const lm of PALAMANER_LANDMARKS) {
      const dist = this.calculateDistanceKm(latitude, longitude, lm.latitude, lm.longitude);
      if (dist < 0.15) {
        return `${lm.name}, Palamaner`;
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
      const response = await fetch(url, {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'GoPlmrCustomerApp/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          // Return concise address (first 2-3 parts + Palamaner)
          const shortAddress = parts.slice(0, 3).join(',').trim();
          return shortAddress.includes('Palamaner') ? shortAddress : `${shortAddress}, Palamaner`;
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding failed:', err);
    }

    return `Near Palamaner (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
  },

  /**
   * Haversine formula to compute distance in Kilometers
   * Multiplies by 1.25 road curvature factor for real driving approximation
   */
  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 1.5;
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const straightDist = R * c;

    // Apply road curve multiplier (avg 1.25 for urban/rural roads)
    const roadDist = Math.max(0.5, straightDist * 1.25);
    return Number(roadDist.toFixed(1));
  },

  /**
   * Estimate travel duration in minutes based on vehicle type
   */
  estimateDurationMinutes(distanceKm, vehicleCategory = 'auto') {
    // Average speeds in Palamaner town/rural traffic
    const speedKmH = vehicleCategory === 'bike' ? 32 : vehicleCategory === 'auto' ? 26 : 30;
    const hours = distanceKm / speedKmH;
    const minutes = Math.round(hours * 60) + 3; // +3 mins for traffic/signals
    return Math.max(3, minutes);
  },

  /**
   * Default Palamaner location point
   */
  getDefaultPickup() {
    return {
      name: 'Palamaner RTC Bus Stand',
      address: 'RTC Complex, Palamaner Main Road, AP 517408',
      latitude: PALAMANER_COORDINATES.lat,
      longitude: PALAMANER_COORDINATES.lng,
    };
  },
};
