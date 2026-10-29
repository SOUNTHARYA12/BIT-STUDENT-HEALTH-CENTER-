import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const normalized = status.toLowerCase();

  let styles = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['completed', 'active', 'dispensed'].includes(normalized)) {
    styles = 'bg-emerald-50 text-emerald-800 border-emerald-200';
  } else if (['in_consultation', 'in_progress', 'near_expiry'].includes(normalized)) {
    styles = 'bg-amber-50 text-amber-800 border-amber-200';
  } else if (['booked', 'issued', 'scheduled'].includes(normalized)) {
    styles = 'bg-sky-50 text-sky-800 border-sky-200';
  } else if (['checked_in'].includes(normalized)) {
    styles = 'bg-indigo-50 text-indigo-800 border-indigo-200';
  } else if (['cancelled', 'no_show', 'expired', 'suspended'].includes(normalized)) {
    styles = 'bg-rose-50 text-rose-800 border-rose-200';
  }

  const formatLabel = (txt: string) => {
    return txt.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border ${sizeClasses} ${styles}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {formatLabel(status)}
    </span>
  );
};
