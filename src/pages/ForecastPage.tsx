import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Clock, 
  AlertCircle, 
  TrendingUp, 
  Layers, 
  Sparkles, 
  Table
} from 'lucide-react';
import { DEMO_COUNTRIES, DEMO_VACCINES, DEMO_AVAILABLE_HORIZONS } from '../data/demoData';
import { apiService } from '../services/api';
import { ForecastResponse, CountryMetadata, VaccineMetadata } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { TrendBadge } from '../components/common/RiskBadge';
import { CoverageTrendChart } from '../components/charts/CoverageTrendChart';

export const ForecastPage: React.FC = () => {
  const [countries, setCountries] = useState<CountryMetadata[]>(DEMO_COUNTRIES);
  const [vaccines, setVaccines] = useState<VaccineMetadata[]>(DEMO_VACCINES);
  const [selectedCountry, setSelectedCountry] = useState<string>('IND');
  const [selectedVaccine, setSelectedVaccine] = useState<string>('MCV1');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(2028);
  const [showIntervals, setShowIntervals] = useState<boolean>(true);
  
  const [forecastResult, setForecastResult] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const meta = await apiService.getMetadata();
        if (meta.countries?.length) setCountries(meta.countries);
        if (meta.vaccines?.length) setVaccines(meta.vaccines);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMetadata();
  }, []);

  useEffect(() => {
    const fetchForecast = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiService.getForecast({
          country: selectedCountry,
          vaccine: selectedVaccine,
          horizons: [selectedHorizon]
        });
        setForecastResult(res);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Forecast retrieval failed');
      } finally {
        setLoading(false);
      }
    };
    fetchForecast();
  }, [selectedCountry, selectedVaccine, selectedHorizon]);

  const handleDownloadCSV = () => {
    if (!forecastResult) return;

    const headers = ['CountryCode', 'CountryName', 'VaccineCode', 'VaccineName', 'Year', 'Type', 'Coverage', 'Lower80_q10', 'Upper80_q90', 'Lower95', 'Upper95'];
    const rows: (string | number)[][] = [];

    forecastResult.historical.forEach(h => {
      rows.push([
        forecastResult.country,
        `"${forecastResult.countryName}"`,
        forecastResult.vaccine,
        `"${forecastResult.vaccineName}"`,
        h.year,
        'Historical_Observed',
        h.coverage,
        '',
        '',
        '',
        ''
      ]);
    });

    forecastResult.forecast.forEach(f => {
      rows.push([
        forecastResult.country,
        `"${forecastResult.countryName}"`,
        forecastResult.vaccine,
        `"${forecastResult.vaccineName}"`,
        f.year,
        'TFT_Forecast',
        f.predicted,
        f.lower80 ?? '',
        f.upper80 ?? '',
        f.lower95 ?? '',
        f.upper95 ?? ''
      ]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `immunosight_tft_forecast_${forecastResult.country}_${forecastResult.vaccine}_to_${selectedHorizon}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const selectedVaccineObj = vaccines.find(v => v.code === selectedVaccine) || vaccines[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Control Console */}
      <div className="clean-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#0d7a68] px-2.5 py-0.5 rounded-full bg-[#ccfbf1] border border-[#99f6e4]">
                Temporal Fusion Transformer
              </span>
              <span className="text-xs text-slate-500 font-medium">
                Multi-Horizon Quantile Regression
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-[#07362f]">
              Childhood Immunization Coverage Forecast Engine
            </h2>
          </div>

          {forecastResult && (
            <button
              onClick={handleDownloadCSV}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-[#f0faf7] text-[#0d7a68] border border-[#a3e9d4] text-xs font-semibold shadow-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download Forecast (CSV)</span>
            </button>
          )}
        </div>

        {/* Parameter Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-[#eaf4f0]">
          {/* Country */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Target Country
            </label>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code}) - {c.region}
                </option>
              ))}
            </select>
          </div>

          {/* Vaccine */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Antigen / Vaccine
            </label>
            <select
              value={selectedVaccine}
              onChange={e => setSelectedVaccine(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer"
            >
              {vaccines.map(v => (
                <option key={v.code} value={v.code}>
                  {v.code} - {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Horizon */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Forecast Horizon
              </label>
              <span className="text-[11px] font-mono text-[#0d7a68] font-bold">Year: {selectedHorizon}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#f0faf7] p-1 rounded-xl border border-[#d8ebe4]">
              {DEMO_AVAILABLE_HORIZONS.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedHorizon(year)}
                  className={`flex-1 py-1.5 text-xs font-mono font-bold rounded-lg transition-all ${
                    selectedHorizon === year
                      ? 'bg-[#0d7a68] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#eaf4f0] text-xs">
          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
            <input
              type="checkbox"
              checked={showIntervals}
              onChange={e => setShowIntervals(e.target.checked)}
              className="w-4 h-4 rounded border-[#d8ebe4] text-[#0d7a68] focus:ring-[#0d7a68]"
            />
            <span>Render TFT Quantile Prediction Intervals (P10 to P90 Range)</span>
          </label>

          <span className="text-slate-500 text-[11px]">
            Model: TFT attention-based decoder with static country embeddings
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
          <div>
            <p className="font-bold">Inference Error</p>
            <p className="mt-0.5 opacity-90">{error}</p>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      {forecastResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title={`LATEST OBSERVED (${forecastResult.latestYear})`}
            value={`${forecastResult.latestObserved}%`}
            subtitle="Ground truth historical anchor"
          />

          <MetricCard
            title={`TFT FORECAST (${forecastResult.targetHorizonYear})`}
            value={`${forecastResult.predictedCoverage}%`}
            subtitle="Median forecast point (P50)"
            trend={{ value: `${forecastResult.absoluteChange > 0 ? `+${forecastResult.absoluteChange}` : forecastResult.absoluteChange}%`, positiveIsGood: true }}
          />

          <MetricCard
            title="ABSOLUTE CHANGE"
            value={`${forecastResult.absoluteChange > 0 ? `+${forecastResult.absoluteChange}` : forecastResult.absoluteChange}%`}
            unit="points"
            subtitle={`${forecastResult.latestYear} to ${forecastResult.targetHorizonYear}`}
          />

          <MetricCard
            title="FORECAST TRAJECTORY"
            value={forecastResult.direction.toUpperCase()}
            subtitle={`WHO Target: ${selectedVaccineObj.whoTarget}%`}
            badge={<TrendBadge direction={forecastResult.direction} changeVal={forecastResult.absoluteChange} />}
          />
        </div>
      )}

      {/* Main Historical vs Predicted Chart */}
      {forecastResult && (
        <div className="clean-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#07362f] tracking-tight">
                Historical Observations vs. TFT Multi-Horizon Forecast
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {forecastResult.countryName} • {forecastResult.vaccineName} ({forecastResult.vaccine})
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-[#0d7a68]">
                <span className="w-3 h-0.5 bg-[#0d7a68] inline-block" />
                Observed (2000–{forecastResult.latestYear})
              </span>
              <span className="flex items-center gap-1.5 text-[#0d7a68]">
                <span className="w-3 h-0.5 border-t-2 border-dashed border-[#0d7a68] inline-block" />
                TFT Forecast ({forecastResult.latestYear + 1}–{selectedHorizon})
              </span>
            </div>
          </div>

          <CoverageTrendChart
            historical={forecastResult.historical}
            forecast={forecastResult.forecast}
            showIntervals={showIntervals}
            height={360}
          />
        </div>
      )}

      {/* Forecast Data Table */}
      {forecastResult && (
        <div className="clean-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#07362f] flex items-center gap-2">
                <Table className="w-4 h-4 text-[#0d7a68]" />
                <span>Forecast Breakdown &amp; Prediction Intervals Table</span>
              </h3>
              <p className="text-xs text-slate-500">Quantile bounds by horizon year</p>
            </div>
            <button
              onClick={handleDownloadCSV}
              className="text-xs text-[#0d7a68] hover:text-[#0a5c4e] font-semibold flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-[#f0faf7] text-slate-500 uppercase tracking-wider text-[10px] border-b border-[#e1efe9]">
                <tr>
                  <th className="py-2.5 px-3">Horizon Year</th>
                  <th className="py-2.5 px-3">Predicted Coverage (P50)</th>
                  <th className="py-2.5 px-3">80% Interval (P10 - P90)</th>
                  <th className="py-2.5 px-3">95% Interval (P2.5 - P97.5)</th>
                  <th className="py-2.5 px-3">Δ vs Observed ({forecastResult.latestYear})</th>
                  <th className="py-2.5 px-3">Trajectory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef6f3]">
                {forecastResult.forecast.map(f => {
                  const delta = Math.round((f.predicted - forecastResult.latestObserved) * 10) / 10;
                  return (
                    <tr key={f.year} className="hover:bg-[#f9fdfb] transition-colors">
                      <td className="py-2.5 px-3 font-bold text-[#07362f]">{f.year}</td>
                      <td className="py-2.5 px-3 font-bold text-[#0d7a68] text-sm">
                        {f.predicted}%
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {f.lower80 !== undefined && f.upper80 !== undefined
                          ? `[${f.lower80}% — ${f.upper80}%]`
                          : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {f.lower95 !== undefined && f.upper95 !== undefined
                          ? `[${f.lower95}% — ${f.upper95}%]`
                          : 'N/A'}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={delta > 0 ? 'text-[#0d7a68]' : delta < 0 ? 'text-rose-600' : 'text-slate-500'}>
                          {delta > 0 ? `+${delta}%` : `${delta}%`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-sans">
                        <TrendBadge direction={delta > 0.5 ? 'increasing' : delta < -0.5 ? 'decreasing' : 'stable'} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
