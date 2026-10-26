import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { placesService } from '../../services/placesService';
import { geocodingService } from '../../services/geocodingService';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import {
  Bookmark,
  Home,
  Briefcase,
  MapPin,
  Plus,
  Trash2,
  X,
  Search,
  ArrowRight,
  Loader2,
} from 'lucide-react';

export const SavedPlacesPage = () => {
  const { user } = useAuth();
  const { success, error, warning } = useToast();
  const navigate = useNavigate();

  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Place Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [label, setLabel] = useState('');
  const [type, setType] = useState('home'); // 'home' | 'work' | 'other'
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);

  // Delete Place Modal States
  const [placeToDelete, setPlaceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPlaces = async () => {
    if (!user) return;
    try {
      const data = await placesService.getSavedPlaces(user.uid);
      setPlaces(data);
    } catch (e) {
      console.warn('Error loading saved places:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, [user]);

  // Search locations when adding
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setAddressSearch(val);
    setSelectedLocation(null);

    if (val.trim().length >= 2) {
      setSearching(true);
      const results = await geocodingService.searchLocations(val);
      setSuggestions(results);
      setSearching(false);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (loc) => {
    setSelectedLocation(loc);
    setAddressSearch(loc.address);
    setSuggestions([]);
  };

  const handleSavePlace = async (e) => {
    e.preventDefault();
    if (!label.trim()) {
      warning('Please provide a name/label for this place.');
      return;
    }
    if (!selectedLocation && !addressSearch.trim()) {
      warning('Please choose or enter a valid location in Palamaner.');
      return;
    }

    setSaving(true);
    try {
      const placeData = {
        label: label.trim(),
        type,
        address: selectedLocation ? selectedLocation.address : addressSearch.trim(),
        latitude: selectedLocation ? selectedLocation.latitude : 13.2000,
        longitude: selectedLocation ? selectedLocation.longitude : 78.7500,
      };

      const updated = await placesService.addSavedPlace(user.uid, placeData);
      setPlaces(updated);
      success('Place saved successfully!');
      setShowAddModal(false);
      // Reset form
      setLabel('');
      setType('home');
      setAddressSearch('');
      setSelectedLocation(null);
    } catch (err) {
      console.error('Failed to save place:', err);
      error('Could not save place. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!placeToDelete) return;
    setDeleting(true);
    try {
      const updated = await placesService.deleteSavedPlace(user.uid, placeToDelete.id);
      setPlaces(updated);
      success('Saved place removed.');
      setPlaceToDelete(null);
    } catch (err) {
      console.error('Failed to remove place:', err);
      error('Could not remove place.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading your saved places..." />;
  }

  return (
    <div className="flex flex-col px-4 py-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Saved Places</h2>
          <p className="text-xs text-slate-500">Quick shortcuts for home, work, and favorites</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Add Place</span>
        </button>
      </div>

      {/* Places List */}
      {places.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No Saved Places"
          description="Save your home, work, or favorite spots in Palamaner for faster 1-tap booking."
          actionLabel="Save Your First Place"
          onAction={() => setShowAddModal(true)}
        />
      ) : (
        <div className="flex flex-col gap-2.5">
          {places.map((place) => (
            <div
              key={place.id}
              className="glass-card p-4 rounded-3xl border border-slate-200/90 shadow-sm flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 flex-shrink-0">
                  {place.type === 'home' ? (
                    <Home className="w-5 h-5" />
                  ) : place.type === 'work' ? (
                    <Briefcase className="w-5 h-5" />
                  ) : (
                    <Bookmark className="w-5 h-5" />
                  )}
                </div>

                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-900">{place.label}</span>
                  <span className="text-xs text-slate-500 line-clamp-1">{place.address}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPlaceToDelete(place)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  title="Remove Place"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Place Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Add New Place</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePlace} className="flex flex-col gap-4 mt-4">
              {/* Type Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                  Place Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'home', label: 'Home', icon: Home },
                    { id: 'work', label: 'Work', icon: Briefcase },
                    { id: 'other', label: 'Other', icon: Bookmark },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setType(t.id);
                        if (!label || label === 'Home' || label === 'Work') {
                          setLabel(t.label);
                        }
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        type === t.id
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <t.icon className="w-4 h-4" />
                      <span>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Place Name / Label */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Place Name
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. My Apartment, Gym, Parents"
                  className="input-field"
                />
              </div>

              {/* Address Search with Suggestions */}
              <div className="relative">
                <label className="text-xs font-bold text-slate-700 block mb-1 uppercase tracking-wider">
                  Address in Palamaner
                </label>
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
                  <input
                    type="text"
                    required
                    value={addressSearch}
                    onChange={handleSearchChange}
                    placeholder="Search landmark or road in Palamaner..."
                    className="input-field pl-10"
                  />
                  {searching && (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3.5" />
                  )}
                </div>

                {/* Suggestions List */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 max-h-48 overflow-y-auto">
                    {suggestions.map((loc, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectSuggestion(loc)}
                        className="flex items-start gap-2 p-2 rounded-xl hover:bg-emerald-50 w-full text-left"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{loc.name}</span>
                          <span className="text-[11px] text-slate-500 line-clamp-1">{loc.address}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 shadow-md"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Location...</span>
                  </>
                ) : (
                  <span>Save Place</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(placeToDelete)}
        title="Remove Saved Place?"
        message={`Are you sure you want to delete "${placeToDelete?.label}" from your saved places?`}
        confirmText="Yes, Delete"
        cancelText="Cancel"
        confirmVariant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPlaceToDelete(null)}
      />
    </div>
  );
};
