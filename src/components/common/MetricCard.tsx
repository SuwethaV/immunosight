import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  trend?: {
    value: number | string;
    label?: string;
    positiveIsGood?: boolean;
    prefix?: string;
  };
  highlightRed?: boolean;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  trend,
  highlightRed = false,
  className = '',
}) => {
  return (
    <div className={`clean-card p-5 clean-card-hover flex flex-col justify-between ${className}`}>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>

        <div className="flex items-baseline gap-2.5 mt-2.5">
          <span 
            className={`text-3xl font-extrabold tracking-tight ${
              highlightRed ? 'text-[#e11d48]' : 'text-[#0a3831]'
            }`}
          >
            {value}
          </span>
          {unit && <span className="text-sm font-semibold text-slate-500">{unit}</span>}

          {trend && (
            <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#0d7a68]">
              <span>▲</span>
              <span>{trend.value}</span>
              {trend.label && <span className="font-normal text-slate-500 ml-1">{trend.label}</span>}
            </span>
          )}

          {badge && <div className="ml-auto">{badge}</div>}
        </div>
      </div>

      {subtitle && (
        <p className="text-xs text-slate-400 font-medium mt-2 pt-2 border-t border-[#eaf4f0]">
          {subtitle}
        </p>
      )}
    </div>
  );
};
