import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const placesService = {
  /**
   * Get user's saved places
   */
  async getSavedPlaces(userId) {
    if (!userId) return [];
    try {
      const userRef = doc(db, 'users', userId);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data().savedPlaces || [];
      }
    } catch (e) {
      console.warn('Error fetching saved places:', e);
    }
    return [];
  },

  /**
   * Add a new saved place
   */
  async addSavedPlace(userId, place) {
    if (!userId) throw new Error('User ID is required');
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    const existingPlaces = snap.exists() ? snap.data().savedPlaces || [] : [];

    const newPlace = {
      id: Date.now().toString(),
      label: place.label || 'Favorite',
      type: place.type || 'other', // 'home' | 'work' | 'other'
      address: place.address,
      latitude: Number(place.latitude),
      longitude: Number(place.longitude),
      createdAt: new Date().toISOString(),
    };

    const updatedPlaces = [...existingPlaces, newPlace];
    await updateDoc(userRef, {
      savedPlaces: updatedPlaces,
      updatedAt: new Date().toISOString(),
    });

    return updatedPlaces;
  },

  /**
   * Delete a saved place by placeId
   */
  async deleteSavedPlace(userId, placeId) {
    if (!userId) throw new Error('User ID is required');
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return [];

    const existingPlaces = snap.data().savedPlaces || [];
    const updatedPlaces = existingPlaces.filter((p) => p.id !== placeId);

    await updateDoc(userRef, {
      savedPlaces: updatedPlaces,
      updatedAt: new Date().toISOString(),
    });

    return updatedPlaces;
  },

  /**
   * Update an existing saved place
   */
  async updateSavedPlace(userId, placeId, updatedFields) {
    if (!userId) throw new Error('User ID is required');
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return [];

    const existingPlaces = snap.data().savedPlaces || [];
    const updatedPlaces = existingPlaces.map((p) =>
      p.id === placeId ? { ...p, ...updatedFields, updatedAt: new Date().toISOString() } : p
    );

    await updateDoc(userRef, {
      savedPlaces: updatedPlaces,
      updatedAt: new Date().toISOString(),
    });

    return updatedPlaces;
  },
};
