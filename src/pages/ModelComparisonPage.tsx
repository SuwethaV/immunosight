import React, { useState, useEffect } from 'react';
import { 
  Award, 
  CheckCircle2, 
  Cpu, 
  Sparkles, 
  ArrowUpDown 
} from 'lucide-react';
import { DEMO_MODEL_COMPARISON } from '../data/demoData';
import { apiService } from '../services/api';
import { ModelMetric } from '../types';
import { ModelMetricsChart } from '../components/charts/ModelMetricsChart';
import { MetricCard } from '../components/common/MetricCard';

export const ModelComparisonPage: React.FC = () => {
  const [metrics, setMetrics] = useState<ModelMetric[]>(DEMO_MODEL_COMPARISON);
  const [sortField, setSortField] = useState<keyof ModelMetric>('rmse');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  useEffect(() => {
    const fetchComparison = async () => {
      try {
        const res = await apiService.getModelComparison();
        if (res.metrics?.length) {
          setMetrics(res.metrics);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchComparison();
  }, []);

  const handleSort = (field: keyof ModelMetric) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedMetrics = [...metrics].sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortAsc ? valA - valB : valB - valA;
    }
    return 0;
  });

  const bestRmse = Math.min(...metrics.map(m => m.rmse).filter(v => typeof v === 'number'));
  const bestMae = Math.min(...metrics.map(m => m.mae).filter(v => typeof v === 'number'));
  const bestR2 = Math.max(...metrics.map(m => m.r2).filter(v => typeof v === 'number'));

  const bestOverallModel = metrics.find(m => m.rmse === bestRmse) || metrics[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Benchmark KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="LOWEST RMSE"
          value={bestRmse}
          unit="% pts"
          subtitle={`Achieved by ${bestOverallModel.modelName}`}
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d7a68] font-bold">
              Min Error
            </span>
          }
        />

        <MetricCard
          title="LOWEST MAE"
          value={bestMae}
          unit="% pts"
          subtitle="Mean absolute deviation across test sets"
        />

        <MetricCard
          title="BEST R² COEFFICIENT"
          value={bestR2}
          unit="/ 1.0"
          subtitle="Proportion of variance explained"
        />

        <MetricCard
          title="EVALUATED ARCHITECTURES"
          value={metrics.length}
          unit="Models"
          subtitle="Linear, RF, XGBoost, LSTM, TFT"
        />
      </div>

      {/* Interactive Bar Chart */}
      <div className="clean-card p-6">
        <ModelMetricsChart metrics={metrics} height={300} />
      </div>

      {/* Cross-Model Evaluation Matrix */}
      <div className="clean-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#07362f] tracking-tight">
              Cross-Model Empirical Benchmark Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Click headers to sort. Star (★) highlights the top performance per metric.
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Lower is better for RMSE, MAE, MAPE, SMAPE • Higher is better for R²
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#f0faf7] text-slate-500 uppercase tracking-wider text-[10px] border-b border-[#e1efe9]">
              <tr>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('modelName')}>
                  <span className="flex items-center gap-1 font-sans font-bold">
                    Architecture <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('category')}>
                  <span className="flex items-center gap-1 font-sans">
                    Category <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('rmse')}>
                  <span className="flex items-center gap-1">
                    RMSE ↓ <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('mae')}>
                  <span className="flex items-center gap-1">
                    MAE ↓ <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('mape')}>
                  <span className="flex items-center gap-1">
                    MAPE (%) ↓ <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('smape')}>
                  <span className="flex items-center gap-1">
                    SMAPE (%) ↓ <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('r2')}>
                  <span className="flex items-center gap-1">
                    R² ↑ <ArrowUpDown className="w-3 h-3" />
                  </span>
                </th>
                {metrics.some(m => m.accuracy !== undefined) && (
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('accuracy')}>
                    <span className="flex items-center gap-1">
                      Accuracy (%) ↑ <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                )}
                {metrics.some(m => m.within5pp !== undefined) && (
                  <th className="py-3 px-3 cursor-pointer hover:text-slate-800" onClick={() => handleSort('within5pp')}>
                    <span className="flex items-center gap-1">
                      Within ±5pp (%) ↑ <ArrowUpDown className="w-3 h-3" />
                    </span>
                  </th>
                )}
                <th className="py-3 px-3 font-sans">Capability Features</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef6f3]">
              {sortedMetrics.map(m => {
                const isBestRmse = m.rmse === bestRmse;
                const isBestMae = m.mae === bestMae;
                const isBestMape = m.mape === Math.min(...metrics.map(x => x.mape));
                const isBestR2 = m.r2 === bestR2;

                return (
                  <tr key={m.modelId} className="hover:bg-[#f9fdfb] transition-colors">
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#07362f] text-sm">{m.modelName}</span>
                        {isBestRmse && (
                          <span className="px-2 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d7a68] text-[10px] font-bold border border-[#99f6e4]">
                            BEST
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-normal mt-0.5 max-w-sm line-clamp-1">{m.notes}</p>
                    </td>

                    <td className="py-3 px-3 font-sans text-slate-700">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] text-slate-700">
                        {m.category}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold">
                      <span className={isBestRmse ? 'text-[#0d7a68] font-extrabold text-sm' : 'text-slate-800'}>
                        {m.rmse} {isBestRmse && '★'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold">
                      <span className={isBestMae ? 'text-[#0d7a68] font-extrabold text-sm' : 'text-slate-800'}>
                        {m.mae} {isBestMae && '★'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold">
                      <span className={isBestMape ? 'text-[#0d7a68] font-extrabold' : 'text-slate-800'}>
                        {m.mape}% {isBestMape && '★'}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800">
                      {m.smape}%
                    </td>

                    <td className="py-3 px-3 font-bold">
                      <span className={isBestR2 ? 'text-[#0d7a68] font-extrabold text-sm' : 'text-slate-800'}>
                        {m.r2} {isBestR2 && '★'}
                      </span>
                    </td>

                    {metrics.some(x => x.accuracy !== undefined) && (
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {m.accuracy !== undefined ? `${m.accuracy}%` : '—'}
                      </td>
                    )}

                    {metrics.some(x => x.within5pp !== undefined) && (
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {m.within5pp !== undefined ? `${m.within5pp}%` : '—'}
                      </td>
                    )}

                    <td className="py-3 px-3 font-sans text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.supportsIntervals ? 'bg-[#ccfbf1] text-[#0d7a68] border border-[#99f6e4]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.supportsIntervals ? 'Quantiles' : 'Point-only'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          m.supportsInterpretability ? 'bg-[#d5f5eb] text-[#0d7a68] border border-[#a3e9d4]' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {m.supportsInterpretability ? 'Attention / SHAP' : 'Black-box'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
