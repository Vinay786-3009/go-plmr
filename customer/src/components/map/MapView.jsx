import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { PALAMANER_COORDINATES } from '../../services/firebase';

// Fix standard Leaflet default icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom styled HTML marker icons
const createCustomIcon = (type, label) => {
  const isPickup = type === 'pickup';
  const bgColor = isPickup ? '#059669' : '#e11d48'; // emerald-600 vs rose-600
  const ringColor = isPickup ? 'rgba(5, 150, 105, 0.25)' : 'rgba(225, 29, 72, 0.25)';
  const iconLetter = isPickup ? 'A' : 'B';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="
          width: 32px;
          height: 32px;
          background-color: ${bgColor};
          border: 2.5px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px ${ringColor}, 0 2px 4px rgba(0,0,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 13px;
        ">
          ${iconLetter}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid ${bgColor};
          margin-top: -1px;
        "></div>
      </div>
    `,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -36],
  });
};

export const MapView = ({
  pickup,
  dropoff,
  currentLocation,
  onMapClick,
  height = '280px',
  interactive = true,
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const dropoffMarkerRef = useRef(null);
  const currentLocMarkerRef = useRef(null);
  const routeLineRef = useRef(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // Prevent multiple inits

    const defaultCenter = [
      pickup?.latitude || PALAMANER_COORDINATES.lat,
      pickup?.longitude || PALAMANER_COORDINATES.lng,
    ];

    const map = L.map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
    });

    // High quality OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Zoom control at bottom right for clean mobile UI
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Click handler
    if (interactive && onMapClick) {
      map.on('click', (e) => {
        onMapClick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
      });
    }

    mapInstanceRef.current = map;

    // Force size re-calculation after mount (crucial for mobile/WebView)
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Pickup Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickup?.latitude && pickup?.longitude) {
      const pos = [pickup.latitude, pickup.longitude];
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(pos, {
          icon: createCustomIcon('pickup', 'Pickup'),
        }).addTo(map);
      } else {
        pickupMarkerRef.current.setLatLng(pos);
      }
      pickupMarkerRef.current.bindPopup(`<b>Pickup:</b><br/>${pickup.address || 'Selected Location'}`);
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
  }, [pickup]);

  // Sync Dropoff Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (dropoff?.latitude && dropoff?.longitude) {
      const pos = [dropoff.latitude, dropoff.longitude];
      if (!dropoffMarkerRef.current) {
        dropoffMarkerRef.current = L.marker(pos, {
          icon: createCustomIcon('dropoff', 'Dropoff'),
        }).addTo(map);
      } else {
        dropoffMarkerRef.current.setLatLng(pos);
      }
      dropoffMarkerRef.current.bindPopup(`<b>Dropoff:</b><br/>${dropoff.address || 'Selected Location'}`);
    } else if (dropoffMarkerRef.current) {
      map.removeLayer(dropoffMarkerRef.current);
      dropoffMarkerRef.current = null;
    }
  }, [dropoff]);

  // Sync Current GPS Location Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentLocation?.latitude && currentLocation?.longitude) {
      const pos = [currentLocation.latitude, currentLocation.longitude];
      if (!currentLocMarkerRef.current) {
        const pulseIcon = L.divIcon({
          className: 'gps-pulse-marker',
          html: `
            <div style="position: relative; width: 18px; height: 18px;">
              <div style="
                position: absolute;
                width: 18px;
                height: 18px;
                background-color: #059669;
                border: 3px solid #ffffff;
                border-radius: 50%;
                box-shadow: 0 0 10px rgba(5, 150, 105, 0.6);
                z-index: 2;
              "></div>
              <div class="pulse-marker" style="
                position: absolute;
                width: 18px;
                height: 18px;
                border-radius: 50%;
                background-color: rgba(16, 185, 129, 0.4);
                z-index: 1;
              "></div>
            </div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        currentLocMarkerRef.current = L.marker(pos, { icon: pulseIcon }).addTo(map);
      } else {
        currentLocMarkerRef.current.setLatLng(pos);
      }
    } else if (currentLocMarkerRef.current) {
      map.removeLayer(currentLocMarkerRef.current);
      currentLocMarkerRef.current = null;
    }
  }, [currentLocation]);

  // Sync Route Line & Auto Bounds
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pickup?.latitude && dropoff?.latitude) {
      const p1 = [pickup.latitude, pickup.longitude];
      const p2 = [dropoff.latitude, dropoff.longitude];

      if (!routeLineRef.current) {
        routeLineRef.current = L.polyline([p1, p2], {
          color: '#059669',
          weight: 4,
          opacity: 0.85,
          dashArray: '6, 8',
        }).addTo(map);
      } else {
        routeLineRef.current.setLatLngs([p1, p2]);
      }

      // Smoothly fit bounds
      try {
        const bounds = L.latLngBounds([p1, p2]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
      } catch (e) {
        console.warn('Error adjusting map bounds:', e);
      }
    } else {
      if (routeLineRef.current) {
        map.removeLayer(routeLineRef.current);
        routeLineRef.current = null;
      }
      if (pickup?.latitude) {
        map.setView([pickup.latitude, pickup.longitude], 15, { animate: true });
      }
    }
  }, [pickup, dropoff]);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
};
