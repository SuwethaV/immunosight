import React from 'react';
import { RiskLevel, TrendDirection } from '../../types';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RiskBadgeProps {
  level: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ 
  level, 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 font-medium',
    md: 'text-xs px-3 py-1 font-semibold',
    lg: 'text-xs px-3.5 py-1.5 font-bold'
  };

  const configs: Record<RiskLevel, { bg: string; text: string; label: string }> = {
    HIGH: {
      bg: 'bg-rose-50 text-rose-600 border border-rose-200',
      text: 'text-rose-600',
      label: 'High Risk',
    },
    MEDIUM: {
      bg: 'bg-amber-50 text-amber-700 border border-amber-200',
      text: 'text-amber-700',
      label: 'Medium Risk',
    },
    LOW: {
      bg: 'bg-[#ccfbf1] text-[#0d7a68] border border-[#99f6e4]',
      text: 'text-[#0d7a68]',
      label: 'Low',
    },
    TARGET_ACHIEVED: {
      bg: 'bg-[#d5f5eb] text-[#0d7a68] border border-[#a3e9d4]',
      text: 'text-[#0d7a68]',
      label: 'Target Met (≥90%)',
    }
  };

  const config = configs[level] || configs.MEDIUM;

  return (
    <span 
      className={`inline-flex items-center justify-center rounded-full ${config.bg} ${sizeClasses[size]} tracking-tight ${className}`}
    >
      {config.label}
    </span>
  );
};

export const TrendBadge: React.FC<{ direction: TrendDirection; changeVal?: number; prefix?: string }> = ({ 
  direction, 
  changeVal,
  prefix = ''
}) => {
  if (direction === 'increasing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-[#ccfbf1] text-[#0d7a68] border border-[#99f6e4]">
        <span>▲</span>
        <span>{prefix || 'Increasing'}</span>
        {changeVal !== undefined && <span className="font-mono text-[11px]">({changeVal > 0 ? `+${changeVal}%` : `${changeVal}%`})</span>}
      </span>
    );
  }
  if (direction === 'decreasing') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-rose-50 text-rose-600 border border-rose-200">
        <span>▼</span>
        <span>{prefix || 'Decreasing'}</span>
        {changeVal !== undefined && <span className="font-mono text-[11px]">({changeVal}%)</span>}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
      <Minus className="w-3 h-3" />
      <span>{prefix || 'Stable'}</span>
      {changeVal !== undefined && <span className="font-mono text-[11px]">({changeVal}%)</span>}
    </span>
  );
};
