import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PALAMANER_CONFIG } from '../firebase/config';
import { Navigation, Compass } from 'lucide-react';

// Fix Leaflet marker icons in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom SVG Icons
const driverIcon = new L.DivIcon({
  className: 'driver-marker',
  html: `
    <div style="background-color: #f59e0b; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #0f172a; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
        <circle cx="7" cy="17" r="2"/>
        <circle cx="17" cy="17" r="2"/>
      </svg>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

const pickupIcon = new L.DivIcon({
  className: 'pickup-marker',
  html: `
    <div style="background-color: #10b981; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
      <span style="color: #ffffff; font-weight: 900; font-size: 13px;">P</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const dropoffIcon = new L.DivIcon({
  className: 'dropoff-marker',
  html: `
    <div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">
      <span style="color: #ffffff; font-weight: 900; font-size: 13px;">D</span>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

// Component to handle auto-panning / bounds fitting
function MapAutoBounds({ driverPos, pickupPos, dropoffPos }) {
  const map = useMap();

  useEffect(() => {
    const points = [];
    if (driverPos?.lat && driverPos?.lng) points.push([driverPos.lat, driverPos.lng]);
    if (pickupPos?.latitude && pickupPos?.longitude) points.push([pickupPos.latitude, pickupPos.longitude]);
    if (dropoffPos?.latitude && dropoffPos?.longitude) points.push([dropoffPos.latitude, dropoffPos.longitude]);

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    } else if (points.length === 1) {
      map.panTo(points[0], { animate: true });
    }
  }, [driverPos, pickupPos, dropoffPos, map]);

  return null;
}

export const LiveMap = ({ driverLocation, activeRide, className = "h-64 sm:h-80" }) => {
  const defaultPos = driverLocation?.lat ? driverLocation : PALAMANER_CONFIG.center;
  const pickup = activeRide?.pickup;
  const dropoff = activeRide?.dropoff;

  // Determine destination coordinates for Google Maps handoff
  const nextTarget = activeRide?.status === 'driver_assigned' || activeRide?.status === 'driver_arriving'
    ? pickup
    : dropoff;

  const googleMapsUrl = nextTarget?.latitude && nextTarget?.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${nextTarget.latitude},${nextTarget.longitude}&travelmode=driving`
    : null;

  // Polyline coordinates if active ride
  const routePoints = [];
  if (driverLocation?.lat && driverLocation?.lng) {
    routePoints.push([driverLocation.lat, driverLocation.lng]);
  }
  if (pickup?.latitude && pickup?.longitude) {
    routePoints.push([pickup.latitude, pickup.longitude]);
  }
  if (dropoff?.latitude && dropoff?.longitude) {
    routePoints.push([dropoff.latitude, dropoff.longitude]);
  }

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-charcoal-700/80 shadow-inner ${className}`}>
      <MapContainer
        center={[defaultPos.lat, defaultPos.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Driver Live Marker */}
        {driverLocation?.lat && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs">
                <strong>You (Driver)</strong>
                <br />Live GPS Location
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pickup Marker */}
        {pickup?.latitude && (
          <Marker position={[pickup.latitude, pickup.longitude]} icon={pickupIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-emerald-700">Pickup Location:</strong>
                <br />{pickup.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoff?.latitude && (
          <Marker position={[dropoff.latitude, dropoff.longitude]} icon={dropoffIcon}>
            <Popup>
              <div className="text-xs">
                <strong className="text-rose-700">Destination:</strong>
                <br />{dropoff.address}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Line */}
        {routePoints.length >= 2 && (
          <Polyline
            positions={routePoints}
            color="#f59e0b"
            weight={4}
            dashArray="6, 8"
          />
        )}

        <MapAutoBounds
          driverPos={driverLocation}
          pickupPos={pickup}
          dropoffPos={dropoff}
        />
      </MapContainer>

      {/* Navigation Handoff Overlay Button */}
      {googleMapsUrl && (
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 z-[400] flex items-center gap-1.5 px-3 py-2 rounded-xl bg-charcoal-900/90 hover:bg-charcoal-900 text-brand-400 font-bold text-xs border border-charcoal-700 shadow-xl backdrop-blur-md transition-all active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Open Google Maps</span>
        </a>
      )}

      {/* Map watermark / badge */}
      <div className="absolute top-3 left-3 z-[400] px-2.5 py-1 rounded-lg bg-charcoal-900/80 backdrop-blur-md text-[10px] font-bold text-charcoal-300 border border-charcoal-700/80">
        Palamaner Live Map
      </div>
    </div>
  );
};
