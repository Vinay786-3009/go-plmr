import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';

// Fallback rates if Firestore fareConfigurations collection does not have active docs yet
const DEFAULT_FARE_RULES = {
  bike: {
    vehicleCategory: 'bike',
    baseFare: 25,
    minFare: 30,
    perKmRate: 9,
    perMinuteRate: 1,
    bookingFee: 5,
    platformCommissionPercent: 15,
  },
  auto: {
    vehicleCategory: 'auto',
    baseFare: 40,
    minFare: 50,
    perKmRate: 15,
    perMinuteRate: 1.5,
    bookingFee: 8,
    platformCommissionPercent: 15,
  },
  cab: {
    vehicleCategory: 'cab',
    baseFare: 80,
    minFare: 100,
    perKmRate: 22,
    perMinuteRate: 2,
    bookingFee: 15,
    platformCommissionPercent: 15,
  },
};

export const fareService = {
  /**
   * Fetch active fare config from Firestore or return local fallback
   */
  async getActiveFare(vehicleCategory) {
    try {
      const colRef = collection(db, 'fareConfigurations');
      const q = query(
        colRef,
        where('vehicleCategory', '==', vehicleCategory),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
    } catch (err) {
      console.warn(`Could not load Firestore fare for ${vehicleCategory}, using fallback:`, err);
    }
    return DEFAULT_FARE_RULES[vehicleCategory] || DEFAULT_FARE_RULES.auto;
  },

  /**
   * Fetch all active fares
   */
  async getAllActiveFares() {
    const categories = ['bike', 'auto', 'cab'];
    const fares = {};
    for (const cat of categories) {
      fares[cat] = await this.getActiveFare(cat);
    }
    return fares;
  },

  /**
   * Calculate authoritative fare breakdown based on exact Admin formula
   */
  calculateFare(distanceKm, durationMinutes, config) {
    const dist = Math.max(0.1, Number(distanceKm) || 1);
    const time = Math.max(1, Number(durationMinutes) || Math.round(dist * 3));

    const baseFare = Number(config.baseFare) || 0;
    const perKmRate = Number(config.perKmRate) || 0;
    const perMinuteRate = Number(config.perMinuteRate) || 0;
    const bookingFee = Number(config.bookingFee) || 0;
    const minFare = Number(config.minFare) || 0;
    const commissionPct = Number(config.platformCommissionPercent) || 15;

    const distanceFare = Math.round(dist * perKmRate);
    const timeFare = Math.round(time * perMinuteRate);
    const rawFare = baseFare + distanceFare + timeFare + bookingFee;
    const totalFare = Math.max(minFare, Math.round(rawFare));

    const platformCommission = Math.round(
      ((totalFare - bookingFee) * commissionPct) / 100 + bookingFee
    );
    const driverEarnings = Math.max(0, totalFare - platformCommission);

    return {
      baseFare,
      distanceFare,
      timeFare,
      bookingFee,
      platformCommission,
      driverEarnings,
      totalFare,
      distanceKm: Number(dist.toFixed(1)),
      durationMinutes: Math.round(time),
    };
  },
};
