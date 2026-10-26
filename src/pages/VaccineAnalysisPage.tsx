import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Syringe, 
  Search, 
  Award, 
  ShieldCheck, 
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { DEMO_VACCINES, DEMO_COUNTRIES } from '../data/demoData';
import { VaccineMetadata, VaccineCoverageItem } from '../types';
import { MetricCard } from '../components/common/MetricCard';
import { useMetadata } from '../context/MetadataContext';
import { apiService } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts';

export const VaccineAnalysisPage: React.FC = () => {
  const { vaccines, defaultVaccine } = useMetadata();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCode = searchParams.get('code');

  const [selectedVaccineCode, setSelectedVaccineCode] = useState<string>(urlCode || defaultVaccine || 'MCV1');
  const [selectedYear, setSelectedYear] = useState<number>(2023);
  const [searchTerm, setSearchTerm] = useState('');
  const [backendCoverageData, setBackendCoverageData] = useState<VaccineCoverageItem[]>([]);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code && code !== selectedVaccineCode) {
      setSelectedVaccineCode(code);
    } else if (!code && defaultVaccine) {
      setSelectedVaccineCode(defaultVaccine);
    }
  }, [searchParams, defaultVaccine]);

  const handleVaccineChange = (code: string) => {
    setSelectedVaccineCode(code);
    setSearchParams({ code });
  };

  const selectedVaccine = useMemo(() => {
    return vaccines.find(v => v.code.toLowerCase() === selectedVaccineCode.toLowerCase() || v.name.toLowerCase() === selectedVaccineCode.toLowerCase())
      || vaccines.find(v => v.code.toLowerCase() === defaultVaccine.toLowerCase())
      || vaccines[0]
      || DEMO_VACCINES[0];
  }, [vaccines, selectedVaccineCode, defaultVaccine]);

  const filteredVaccineList = useMemo(() => {
    const list = vaccines.length > 0 ? vaccines : DEMO_VACCINES;
    if (!searchTerm) return list;
    return list.filter(v =>
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.targetDisease && v.targetDisease.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vaccines, searchTerm]);

  useEffect(() => {
    let isMounted = true;
    const fetchCov = async () => {
      if (!selectedVaccine.code) return;
      try {
        const res = await apiService.getVaccineCoverage(selectedVaccine.code, selectedYear);
        if (isMounted && res.length > 0) {
          setBackendCoverageData(res);
        }
      } catch (err) {
        console.warn('[VaccineAnalysisPage] Failed to fetch vaccine coverage', err);
      }
    };
    fetchCov();
    return () => { isMounted = false; };
  }, [selectedVaccine.code, selectedYear]);

  const countryCoverageData = useMemo(() => {
    if (backendCoverageData.length > 0) {
      return backendCoverageData;
    }

    return DEMO_COUNTRIES.map(country => {
      let seed = 0;
      for (let i = 0; i < country.code.length; i++) seed += country.code.charCodeAt(i);
      for (let i = 0; i < selectedVaccine.code.length; i++) seed += selectedVaccine.code.charCodeAt(i);

      const base = 48 + (seed % 45);
      const yearFactor = (selectedYear - 2000) * 0.7;
      let cov = base + yearFactor;
      if (selectedYear === 2020) cov -= 4.2;
      if (cov > 99) cov = 99;
      if (cov < 30) cov = 30;

      const rounded = Math.round(cov * 10) / 10;
      return {
        code: country.code,
        name: country.name,
        region: country.region,
        incomeGroup: country.incomeGroup,
        coverage: rounded,
        meetsTarget: rounded >= selectedVaccine.whoTarget
      };
    }).sort((a, b) => b.coverage - a.coverage);
  }, [backendCoverageData, selectedVaccine, selectedYear]);

  const averageCoverage = useMemo(() => {
    if (!countryCoverageData.length) return 0;
    const total = countryCoverageData.reduce((acc, c) => acc + c.coverage, 0);
    return Math.round((total / countryCoverageData.length) * 10) / 10;
  }, [countryCoverageData]);

  const targetAchievedCount = countryCoverageData.filter(c => c.meetsTarget ?? (c.coverage >= selectedVaccine.whoTarget)).length;
  const targetAchievedPercent = countryCoverageData.length 
    ? Math.round((targetAchievedCount / countryCoverageData.length) * 100)
    : 0;

  const topPerformers = countryCoverageData.slice(0, 5);
  const bottomPerformers = [...countryCoverageData].reverse().slice(0, 5);

  const distributionData = useMemo(() => {
    const bands = [
      { name: '< 50% (Severe)', count: 0, fill: '#e11d48' },
      { name: '50% - 69% (High Risk)', count: 0, fill: '#fb7185' },
      { name: '70% - 89% (Lagging)', count: 0, fill: '#f59e0b' },
      { name: '≥ 90% (Target Met)', count: 0, fill: '#0d7a68' },
    ];

    countryCoverageData.forEach(c => {
      if (c.coverage < 50) bands[0].count++;
      else if (c.coverage < 70) bands[1].count++;
      else if (c.coverage < 90) bands[2].count++;
      else bands[3].count++;
    });

    return bands;
  }, [countryCoverageData]);

  const evaluationYears = [2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter Bar */}
      <div className="clean-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#07362f] flex items-center gap-2">
              <Syringe className="w-5 h-5 text-[#0d7a68]" />
              <span>Antigen Profile: {selectedVaccine.name} ({selectedVaccine.code})</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Target Disease: <span className="text-slate-800 font-semibold">{selectedVaccine.targetDisease}</span> • Recommended Schedule: <span className="text-[#0d7a68] font-mono font-semibold">{selectedVaccine.recommendedAge}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search antigen or disease..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#0d7a68] shadow-sm"
              />
            </div>

            <select
              value={selectedVaccineCode}
              onChange={e => handleVaccineChange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer max-w-[200px] truncate"
            >
              {filteredVaccineList.map(v => (
                <option key={v.code} value={v.code}>
                  {v.code} - {v.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Year Comparison Selector */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#eaf4f0] text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#0d7a68]" />
            <span className="text-slate-500 font-semibold">Evaluation Year:</span>
            <div className="flex flex-wrap items-center gap-1 bg-[#f0faf7] p-1 rounded-xl border border-[#d8ebe4]">
              {evaluationYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                    selectedYear === year
                      ? 'bg-[#0d7a68] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {year >= 2024 ? `${year} (forecast)` : `${year}`}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            {selectedVaccine.description}
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="GLOBAL AVERAGE COVERAGE"
          value={`${averageCoverage}%`}
          subtitle={`Across tracked countries (${selectedYear})`}
          badge={
            <span className="text-xs font-bold font-mono text-[#0d7a68]">
              Target: {selectedVaccine.whoTarget}%
            </span>
          }
        />

        <MetricCard
          title="WHO TARGET BENCHMARK"
          value={`${selectedVaccine.whoTarget}%`}
          subtitle="Required herd protection standard"
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d7a68] font-bold">
              Global Target
            </span>
          }
        />

        <MetricCard
          title="COUNTRIES MEETING TARGET"
          value={`${targetAchievedCount} / ${countryCoverageData.length}`}
          unit={`(${targetAchievedPercent}%)`}
          subtitle={`Surpassed ${selectedVaccine.whoTarget}% threshold`}
          trend={{ value: `${targetAchievedPercent}%`, label: 'compliance', positiveIsGood: true }}
        />

        <MetricCard
          title="INFANT SERIES DOSES"
          value={selectedVaccine.doses}
          unit="Dose(s)"
          subtitle={`Schedule: ${selectedVaccine.recommendedAge}`}
        />
      </div>

      {/* Country Comparisons Chart */}
      <div className="clean-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#07362f] tracking-tight">
              Country Comparison for {selectedVaccine.code} ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked cross-country coverage against WHO benchmark ({selectedVaccine.whoTarget}%)
            </p>
          </div>
          <span className="text-xs font-medium text-slate-500">
            Green ≥ {selectedVaccine.whoTarget}% • Amber 70-89% • Red &lt; 70%
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={countryCoverageData.slice(0, 25)} margin={{ top: 20, right: 15, left: -10, bottom: 35 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />
              <XAxis 
                dataKey="code" 
                stroke="#94a3b8" 
                tick={{ fill: '#64748b', fontSize: 10, angle: -45, textAnchor: 'end' }} 
              />
              <YAxis domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans">
                      <p className="font-bold text-[#07362f] mb-1">{d.name} ({d.code})</p>
                      <p className="text-[10px] text-slate-500 mb-2">{d.region}</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Coverage:</span>
                        <span className="font-bold text-[#0d7a68] font-mono">{d.coverage}%</span>
                      </div>
                    </div>
                  );
                }}
              />
              <ReferenceLine y={selectedVaccine.whoTarget} stroke="#0d7a68" strokeDasharray="4 4" />
              <Bar dataKey="coverage" radius={[4, 4, 0, 0]}>
                {countryCoverageData.slice(0, 25).map((c, idx) => (
                  <Cell 
                    key={`c-cell-${idx}`} 
                    fill={c.coverage >= selectedVaccine.whoTarget ? '#0d7a68' : c.coverage >= 70 ? '#f59e0b' : '#e11d48'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coverage Distribution & Top/Bottom Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="clean-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#07362f]">Coverage Distribution Tiers</h3>
            <p className="text-xs text-slate-500">Grouping nations into vulnerability brackets</p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-2.5 bg-white border border-[#d8ebe4] rounded-lg text-xs font-sans shadow-md">
                        <span className="font-bold text-[#07362f]">{d.name}</span>
                        <p className="text-[#0d7a68] font-bold mt-1">{d.count} Countries</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`dist-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[#eef6f3] pb-2">
            <h3 className="text-sm font-bold text-[#07362f] flex items-center gap-2">
              <Award className="w-4 h-4 text-[#0d7a68]" />
              <span>Highest Coverage</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-[#0d7a68]">Top 5</span>
          </div>

          <div className="space-y-2">
            {topPerformers.map((c, idx) => (
              <div key={c.code} className="p-2.5 rounded-lg bg-[#f0faf7] border border-[#d8ebe4] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400 font-bold">{idx + 1}.</span>
                  <div>
                    <p className="font-bold text-[#07362f]">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.region}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-[#0d7a68]">{c.coverage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="clean-card p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-[#eef6f3] pb-2">
            <h3 className="text-sm font-bold text-[#07362f] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Lowest Coverage (Watchlist)</span>
            </h3>
            <span className="text-[10px] font-mono font-bold text-rose-600">Bottom 5</span>
          </div>

          <div className="space-y-2">
            {bottomPerformers.map((c, idx) => (
              <div key={c.code} className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-200/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-rose-600 font-bold">{idx + 1}.</span>
                  <div>
                    <p className="font-bold text-[#07362f]">{c.name}</p>
                    <p className="text-[10px] text-slate-500">{c.region}</p>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-600">{c.coverage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};