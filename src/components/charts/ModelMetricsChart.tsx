import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { ModelMetric } from '../../types';

interface ModelMetricsChartProps {
  metrics: ModelMetric[];
  height?: number;
}

type MetricKey = 'rmse' | 'mae' | 'mape' | 'smape' | 'r2' | 'accuracy' | 'within5pp';

export const ModelMetricsChart: React.FC<ModelMetricsChartProps> = ({ metrics, height = 320 }) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('rmse');

  const metricConfigs: Record<MetricKey, { label: string; unit: string; description: string; lowerIsBetter: boolean }> = {
    rmse: {
      label: 'Root Mean Squared Error (RMSE)',
      unit: '% pts',
      description: 'Penalizes outlier forecast deviations. Lower is better.',
      lowerIsBetter: true
    },
    mae: {
      label: 'Mean Absolute Error (MAE)',
      unit: '% pts',
      description: 'Average magnitude of errors. Lower is better.',
      lowerIsBetter: true
    },
    mape: {
      label: 'Mean Absolute Percentage Error (MAPE)',
      unit: '%',
      description: 'Relative percentage error across test series. Lower is better.',
      lowerIsBetter: true
    },
    smape: {
      label: 'Symmetric MAPE (SMAPE)',
      unit: '%',
      description: 'Bounded symmetric relative percentage error. Lower is better.',
      lowerIsBetter: true
    },
    r2: {
      label: 'Coefficient of Determination (R²)',
      unit: '',
      description: 'Proportion of coverage variance explained. Closer to 1.0 is better.',
      lowerIsBetter: false
    },
    accuracy: {
      label: 'Overall Accuracy',
      unit: '%',
      description: 'Model predictive accuracy across evaluation sets. Closer to 100% is better.',
      lowerIsBetter: false
    },
    within5pp: {
      label: 'Within ±5 percentage points',
      unit: '%',
      description: 'Percentage of test points predicted within ±5 percentage points. Higher is better.',
      lowerIsBetter: false
    }
  };

  const availableKeys = (Object.keys(metricConfigs) as MetricKey[]).filter(k => {
    if (k === 'accuracy') return metrics.some(m => m.accuracy !== undefined);
    if (k === 'within5pp') return metrics.some(m => m.within5pp !== undefined);
    return true;
  });

  const currentConfig = metricConfigs[selectedMetric] || metricConfigs.rmse;

  const values = metrics.map(m => m[selectedMetric]).filter(v => typeof v === 'number');
  const bestValue = currentConfig.lowerIsBetter ? Math.min(...values) : Math.max(...values);

  const chartData = metrics.map(m => ({
    name: m.modelName,
    shortName: m.modelId.toUpperCase(),
    value: m[selectedMetric],
    category: m.category,
    isBest: m[selectedMetric] === bestValue
  }));

  return (
    <div className="space-y-4">
      {/* Metric Selector Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500 font-medium">
          {currentConfig.description}
        </p>

        <div className="flex flex-wrap items-center gap-1 bg-[#f0faf7] p-1 rounded-xl border border-[#d8ebe4]">
          {availableKeys.map(key => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg uppercase tracking-wider transition-all ${
                selectedMetric === key
                  ? 'bg-[#0d7a68] text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 15, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />
            <XAxis 
              dataKey="shortName" 
              stroke="#94a3b8" 
              tick={{ fill: '#07362f', fontSize: 11, fontWeight: 700 }}
              axisLine={{ stroke: '#e2f0ea' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#e2f0ea' }}
              tickLine={false}
              tickFormatter={(v) => `${v}${currentConfig.unit ? currentConfig.unit : ''}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0].payload;
                return (
                  <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans">
                    <p className="font-bold text-[#07362f] mb-0.5">{d.name}</p>
                    <p className="text-slate-500 text-[11px] mb-2">{d.category}</p>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-slate-600">{currentConfig.label}:</span>
                      <span className={`font-bold ${d.isBest ? 'text-[#0d7a68] text-sm' : 'text-slate-800'}`}>
                        {d.value} {currentConfig.unit}
                      </span>
                    </div>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isBest ? '#0d7a68' : entry.name.includes('Transformer') ? '#2dd4bf' : '#94a3b8'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-[#eaf4f0]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[#0d7a68] font-bold">
            <span className="w-3 h-3 rounded bg-[#0d7a68] inline-block" />
            Top Performer (Lowest Error / Highest R²)
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-3 h-3 rounded bg-[#94a3b8] inline-block" />
            Classical &amp; Recurrent Baselines
          </span>
        </div>
        <span>Evaluation benchmark based on held-out test splits</span>
      </div>
    </div>
  );
};
