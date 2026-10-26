import React from 'react';
import { AlertCircle, Info, ExternalLink, ShieldCheck } from 'lucide-react';

interface ServiceNoticeProps {
  type?: 'warning' | 'info' | 'setup';
  title: string;
  description: string;
  steps?: string[];
  linkUrl?: string;
  linkLabel?: string;
  className?: string;
}

export const ServiceNotice: React.FC<ServiceNoticeProps> = ({
  type = 'info',
  title,
  description,
  steps,
  linkUrl,
  linkLabel = 'Firebase Console',
  className = '',
}) => {
  return (
    <div
      className={`p-4 rounded-xl border backdrop-blur-sm ${
        type === 'warning'
          ? 'bg-amber-50/90 border-amber-200 text-amber-900'
          : type === 'setup'
          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
          : 'bg-sky-50/90 border-sky-200 text-sky-950'
      } ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 mt-0.5">
          {type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-600" />}
          {type === 'setup' && <ShieldCheck className="w-5 h-5 text-emerald-600" />}
          {type === 'info' && <Info className="w-5 h-5 text-sky-600" />}
        </div>
        <div className="flex-1 text-xs">
          <h4 className="font-semibold text-sm tracking-tight">{title}</h4>
          <p className="mt-1 leading-relaxed opacity-90">{description}</p>

          {steps && steps.length > 0 && (
            <ol className="list-decimal list-inside mt-2 space-y-1 bg-white/60 p-2.5 rounded-lg border border-black/5 font-mono text-[11px]">
              {steps.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          )}

          {linkUrl && (
            <div className="mt-3">
              <a
                href={linkUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-semibold text-xs underline hover:opacity-80 transition-opacity"
              >
                <span>{linkLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
