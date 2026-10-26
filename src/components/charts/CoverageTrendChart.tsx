import React from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { HistoricalCoveragePoint, ForecastPoint } from '../../types';

interface CoverageTrendChartProps {
  historical: HistoricalCoveragePoint[];
  forecast?: ForecastPoint[];
  showIntervals?: boolean;
  height?: number;
  title?: string;
  subtitle?: string;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
  payload: {
    year: number;
    historical?: number;
    forecast?: number;
    lower80?: number;
    upper80?: number;
    isForecast?: boolean;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;

  return (
    <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans">
      <div className="flex items-center justify-between gap-4 border-b border-[#eef6f3] pb-1.5 mb-1.5">
        <span className="font-bold text-[#07362f] text-sm">{label}</span>
        {data?.isForecast ? (
          <span className="px-2 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d7a68] font-semibold text-[10px]">
            TFT Forecast
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px]">
            Observed
          </span>
        )}
      </div>

      <div className="space-y-1 text-slate-600">
        {data?.historical !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0d7a68]" />
              Observed Coverage:
            </span>
            <span className="font-bold text-[#07362f]">{data.historical}%</span>
          </div>
        )}

        {data?.forecast !== undefined && (
          <div className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0d7a68]" />
              Forecast (P50):
            </span>
            <span className="font-bold text-[#0d7a68]">{data.forecast}%</span>
          </div>
        )}

        {data?.lower80 !== undefined && data?.upper80 !== undefined && (
          <div className="flex items-center justify-between gap-4 pt-1 border-t border-[#f0f7f4] text-[11px]">
            <span className="text-slate-400">Backtest-Calibrated Interval:</span>
            <span className="font-semibold text-slate-700">
              [{data.lower80}% — {data.upper80}%]
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export const CoverageTrendChart: React.FC<CoverageTrendChartProps> = ({
  historical,
  forecast = [],
  showIntervals = true,
  height = 280,
  title,
  subtitle
}) => {
  const lastHist = historical[historical.length - 1];
  const forecastStartYear = lastHist ? lastHist.year : 2023;

  interface ChartItem {
    year: number;
    historical?: number;
    forecast?: number;
    intervalBand?: [number, number];
    lower80?: number;
    upper80?: number;
    isForecast?: boolean;
  }

  const chartData: ChartItem[] = historical.map(h => ({
    year: h.year,
    historical: h.coverage,
    isForecast: false
  }));

  if (forecast && forecast.length > 0 && lastHist) {
    const lastIndex = chartData.findIndex(d => d.year === lastHist.year);
    if (lastIndex !== -1) {
      chartData[lastIndex].forecast = lastHist.coverage;
      chartData[lastIndex].intervalBand = [lastHist.coverage, lastHist.coverage];
    }

    forecast.forEach(f => {
      chartData.push({
        year: f.year,
        forecast: f.predicted,
        intervalBand: f.lower80 && f.upper80 ? [f.lower80, f.upper80] : undefined,
        lower80: f.lower80,
        upper80: f.upper80,
        isForecast: true
      });
    });
  }

  return (
    <div className="w-full">
      {(title || subtitle) && (
        <div className="mb-3">
          {title && <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">{title}</h4>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastBandLight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5eead4" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#99f6e4" stopOpacity={0.15} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />

            <XAxis 
              dataKey="year" 
              stroke="#94a3b8" 
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2f0ea' }}
              tickLine={false}
            />

            <YAxis 
              domain={[40, 100]} 
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2f0ea' }}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />

            <Tooltip content={<CustomTooltip />} />

            {/* Vertical dashed line at forecast start with 'Forecast starts' label */}
            <ReferenceLine 
              x={forecastStartYear} 
              stroke="#0d7a68" 
              strokeDasharray="3 3" 
              strokeWidth={1.5}
              label={{
                value: 'Forecast starts',
                fill: '#0d7a68',
                fontSize: 11,
                position: 'top',
                offset: 5,
                fontWeight: 600
              }}
            />

            {/* Backtest-calibrated prediction interval band */}
            {showIntervals && (
              <Area
                type="monotone"
                dataKey="intervalBand"
                name="Backtest-calibrated Range"
                fill="url(#forecastBandLight)"
                stroke="none"
                connectNulls={true}
              />
            )}

            {/* Historical solid line */}
            <Line
              type="monotone"
              dataKey="historical"
              stroke="#0d7a68"
              strokeWidth={2.8}
              dot={false}
              activeDot={{ r: 5, fill: '#0d7a68', stroke: '#ffffff', strokeWidth: 2 }}
            />

            {/* Forecast dashed line */}
            {forecast.length > 0 && (
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#0d7a68"
                strokeWidth={2.8}
                strokeDasharray="4 4"
                connectNulls={true}
                dot={false}
                activeDot={{ r: 5, fill: '#0d7a68', stroke: '#ffffff', strokeWidth: 2 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="text-[11px] text-slate-400 mt-2 font-medium">
        History solid, forecast dashed, band shows backtest-calibrated range
      </p>
    </div>
  );
};
