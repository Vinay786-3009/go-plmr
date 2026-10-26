import React from 'react';

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-200/80 my-4">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 shadow-sm border border-emerald-100">
          <Icon className="w-7 h-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-slate-800">{title}</h3>
      {description && <p className="mt-1 text-xs text-slate-500 max-w-xs">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
