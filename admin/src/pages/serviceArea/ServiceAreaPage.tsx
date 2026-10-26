import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import {
  MapPin,
  Save,
  ShieldCheck,
  AlertTriangle,
  Globe,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  Ban,
} from 'lucide-react';
import { serviceAreaService } from '@/services/serviceAreaService';
import { PALAMANER_COORDINATES } from '@/services/firebase/firebase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { ServiceAreaConfig } from '@/types';
import { formatDateTime } from '@/utils/formatters';
import { Modal } from '@/components/common/Modal';

export const ServiceAreaPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [config, setConfig] = useState<ServiceAreaConfig | null>(null);
  const [radiusKm, setRadiusKm] = useState<number>(PALAMANER_COORDINATES.defaultRadiusKm);
  const [centerLat, setCenterLat] = useState<number>(PALAMANER_COORDINATES.lat);
  const [centerLng, setCenterLng] = useState<number>(PALAMANER_COORDINATES.lng);
  const [stateBorderRestricted, setStateBorderRestricted] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [blockedZones, setBlockedZones] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      points: Array<{ lat: number; lng: number }>;
      lat?: number;
      lng?: number;
      radiusKm?: number;
    }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New Blocked Zone Modal
  const [isAddZoneOpen, setIsAddZoneOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [zoneDescription, setZoneDescription] = useState('');
  const [zoneLat, setZoneLat] = useState<number>(PALAMANER_COORDINATES.lat);
  const [zoneLng, setZoneLng] = useState<number>(PALAMANER_COORDINATES.lng);
  const [zoneRadius, setZoneRadius] = useState<number>(2);

  useEffect(() => {
    const loadConfig = async () => {
      setLoading(true);
      try {
        const data = await serviceAreaService.getServiceAreaConfig();
        setConfig(data);
        setRadiusKm(data.radiusKm || PALAMANER_COORDINATES.defaultRadiusKm);
        setCenterLat(data.centerLat || PALAMANER_COORDINATES.lat);
        setCenterLng(data.centerLng || PALAMANER_COORDINATES.lng);
        setStateBorderRestricted(data.stateBorderRestriction?.enabled ?? true);
        setIsActive(data.isActive ?? true);
        setBlockedZones(data.blockedZones || []);
      } catch (err: any) {
        error('Failed to load service area config', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const updated = await serviceAreaService.saveServiceAreaConfig(
        {
          id: config?.id || 'palamaner-main',
          name: 'Palamaner Urban & Rural Belt',
          centerLat,
          centerLng,
          radiusKm,
          isActive,
          stateBorderRestriction: {
            enabled: stateBorderRestricted,
            state: 'Andhra Pradesh',
          },
          blockedZones,
        },
        {
          uid: user.uid,
          email: user.email || 'admin@goplmr.com',
        }
      );
      setConfig(updated);
      success('Service Area Configuration Saved', `Operational radius updated to ${radiusKm} km.`);
    } catch (err: any) {
      error('Failed to save service area', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;

    const newZone = {
      id: `zone-${Date.now()}`,
      name: zoneName.trim(),
      description: zoneDescription.trim() || undefined,
      points: [{ lat: zoneLat, lng: zoneLng }],
      lat: zoneLat,
      lng: zoneLng,
      radiusKm: zoneRadius,
    };

    setBlockedZones([...blockedZones, newZone]);
    setIsAddZoneOpen(false);
    setZoneName('');
    setZoneDescription('');
    success('Blocked Zone Added', 'Remember to click Save Geofence Configuration to persist changes.');
  };

  const handleRemoveZone = (zoneId: string) => {
    setBlockedZones(blockedZones.filter((z) => z.id !== zoneId));
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Service Area & Geofence Settings
            </h2>
            <span className="badge badge-success">Palamaner, AP</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure reference coordinates, service boundaries, restricted zones, and state boundary rules.
          </p>
        </div>

        {config?.updatedAt && (
          <div className="text-xs text-slate-400">
            Last Updated: <strong className="text-slate-700">{formatDateTime(config.updatedAt)}</strong> by {config.updatedByEmail}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Controls */}
        <div className="glass-panel p-6 space-y-6">
          <div className="pb-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Geofence Parameters</h3>
            <p className="text-xs text-slate-500">Palamaner operational perimeter</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5 text-xs">
            {/* Radius Slider */}
            <div>
              <div className="flex items-center justify-between font-semibold text-slate-700 mb-1.5">
                <span>Operational Radius:</span>
                <strong className="text-emerald-800 text-sm">{radiusKm} km</strong>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Drivers outside this perimeter will not receive automated ride requests.
              </p>
            </div>

            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference Latitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={centerLat}
                  onChange={(e) => setCenterLat(Number(e.target.value))}
                  className="input-field font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reference Longitude
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={centerLng}
                  onChange={(e) => setCenterLng(Number(e.target.value))}
                  className="input-field font-mono text-xs"
                />
              </div>
            </div>

            {/* State Border Rule */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stateBorderRestricted}
                  onChange={(e) => setStateBorderRestricted(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-500 accent-emerald-700"
                />
                <div>
                  <span className="font-bold text-slate-900 block">
                    Enforce Andhra Pradesh State Boundary
                  </span>
                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                    Prevents ride requests that require crossing state lines (e.g. Karnataka / Tamil Nadu borders) without interstate permits.
                  </p>
                </div>
              </label>
            </div>

            {/* Active Switch */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-slate-900 block">Service Area Active</span>
                  <span className="text-[11px] text-slate-500">Enable booking engine in this region</span>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-emerald-700 accent-emerald-700 h-4 w-4"
                />
              </label>
            </div>

            {/* Blocked / Restricted Zones Section */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs">Restricted / Blocked Zones</h4>
                  <p className="text-[10px] text-slate-400">No-pickup zones within perimeter</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddZoneOpen(true)}
                  className="btn-secondary text-[11px] px-2 py-1 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Add Zone</span>
                </button>
              </div>

              {blockedZones.length === 0 ? (
                <p className="text-[11px] text-slate-400 italic">No restricted zones defined.</p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {blockedZones.map((z) => (
                    <div
                      key={z.id}
                      className="p-2 bg-rose-50/50 border border-rose-200 rounded-lg flex items-center justify-between gap-2"
                    >
                      <div>
                        <p className="font-bold text-rose-900 text-[11px] flex items-center gap-1">
                          <Ban className="w-3 h-3 text-rose-600" />
                          {z.name}
                        </p>
                        {z.description && <p className="text-[10px] text-rose-600">{z.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveZone(z.id)}
                        className="p-1 hover:bg-rose-100 rounded text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full py-2.5 text-xs font-semibold flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating Settings...' : 'Save Geofence Configuration'}</span>
            </button>
          </form>
        </div>

        {/* Map Preview */}
        <div className="lg:col-span-2 glass-panel overflow-hidden h-[580px] relative z-0">
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={10}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%', borderRadius: '1rem' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Dynamic Interactive Geofence Circle */}
            <Circle
              center={[centerLat, centerLng]}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: 0.12,
                weight: 2,
              }}
            />

            {/* Blocked / Restricted Zones */}
            {blockedZones.map((zone) => {
              const lat = zone.lat ?? (zone.points && zone.points[0]?.lat) ?? centerLat;
              const lng = zone.lng ?? (zone.points && zone.points[0]?.lng) ?? centerLng;
              const rad = (zone.radiusKm || 2) * 1000;
              return (
                <Circle
                  key={zone.id}
                  center={[lat, lng]}
                  radius={rad}
                  pathOptions={{
                    color: '#e11d48',
                    fillColor: '#f43f5e',
                    fillOpacity: 0.25,
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                >
                  <Popup>
                    <div className="p-1 text-xs">
                      <strong className="text-rose-800 flex items-center gap-1">
                        <Ban className="w-3.5 h-3.5" /> Restricted Zone: {zone.name}
                      </strong>
                      <p className="text-slate-600 mt-1">{zone.description || 'No pickups allowed in this perimeter.'}</p>
                    </div>
                  </Popup>
                </Circle>
              );
            })}

            <Marker position={[centerLat, centerLng]}>
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-slate-900">Palamaner Central Hub</strong>
                  <p className="text-slate-500">Radius: {radiusKm} km</p>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>

      {/* Add Blocked Zone Modal */}
      {isAddZoneOpen && (
        <Modal
          isOpen={isAddZoneOpen}
          onClose={() => setIsAddZoneOpen(false)}
          title="Add Restricted / Blocked Zone"
          subtitle="Configure high-risk or prohibited operational areas in Palamaner"
          maxWidth="md"
        >
          <form onSubmit={handleAddZone} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Zone Name (Required)</label>
              <input
                type="text"
                value={zoneName}
                onChange={(e) => setZoneName(e.target.value)}
                placeholder="e.g. Ghat Section Checkpoint, Forest Reserve Zone"
                required
                className="input-field"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reason / Description</label>
              <textarea
                rows={2}
                value={zoneDescription}
                onChange={(e) => setZoneDescription(e.target.value)}
                placeholder="e.g. Prohibited night travel or steep terrain hazard"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Center Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={zoneLat}
                  onChange={(e) => setZoneLat(Number(e.target.value))}
                  required
                  className="input-field font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Center Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={zoneLng}
                  onChange={(e) => setZoneLng(Number(e.target.value))}
                  required
                  className="input-field font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Restriction Radius: <strong className="text-rose-600">{zoneRadius} km</strong>
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={zoneRadius}
                onChange={(e) => setZoneRadius(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddZoneOpen(false)}
                className="btn-secondary text-xs px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!zoneName.trim()}
                className="btn-primary bg-rose-600 hover:bg-rose-700 text-xs px-4 py-2"
              >
                Add Restricted Zone
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

