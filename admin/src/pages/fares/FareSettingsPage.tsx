import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CircleDollarSign,
  Car,
  Calculator,
  History,
  CheckCircle2,
  Save,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { fareService } from '@/services/fareService';
import { fareConfigSchema, type FareConfigFormData } from '@/validations';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { FareConfiguration, VehicleCategoryType } from '@/types';
import { formatCurrency, formatDateTime, getVehicleCategoryLabel } from '@/utils/formatters';

export const FareSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategoryType>('bike');
  const [allConfigs, setAllConfigs] = useState<FareConfiguration[]>([]);
  const [activeConfig, setActiveConfig] = useState<FareConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Simulator state
  const [simDistance, setSimDistance] = useState<number>(5);
  const [simDuration, setSimDuration] = useState<number>(15);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FareConfigFormData>({
    resolver: zodResolver(fareConfigSchema),
    defaultValues: {
      vehicleCategory: 'bike',
      baseFare: 20,
      minFare: 25,
      perKmRate: 8,
      perMinuteRate: 1,
      bookingFee: 5,
      platformCommissionPercent: 15,
      cancellationFee: 10,
      effectiveDate: new Date().toISOString().slice(0, 10),
    },
  });

  const watchedValues = watch();

  const loadFareData = async () => {
    setLoading(true);
    try {
      const configs = await fareService.getFareConfigurations();
      setAllConfigs(configs);

      const active = configs.find(
        (c) => c.vehicleCategory === selectedCategory && c.isActive
      ) || null;

      setActiveConfig(active);

      if (active) {
        reset({
          vehicleCategory: active.vehicleCategory,
          baseFare: active.baseFare,
          minFare: active.minFare,
          perKmRate: active.perKmRate,
          perMinuteRate: active.perMinuteRate,
          bookingFee: active.bookingFee,
          platformCommissionPercent: active.platformCommissionPercent,
          cancellationFee: active.cancellationFee,
          effectiveDate: active.effectiveDate || new Date().toISOString().slice(0, 10),
        });
      } else {
        // Defaults based on category
        const defaults = {
          bike: { base: 20, min: 25, perKm: 8, perMin: 1, fee: 5, comm: 15, cancel: 10 },
          auto: { base: 30, min: 35, perKm: 12, perMin: 1.5, fee: 8, comm: 15, cancel: 15 },
          cab: { base: 60, min: 80, perKm: 18, perMin: 2, fee: 15, comm: 18, cancel: 30 },
        }[selectedCategory];

        reset({
          vehicleCategory: selectedCategory,
          baseFare: defaults.base,
          minFare: defaults.min,
          perKmRate: defaults.perKm,
          perMinuteRate: defaults.perMin,
          bookingFee: defaults.fee,
          platformCommissionPercent: defaults.comm,
          cancellationFee: defaults.cancel,
          effectiveDate: new Date().toISOString().slice(0, 10),
        });
      }
    } catch (err: any) {
      error('Failed to load fare configs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFareData();
  }, [selectedCategory]);

  const onSubmit = async (data: FareConfigFormData) => {
    if (!user) return;
    setSaving(true);
    try {
      await fareService.saveNewFareConfiguration(data, {
        uid: user.uid,
        email: user.email || 'admin@goplmr.com',
      });
      success(
        'Fare Settings Updated',
        `New pricing version deployed for ${getVehicleCategoryLabel(data.vehicleCategory)}.`
      );
      await loadFareData();
    } catch (err: any) {
      error('Save failed', err.message);
    } finally {
      setSaving(false);
    }
  };

  // Run simulation calculation
  const simulation = fareService.calculateSimulatedFare(
    simDistance,
    simDuration,
    {
      baseFare: Number(watchedValues.baseFare) || 0,
      minFare: Number(watchedValues.minFare) || 0,
      perKmRate: Number(watchedValues.perKmRate) || 0,
      perMinuteRate: Number(watchedValues.perMinuteRate) || 0,
      bookingFee: Number(watchedValues.bookingFee) || 0,
      platformCommissionPercent: Number(watchedValues.platformCommissionPercent) || 0,
    }
  );

  const categoryHistory = allConfigs.filter((c) => c.vehicleCategory === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Vehicle Category & Fare Configuration
          </h2>
          <p className="text-xs text-slate-500">
            Define base rates, per-km charges, commission cuts, and preview simulated ride calculations.
          </p>
        </div>

        {/* Vehicle Category Tabs */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl p-1 text-xs">
          {(['bike', 'auto', 'cab'] as VehicleCategoryType[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-bold capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fare Settings Form */}
        <div className="lg:col-span-2 glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Fare Rules: {getVehicleCategoryLabel(selectedCategory)}
              </h3>
              <p className="text-xs text-slate-500">
                {activeConfig ? `Active Version: v${activeConfig.version}` : 'Creating Initial Pricing Version'}
              </p>
            </div>
            {activeConfig && (
              <span className="badge badge-success text-xs">
                Active in Palamaner
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Fare (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('baseFare', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.baseFare && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.baseFare.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Fare (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('minFare', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.minFare && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.minFare.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Per-Kilometre Rate (₹ / km)
                </label>
                <input
                  type="number"
                  step="0.5"
                  {...register('perKmRate', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.perKmRate && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.perKmRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Per-Minute Rate (₹ / min)
                </label>
                <input
                  type="number"
                  step="0.5"
                  {...register('perMinuteRate', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.perMinuteRate && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.perMinuteRate.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Platform Booking Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('bookingFee', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.bookingFee && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.bookingFee.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Platform Commission (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  {...register('platformCommissionPercent', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.platformCommissionPercent && (
                  <p className="text-[11px] text-rose-600 mt-1">
                    {errors.platformCommissionPercent.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Cancellation Fee (₹)
                </label>
                <input
                  type="number"
                  step="1"
                  {...register('cancellationFee', { valueAsNumber: true })}
                  className="input-field"
                />
                {errors.cancellationFee && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.cancellationFee.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  {...register('effectiveDate')}
                  className="input-field"
                />
                {errors.effectiveDate && (
                  <p className="text-[11px] text-rose-600 mt-1">{errors.effectiveDate.message}</p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Authoritative calculations run on Firebase Cloud Functions.
              </span>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Publishing New Version...' : 'Deploy Fare Configuration'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Real-time Fare Calculator / Simulator */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calculator className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-slate-900">Fare Simulator Preview</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Trip Distance</span>
                <strong className="text-emerald-800">{simDistance} km</strong>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={simDistance}
                onChange={(e) => setSimDistance(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>

            <div>
              <div className="flex justify-between font-semibold text-slate-700 mb-1">
                <span>Estimated Duration</span>
                <strong className="text-emerald-800">{simDuration} mins</strong>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                value={simDuration}
                onChange={(e) => setSimDuration(Number(e.target.value))}
                className="w-full accent-emerald-700"
              />
            </div>
          </div>

          {/* Breakdown Box */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Base Fare:</span>
              <span>{formatCurrency(simulation.baseFare)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Distance Fare ({simDistance} km):</span>
              <span>{formatCurrency(simulation.distanceFare)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Time Fare ({simDuration} min):</span>
              <span>{formatCurrency(simulation.timeFare)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Booking Fee:</span>
              <span>{formatCurrency(simulation.bookingFee)}</span>
            </div>

            <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-slate-900 text-sm">
              <span>Customer Estimated Total:</span>
              <span className="text-emerald-950">{formatCurrency(simulation.totalFare)}</span>
            </div>

            <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Commission ({watchedValues.platformCommissionPercent || 0}%):</span>
                <strong className="text-emerald-700">{formatCurrency(simulation.platformCommission)}</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Driver Payout:</span>
                <strong className="text-slate-800">{formatCurrency(simulation.driverEarnings)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Version History Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            Fare Version History ({getVehicleCategoryLabel(selectedCategory)})
          </h3>
        </div>

        {categoryHistory.length === 0 ? (
          <p className="text-xs text-slate-400">No previous fare versions recorded.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Version</th>
                  <th className="px-3 py-2.5">Base / Min</th>
                  <th className="px-3 py-2.5">Per Km / Min</th>
                  <th className="px-3 py-2.5">Commission</th>
                  <th className="px-3 py-2.5">Effective Date</th>
                  <th className="px-3 py-2.5">Updated By</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categoryHistory.map((ver) => (
                  <tr key={ver.id} className="hover:bg-slate-50/50">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">v{ver.version}</td>
                    <td className="px-3 py-2.5">₹{ver.baseFare} / ₹{ver.minFare}</td>
                    <td className="px-3 py-2.5">₹{ver.perKmRate}/km • ₹{ver.perMinuteRate}/min</td>
                    <td className="px-3 py-2.5 font-semibold text-emerald-800">{ver.platformCommissionPercent}%</td>
                    <td className="px-3 py-2.5 text-slate-500">{ver.effectiveDate}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-[11px] truncate max-w-[150px]">
                      {ver.updatedByEmail}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`badge ${ver.isActive ? 'badge-success' : 'badge-neutral'}`}>
                        {ver.isActive ? 'Active' : 'Archived'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
