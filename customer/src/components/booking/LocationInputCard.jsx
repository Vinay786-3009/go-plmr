import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Navigation,
  Search,
  X,
  Bookmark,
  Home,
  Briefcase,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { geocodingService, PALAMANER_LANDMARKS } from '../../services/geocodingService';

export const LocationInputCard = ({
  pickup,
  dropoff,
  onPickupChange,
  onDropoffChange,
  savedPlaces = [],
  onRequestGps,
  gpsLoading = false,
}) => {
  const [activeField, setActiveField] = useState(null); // 'pickup' | 'dropoff' | null
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Debounced search when user types
  useEffect(() => {
    if (!activeField || !query || query.trim().length < 2) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await geocodingService.searchLocations(query);
      setSuggestions(results);
      setLoadingSuggestions(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, activeField]);

  const handleSelectLocation = (loc) => {
    if (activeField === 'pickup') {
      onPickupChange(loc);
    } else if (activeField === 'dropoff') {
      onDropoffChange(loc);
    }
    setActiveField(null);
    setQuery('');
    setSuggestions([]);
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/90 relative z-20">
      {/* Search Inputs Container */}
      <div className="flex flex-col gap-2 relative">
        {/* Pickup Input Row */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
          <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>

          <input
            type="text"
            placeholder="Pickup location in Palamaner..."
            value={activeField === 'pickup' ? query : pickup?.address || ''}
            onFocus={() => {
              setActiveField('pickup');
              setQuery(pickup?.address || '');
            }}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />

          {pickup?.address && activeField !== 'pickup' && (
            <button
              onClick={() => onPickupChange(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Current GPS button */}
          <button
            type="button"
            onClick={onRequestGps}
            disabled={gpsLoading}
            title="Use current GPS location"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 text-[11px] font-bold flex-shrink-0 transition-colors"
          >
            {gpsLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Navigation className="w-3 h-3 text-emerald-700" />
            )}
            <span className="hidden sm:inline">GPS</span>
          </button>
        </div>

        {/* Dropoff Input Row */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 focus-within:border-emerald-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
          <div className="w-4 h-4 rounded-full bg-rose-600 flex items-center justify-center flex-shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
          </div>

          <input
            type="text"
            placeholder="Where to? (Destination in Palamaner)"
            value={activeField === 'dropoff' ? query : dropoff?.address || ''}
            onFocus={() => {
              setActiveField('dropoff');
              setQuery(dropoff?.address || '');
            }}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />

          {dropoff?.address && activeField !== 'dropoff' && (
            <button
              onClick={() => onDropoffChange(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="p-1 text-slate-400">
            <Search className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Suggestions Overlay when an input is actively focused */}
        {activeField && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2 z-50 max-h-64 overflow-y-auto animate-in fade-in">
            <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-400 border-b border-slate-100">
              <span>{activeField === 'pickup' ? 'SELECT PICKUP' : 'SELECT DESTINATION'}</span>
              <button
                onClick={() => {
                  setActiveField(null);
                  setQuery('');
                }}
                className="text-slate-400 hover:text-slate-600 font-normal"
              >
                Close
              </button>
            </div>

            {loadingSuggestions && (
              <div className="flex items-center justify-center p-4 text-xs text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>Searching Palamaner locations...</span>
              </div>
            )}

            {!loadingSuggestions && suggestions.length > 0 && (
              <div className="flex flex-col gap-1 mt-1">
                {suggestions.map((loc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectLocation(loc)}
                    className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-emerald-50 text-left transition-colors"
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

            {!loadingSuggestions && suggestions.length === 0 && (
              <div className="p-2">
                <p className="text-[11px] text-slate-400 mb-2 font-medium">Popular in Palamaner:</p>
                <div className="flex flex-col gap-1">
                  {PALAMANER_LANDMARKS.slice(0, 4).map((lm, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectLocation(lm)}
                      className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-emerald-50 text-left transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs font-medium text-slate-700">{lm.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Location Shortcuts (Saved Places & Landmarks) */}
      {!activeField && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {savedPlaces.map((place) => (
            <button
              key={place.id}
              onClick={() => {
                if (!dropoff) onDropoffChange(place);
                else onPickupChange(place);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 text-xs font-semibold flex-shrink-0 border border-slate-200 transition-colors"
            >
              {place.type === 'home' ? (
                <Home className="w-3 h-3 text-emerald-600" />
              ) : place.type === 'work' ? (
                <Briefcase className="w-3 h-3 text-sky-600" />
              ) : (
                <Bookmark className="w-3 h-3 text-amber-600" />
              )}
              <span>{place.label}</span>
            </button>
          ))}

          {/* Preset Landmark pills */}
          <button
            onClick={() => {
              const busStand = PALAMANER_LANDMARKS[0];
              if (!dropoff) onDropoffChange(busStand);
              else onPickupChange(busStand);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex-shrink-0 border border-emerald-200/60 transition-colors"
          >
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>RTC Bus Stand</span>
          </button>

          <button
            onClick={() => {
              const hospital = PALAMANER_LANDMARKS[2];
              if (!dropoff) onDropoffChange(hospital);
              else onPickupChange(hospital);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 text-xs font-semibold flex-shrink-0 border border-slate-200 transition-colors"
          >
            <MapPin className="w-3 h-3 text-emerald-600" />
            <span>Govt Hospital</span>
          </button>
        </div>
      )}
    </div>
  );
};
