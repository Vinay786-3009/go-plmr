import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  className = '',
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 text-xs bg-white/90 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 text-slate-800 placeholder:text-slate-400 transition-all shadow-sm"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
