import React from 'react';

export const MetricSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-10 h-10 bg-slate-200/80 rounded-xl" />
        <div className="w-16 h-4 bg-slate-200/60 rounded-full" />
      </div>
      <div className="mt-4 space-y-2">
        <div className="w-24 h-7 bg-slate-200 rounded-lg" />
        <div className="w-32 h-3.5 bg-slate-200/60 rounded" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="glass-card overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="w-36 h-5 bg-slate-200 rounded" />
        <div className="w-24 h-8 bg-slate-200 rounded-lg" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex items-center gap-4">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className="h-4 bg-slate-200/70 rounded flex-1"
                style={{ width: `${Math.floor(Math.random() * 40 + 60)}%` }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="glass-card p-6 animate-pulse space-y-4">
      <div className="w-1/3 h-6 bg-slate-200 rounded" />
      <div className="w-full h-24 bg-slate-100 rounded-xl" />
      <div className="w-2/3 h-4 bg-slate-200 rounded" />
    </div>
  );
};
