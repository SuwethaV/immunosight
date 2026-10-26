import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Clock, 
  Network
} from 'lucide-react';
import { DEMO_EXPLAINABILITY_DATA } from '../data/demoData';
import { apiService } from '../services/api';
import { ExplainabilityData, FeatureImportanceItem, TemporalAttentionItem } from '../types';
import { useMetadata } from '../context/MetadataContext';
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

export const ExplainabilityPage: React.FC = () => {
  const { countries, vaccines, defaultCountry, defaultVaccine } = useMetadata();
  const [selectedCountry, setSelectedCountry] = useState<string>(defaultCountry || 'India');
  const [selectedVaccine, setSelectedVaccine] = useState<string>(defaultVaccine || 'MCV1');
  const [explainData, setExplainData] = useState<ExplainabilityData | null>(DEMO_EXPLAINABILITY_DATA);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => {
    if (defaultCountry && (!selectedCountry || selectedCountry === 'IND')) {
      setSelectedCountry(defaultCountry);
    }
  }, [defaultCountry]);

  useEffect(() => {
    if (defaultVaccine && (!selectedVaccine || selectedVaccine === 'MCV1')) {
      setSelectedVaccine(defaultVaccine);
    }
  }, [defaultVaccine]);

  useEffect(() => {
    const fetchExplainability = async () => {
      if (!selectedCountry || !selectedVaccine) return;
      try {
        const res = await apiService.getExplainability({
          country: selectedCountry,
          vaccine: selectedVaccine
        });
        setExplainData(res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExplainability();
  }, [selectedCountry, selectedVaccine]);

  const categories = [
    { id: 'ALL', label: 'All Variable Types' },
    { id: 'Static Covariates', label: 'Static Covariates' },
    { id: 'Time-Varying Observed', label: 'Time-Varying Observed' },
    { id: 'Time-Varying Known', label: 'Time-Varying Known' },
  ];

  const filteredFeatures = explainData?.featureImportance.filter(f => 
    selectedCategory === 'ALL' || f.category === selectedCategory
  ).sort((a, b) => b.importance - a.importance) || [];

  const categoryColors: Record<string, string> = {
    'Static Covariates': '#14b8a6',
    'Time-Varying Observed': '#0d7a68',
    'Time-Varying Known': '#f59e0b',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter Console */}
      <div className="clean-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#07362f]">
            TFT Feature Importance &amp; Self-Attention Dynamics
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Variable Selection Networks (VSN) &amp; historical attention decay
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Country</label>
            <select
              value={selectedCountry}
              onChange={e => setSelectedCountry(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer max-w-[160px] truncate"
            >
              {countries.map(c => (
                <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vaccine</label>
            <select
              value={selectedVaccine}
              onChange={e => setSelectedVaccine(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer max-w-[160px] truncate"
            >
              {vaccines.map(v => (
                <option key={v.code} value={v.code}>{v.code}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Model Narrative Callout */}
      {explainData?.summaryNarrative && (
        <div className="bg-[#e6f7f2] border-l-4 border-l-[#0d7a68] rounded-xl p-4 flex items-start gap-3 shadow-sm">
          <Sparkles className="w-5 h-5 text-[#0d7a68] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#07362f]">
              Attention Narrative Interpretation
            </h4>
            <p className="text-xs text-[#0a453b] leading-relaxed font-medium">
              {explainData.summaryNarrative}
            </p>
          </div>
        </div>
      )}

      {/* Feature Importance (VSN) Section */}
      <div className="clean-card p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#07362f] tracking-tight flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0d7a68]" />
              <span>Variable Selection Network (VSN) Importance Weights</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Relative importance scores across static, time-varying observed, and known inputs
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#f0faf7] p-1 rounded-xl border border-[#d8ebe4]">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#0d7a68] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filteredFeatures} layout="vertical" margin={{ top: 10, right: 30, left: 70, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" horizontal={false} />
              <XAxis type="number" domain={[0, 0.35]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
              <YAxis dataKey="displayName" type="category" stroke="#94a3b8" tick={{ fill: '#07362f', fontSize: 11, fontWeight: 600 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as FeatureImportanceItem;
                  return (
                    <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans max-w-xs">
                      <p className="font-bold text-[#07362f] mb-0.5">{d.displayName}</p>
                      <p className="text-[10px] text-[#0d7a68] font-semibold mb-1.5">{d.category}</p>
                      <p className="text-slate-600 mb-2 leading-relaxed">{d.description}</p>
                      <div className="flex items-center justify-between border-t border-[#f0f7f4] pt-1">
                        <span className="text-slate-400">VSN Weight:</span>
                        <span className="font-bold text-[#0d7a68]">{(d.importance * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="importance" radius={[0, 4, 4, 0]}>
                {filteredFeatures.map((entry, index) => (
                  <Cell key={`feat-cell-${index}`} fill={categoryColors[entry.category] || '#0d7a68'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-3 border-t border-[#eaf4f0]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[#0d7a68] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0d7a68]" />
              Time-Varying Observed (Historical Lags)
            </span>
            <span className="flex items-center gap-1.5 text-[#14b8a6] font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6]" />
              Static Covariates (Income, Region)
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Time-Varying Known (Horizon Year)
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">Computed via Gated Residual Network (GRN)</span>
        </div>
      </div>

      {/* Historical Self-Attention Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clean-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#07362f] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0d7a68]" />
                <span>Historical Self-Attention Weights</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Relative attention allocation across retrospective observation years
              </p>
            </div>
            <span className="text-xs font-semibold text-[#0d7a68]">Encoder Attention</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={explainData?.temporalAttention || []} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />
                <XAxis dataKey="relativeLag" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload as TemporalAttentionItem;
                    return (
                      <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans">
                        <p className="font-bold text-[#07362f] mb-0.5">{d.relativeLag}</p>
                        <p className="text-slate-600 text-[11px] mb-1.5">{d.eventContext}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Attention Weight:</span>
                          <span className="font-bold text-[#0d7a68]">{(d.weight * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="weight" fill="#0d7a68" radius={[4, 4, 0, 0]}>
                  {explainData?.temporalAttention.map((t, idx) => (
                    <Cell 
                      key={`temp-${idx}`} 
                      fill={t.lagYear === 2020 ? '#e11d48' : t.lagYear === 2023 ? '#0d7a68' : '#2dd4bf'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Red bar highlights elevated attention directed at 2020 to isolate pandemic anomalies.
          </p>
        </div>

        <div className="clean-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-[#07362f] flex items-center gap-2">
                <Network className="w-4 h-4 text-[#14b8a6]" />
                <span>Multi-Horizon Decoder Attention Decay</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Decoder self-attention weights across future prediction steps
              </p>
            </div>
            <span className="text-xs font-semibold text-[#14b8a6]">Decoder Step</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={explainData?.decoderAttention || []} margin={{ top: 10, right: 15, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />
                <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-white border border-[#d8ebe4] rounded-lg text-xs font-sans shadow-md">
                        <p className="font-bold text-[#07362f]">{d.year} (Horizon t+{d.horizon})</p>
                        <p className="text-[#0d7a68] font-bold mt-1">Weight: {(d.weight * 100).toFixed(1)}%</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="weight" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Immediate short-term steps receive higher deterministic attention, transitioning towards broader priors over longer horizons.
          </p>
        </div>
      </div>
    </div>
  );
};
