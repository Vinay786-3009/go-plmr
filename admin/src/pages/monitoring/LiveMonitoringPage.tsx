import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  Compass,
  Radio,
  Car,
  AlertTriangle,
  RefreshCw,
  Info,
  Clock,
  Navigation,
  ExternalLink,
  MapPin,
  Route,
  User,
} from 'lucide-react';
import { PALAMANER_COORDINATES } from '@/services/firebase/firebase';
import { rtdbLocationService } from '@/services/rtdbLocationService';
import { rideService } from '@/services/rideService';
import type { DriverLocationRTDB, RideRecord } from '@/types';
import { formatDateTime, formatCurrency, getVehicleCategoryLabel, getRideStatusBadge } from '@/utils/formatters';
import { ServiceNotice } from '@/components/common/ServiceNotice';

// Custom Map Marker Icons using SVG
const createDriverIcon = (category: string, status: string) => {
  const isOnline = status === 'available' || status === 'on_trip';
  const color = status === 'on_trip' ? '#059669' : isOnline ? '#10b981' : '#94a3b8';

  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
        border: 2px solid white;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 11 2 11.5 2 12v4c0 .6.4 1 1 1h2"/>
          <circle cx="7" cy="17" r="2"/>
          <path d="M9 17h6"/>
          <circle cx="17" cy="17" r="2"/>
        </svg>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

export const LiveMonitoringPage: React.FC = () => {
  const [driverLocations, setDriverLocations] = useState<DriverLocationRTDB[]>([]);
  const [activeRides, setActiveRides] = useState<RideRecord[]>([]);
  const [rtdbError, setRtdbError] = useState<string | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocationRTDB | null>(null);
  const [selectedRide, setSelectedRide] = useState<RideRecord | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'on_trip'>('all');
  const [sidebarTab, setSidebarTab] = useState<'drivers' | 'rides'>('drivers');

  // Subscribe to RTDB Driver Locations
  useEffect(() => {
    const unsub = rtdbLocationService.subscribeDriverLocations(
      (locations) => {
        setDriverLocations(locations);
        setRtdbError(null);
      },
      (err) => {
        setRtdbError(err.message || 'Realtime Database is not yet configured or reachable.');
      }
    );
    return () => unsub();
  }, []);

  // Fetch active rides from Firestore
  useEffect(() => {
    const unsubRides = rideService.subscribeRides(
      { status: 'all' },
      (rides) => {
        const live = rides.filter((r) =>
          ['requested', 'searching', 'driver_assigned', 'driver_arriving', 'ride_started'].includes(r.status)
        );
        setActiveRides(live);
      },
      () => {}
    );
    return () => unsubRides();
  }, []);

  const filteredLocations = driverLocations.filter((loc) => {
    if (filterStatus === 'all') return true;
    return loc.status === filterStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Live GPS Fleet & Trip Monitoring
            </h2>
            <span className="badge badge-success flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Palamaner Region</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time coordinates streamed from Firebase Realtime Database and live active trips from Firestore.
          </p>
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'all'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Drivers ({driverLocations.length})
            </button>
            <button
              onClick={() => setFilterStatus('available')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'available'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Available ({driverLocations.filter((d) => d.status === 'available').length})
            </button>
            <button
              onClick={() => setFilterStatus('on_trip')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterStatus === 'on_trip'
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              On Trip ({driverLocations.filter((d) => d.status === 'on_trip').length})
            </button>
          </div>
        </div>
      </div>

      {/* RTDB Unconfigured or Error Notice */}
      {rtdbError && (
        <ServiceNotice
          type="setup"
          title="Firebase Realtime Database Configuration Required for Live GPS"
          description="Live driver location tracking streams from Firebase Realtime Database at path 'driverLocations/{driverUid}'. Complete these steps in the Firebase Console:"
          steps={[
            "1. Open the Firebase Console for project 'go-plmr'.",
            "2. Navigate to 'Build' → 'Realtime Database' and click 'Create Database'.",
            "3. Select a region (e.g. us-central1 or asia-southeast1).",
            "4. Deploy the Realtime Database Security Rules from 'database.rules.json'.",
            "5. Copy your database URL and paste it into '.env' as: VITE_FIREBASE_DATABASE_URL=https://go-plmr-default-rtdb.firebaseio.com",
          ]}
          linkUrl="https://console.firebase.google.com/project/go-plmr/database"
          linkLabel="Open Realtime Database Console"
        />
      )}

      {/* Live Map & Active Fleet Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Leaflet Map Canvas */}
        <div className="lg:col-span-3 glass-panel overflow-hidden h-[560px] relative z-0">
          <MapContainer
            center={[PALAMANER_COORDINATES.lat, PALAMANER_COORDINATES.lng]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Palamaner Operational Geofence Circle */}
            <Circle
              center={[PALAMANER_COORDINATES.lat, PALAMANER_COORDINATES.lng]}
              radius={PALAMANER_COORDINATES.defaultRadiusKm * 1000}
              pathOptions={{
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: 0.04,
                weight: 1.5,
                dashArray: '4, 8',
              }}
            />

            {/* Real Driver Location Markers */}
            {filteredLocations.map((driver) => (
              <Marker
                key={driver.driverId}
                position={[driver.latitude, driver.longitude]}
                icon={createDriverIcon(driver.vehicleCategory, driver.status)}
                eventHandlers={{
                  click: () => {
                    setSelectedDriver(driver);
                    setSidebarTab('drivers');
                  },
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold text-slate-900">{driver.driverName || 'Driver'}</p>
                    <p className="text-slate-500 capitalize">{getVehicleCategoryLabel(driver.vehicleCategory)}</p>
                    <div className="mt-1 flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{driver.status.toUpperCase()}</span>
                    </div>
                    {driver.speed !== undefined && (
                      <p className="text-[10px] text-slate-400 mt-1">Speed: {Math.round(driver.speed)} km/h</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Live Active Drivers / Rides Drawer */}
        <div className="glass-panel p-5 flex flex-col justify-between h-[560px] overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-200 pb-2 mb-3 gap-3 text-xs">
              <button
                onClick={() => setSidebarTab('drivers')}
                className={`font-bold transition-all pb-1 border-b-2 flex items-center gap-1.5 ${
                  sidebarTab === 'drivers'
                    ? 'text-emerald-800 border-emerald-600'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>Drivers ({filteredLocations.length})</span>
              </button>
              <button
                onClick={() => setSidebarTab('rides')}
                className={`font-bold transition-all pb-1 border-b-2 flex items-center gap-1.5 ${
                  sidebarTab === 'rides'
                    ? 'text-emerald-800 border-emerald-600'
                    : 'text-slate-500 border-transparent hover:text-slate-800'
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span>Active Trips ({activeRides.length})</span>
              </button>
            </div>

            {/* Drivers Tab Content */}
            {sidebarTab === 'drivers' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {filteredLocations.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <Car className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No Live Drivers Online</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      When drivers go online via Go Plmr Driver App, their coordinates will render here.
                    </p>
                  </div>
                ) : (
                  filteredLocations.map((driver) => (
                    <div
                      key={driver.driverId}
                      onClick={() => setSelectedDriver(driver)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        selectedDriver?.driverId === driver.driverId
                          ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                          : 'bg-white border-slate-200/80 hover:border-emerald-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900 truncate">{driver.driverName}</strong>
                        <span
                          className={`badge ${
                            driver.status === 'on_trip'
                              ? 'badge-success'
                              : driver.status === 'available'
                              ? 'badge-info'
                              : 'badge-neutral'
                          } text-[10px]`}
                        >
                          {driver.status}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                        <span>{getVehicleCategoryLabel(driver.vehicleCategory)}</span>
                        <span className="text-[10px]">
                          {driver.lastUpdated ? `${Math.max(0, Math.round((Date.now() - driver.lastUpdated) / 1000))}s ago` : 'now'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* In-Flight Active Trips Tab Content */}
            {sidebarTab === 'rides' && (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {activeRides.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <Route className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-600">No In-Flight Trips</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Live rides in progress will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  activeRides.map((ride) => {
                    const badge = getRideStatusBadge(ride.status);
                    return (
                      <div
                        key={ride.id}
                        onClick={() => setSelectedRide(ride)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                          selectedRide?.id === ride.id
                            ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                            : 'bg-white border-slate-200/80 hover:border-emerald-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <strong className="text-slate-900 truncate">{ride.customerName || 'Customer'}</strong>
                          <span className={`badge ${badge.className} text-[10px]`}>{badge.text}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-1 truncate">
                          To: {ride.dropoff?.address || 'Palamaner destination'}
                        </p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>Driver: {ride.driverName || 'Assigning...'}</span>
                          <span className="font-bold text-slate-700">{formatCurrency(ride.fare?.totalFare || 0)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Active Status Footer */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/60 rounded-xl text-xs flex items-center justify-between mt-3">
            <span className="text-emerald-900 font-semibold">Active In-Flight Rides:</span>
            <strong className="text-emerald-800 text-sm">{activeRides.length}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

