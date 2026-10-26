import React from 'react';
import { LucideIcon, HelpCircle } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  instruction?: string;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = HelpCircle,
  title,
  description,
  actionText,
  onAction,
  instruction,
  className = '',
}) => {
  return (
    <div className={`glass-card p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 ring-8 ring-emerald-50/50">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-slate-800 tracking-tight">{title}</h3>
      <p className="text-sm text-slate-500 mt-2 max-w-sm leading-relaxed">{description}</p>
      
      {instruction && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-xs text-slate-600 text-left w-full flex items-start gap-2">
          <span className="font-semibold text-emerald-700 shrink-0">Note:</span>
          <span>{instruction}</span>
        </div>
      )}

      {actionText && onAction && (
        <button onClick={onAction} className="btn-primary mt-6 text-xs px-4 py-2">
          {actionText}
        </button>
      )}
    </div>
  );
};
