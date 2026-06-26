import React from 'react';
import { SLAStatus } from '@/lib/types';

interface SLABadgeProps {
  status: SLAStatus;
  size?: 'sm' | 'md' | 'lg';
}

export function SLABadge({ status, size = 'md' }: SLABadgeProps) {
  const statusConfig = {
    ok: { emoji: '🟢', label: 'OK', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    warning: { emoji: '🟡', label: 'Warning', bgColor: 'bg-yellow-100', textColor: 'text-yellow-700' },
    critical: { emoji: '🔴', label: 'Critical', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    overdue: { emoji: '⚫', label: 'Overdue', bgColor: 'bg-slate-200', textColor: 'text-slate-700' },
  };

  const config = statusConfig[status];

  const sizeClass = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${config.bgColor} ${config.textColor} font-semibold ${sizeClass}`}>
      <span>{config.emoji}</span>
      <span>{config.label}</span>
    </span>
  );
}
