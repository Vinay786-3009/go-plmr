import { ref, onValue, off, type DataSnapshot } from 'firebase/database';
import { rtdb, isRTDBConfigured } from './firebase/firebase';
import type { DriverLocationRTDB } from '@/types';

export const rtdbLocationService = {
  isAvailable(): boolean {
    return isRTDBConfigured();
  },

  subscribeDriverLocations(
    onUpdate: (locations: DriverLocationRTDB[]) => void,
    onError: (error: Error) => void
  ): () => void {
    if (!rtdb) {
      onError(new Error('RTDB_NOT_CONFIGURED'));
      return () => {};
    }

    try {
      const locationsRef = ref(rtdb, 'driverLocations');
      const callback = (snapshot: DataSnapshot) => {
        if (!snapshot.exists()) {
          onUpdate([]);
          return;
        }

        const data = snapshot.val();
        const locations: DriverLocationRTDB[] = Object.keys(data).map((key) => {
          const item = data[key];
          return {
            driverId: key,
            driverName: item.driverName || 'Driver',
            vehicleCategory: item.vehicleCategory || 'bike',
            latitude: Number(item.latitude || item.lat),
            longitude: Number(item.longitude || item.lng),
            heading: item.heading,
            speed: item.speed,
            isOnline: Boolean(item.isOnline),
            status: item.status || 'available',
            currentRideId: item.currentRideId,
            lastUpdated: Number(item.lastUpdated || Date.now()),
          };
        }).filter((loc) => !isNaN(loc.latitude) && !isNaN(loc.longitude));

        onUpdate(locations);
      };

      onValue(locationsRef, callback, (err) => {
        console.error('Error listening to RTDB driver locations:', err);
        onError(err);
      });

      return () => {
        off(locationsRef, 'value', callback);
      };
    } catch (err: any) {
      onError(err);
      return () => {};
    }
  },
};
