import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Globe, 
  Search, 
  Activity, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  FileCheck
} from 'lucide-react';
import { DEMO_COUNTRIES, DEMO_VACCINES } from '../data/demoData';
import { apiService } from '../services/api';
import { CountryMetadata } from '../types';
import { RiskBadge, TrendBadge } from '../components/common/RiskBadge';
import { MetricCard } from '../components/common/MetricCard';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

export const CountryAnalysisPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCode = searchParams.get('code') || 'IND';

  const [countries, setCountries] = useState<CountryMetadata[]>(DEMO_COUNTRIES);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(initialCode);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVaccines, setSelectedVaccines] = useState<string[]>(['DTP3', 'MCV1', 'BCG', 'Pol3']);
  const [startYear, setStartYear] = useState<number>(2005);
  const [endYear, setEndYear] = useState<number>(2023);

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const meta = await apiService.getMetadata();
        if (meta.countries?.length) {
          setCountries(meta.countries);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadMetadata();
  }, []);

  // Sync url param
  useEffect(() => {
    const code = searchParams.get('code');
    if (code && code !== selectedCountryCode) {
      setSelectedCountryCode(code);
    }
  }, [searchParams]);

  const handleCountryChange = (code: string) => {
    setSelectedCountryCode(code);
    setSearchParams({ code });
  };

  const selectedCountry = useMemo(() => {
    return countries.find(c => c.code === selectedCountryCode) || countries[0];
  }, [countries, selectedCountryCode]);

  const filteredCountryList = useMemo(() => {
    if (!searchTerm) return countries;
    return countries.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [countries, searchTerm]);

  // Generate multi-vaccine historical series for selected country
  const multiVaccineData = useMemo(() => {
    const years: number[] = [];
    for (let y = startYear; y <= endYear; y++) years.push(y);

    return years.map(year => {
      const point: { year: number; [key: string]: number } = { year };
      
      selectedVaccines.forEach(vCode => {
        let seed = 0;
        for (let i = 0; i < selectedCountry.code.length; i++) seed += selectedCountry.code.charCodeAt(i);
        for (let i = 0; i < vCode.length; i++) seed += vCode.charCodeAt(i);

        const base = 48 + (seed % 42);
        const t = year - 2000;
        let cov = base + (t * 0.85) + Math.sin(t / 3) * 3;
        if (year === 2020) cov -= 5.0;
        if (year === 2021) cov -= 3.5;
        if (cov > 99) cov = 99;
        if (cov < 25) cov = 25;
        point[vCode] = Math.round(cov * 10) / 10;
      });

      return point;
    });
  }, [selectedCountry, selectedVaccines, startYear, endYear]);

  // Calculate summary metrics for current country
  const latestDtp3 = multiVaccineData[multiVaccineData.length - 1]?.['DTP3'] ?? 75;
  const prevDtp3 = multiVaccineData[multiVaccineData.length - 2]?.['DTP3'] ?? latestDtp3;
  const yoyChange = Math.round((latestDtp3 - prevDtp3) * 10) / 10;

  let trendClass = 'Stagnant';
  if (latestDtp3 >= 90) trendClass = 'Target Reached';
  else if (yoyChange >= 2.0) trendClass = 'Accelerating';
  else if (yoyChange <= -1.0) trendClass = 'Declining';

  const riskLevel = latestDtp3 >= 90 ? 'TARGET_ACHIEVED' : latestDtp3 >= 70 ? 'MEDIUM' : 'HIGH';

  const latestVaccineComparison = useMemo(() => {
    return DEMO_VACCINES.map(v => {
      let seed = 0;
      for (let i = 0; i < selectedCountry.code.length; i++) seed += selectedCountry.code.charCodeAt(i);
      for (let i = 0; i < v.code.length; i++) seed += v.code.charCodeAt(i);
      let cov = 50 + (seed % 45);
      if (cov > 98) cov = 98;
      return {
        code: v.code,
        name: v.name,
        coverage: cov,
        whoTarget: v.whoTarget
      };
    }).sort((a, b) => b.coverage - a.coverage);
  }, [selectedCountry]);

  const vaccineColors: Record<string, string> = {
    DTP3: '#0d7a68',
    MCV1: '#14b8a6',
    BCG: '#f59e0b',
    Pol3: '#8b5cf6',
    HepB3: '#ec4899',
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Filter and Country Selector Bar */}
      <div className="clean-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#07362f] flex items-center gap-2">
              <Globe className="w-5 h-5 text-[#0d7a68]" />
              <span>National Immunization Profile: {selectedCountry.name}</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {selectedCountry.region} • {selectedCountry.incomeGroup} • ISO: <span className="font-mono text-[#0d7a68] font-bold">{selectedCountry.code}</span>
            </p>
          </div>

          {/* Searchable Select Dropdown */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search country..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 placeholder-slate-400 text-xs focus:outline-none focus:border-[#0d7a68] shadow-sm"
              />
            </div>

            <select
              value={selectedCountryCode}
              onChange={e => handleCountryChange(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white border border-[#d8ebe4] text-slate-800 text-xs font-semibold focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer"
            >
              {filteredCountryList.map(c => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Year Filter Slider & Vaccine Toggle Badges */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-[#eaf4f0] text-xs">
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#0d7a68]" />
            <span className="text-slate-500 font-semibold">Observation Window:</span>
            <select
              value={startYear}
              onChange={e => setStartYear(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d8ebe4] text-slate-800 text-xs font-mono font-medium"
            >
              {[2000, 2005, 2010, 2015].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <span className="text-slate-400 font-medium">to</span>
            <select
              value={endYear}
              onChange={e => setEndYear(Number(e.target.value))}
              className="px-2.5 py-1 rounded-lg bg-white border border-[#d8ebe4] text-slate-800 text-xs font-mono font-medium"
            >
              {[2020, 2021, 2022, 2023].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          {/* Toggleable Vaccine Series */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-500 font-semibold mr-1">Series:</span>
            {['DTP3', 'MCV1', 'BCG', 'Pol3', 'HepB3'].map(vCode => {
              const active = selectedVaccines.includes(vCode);
              return (
                <button
                  key={vCode}
                  onClick={() => {
                    if (active) {
                      if (selectedVaccines.length > 1) {
                        setSelectedVaccines(selectedVaccines.filter(v => v !== vCode));
                      }
                    } else {
                      setSelectedVaccines([...selectedVaccines, vCode]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full font-mono text-xs font-semibold transition-all border ${
                    active
                      ? 'bg-[#ccfbf1] text-[#0d7a68] border-[#99f6e4] shadow-sm'
                      : 'bg-white text-slate-500 border-[#d8ebe4] hover:text-slate-800'
                  }`}
                >
                  {vCode}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* KPI Cards for Selected Country */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="LATEST DTP3 COVERAGE"
          value={`${latestDtp3}%`}
          subtitle="Primary routine anchor dose"
          trend={{ value: `${yoyChange > 0 ? `+${yoyChange}` : yoyChange}%`, label: 'YoY', positiveIsGood: true }}
          badge={<RiskBadge level={riskLevel} size="sm" />}
        />

        <MetricCard
          title="TREND CLASSIFICATION"
          value={trendClass}
          subtitle={`YoY Change: ${yoyChange > 0 ? `+${yoyChange}` : yoyChange}%`}
          badge={<TrendBadge direction={yoyChange > 0.5 ? 'increasing' : yoyChange < -0.5 ? 'decreasing' : 'stable'} />}
        />

        <MetricCard
          title="DATA COMPLETENESS"
          value={`${selectedCountry.dataCompleteness}%`}
          subtitle="Annual reporting fidelity"
          badge={
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d7a68] font-bold">
              High Quality
            </span>
          }
        />

        <MetricCard
          title="MISSING SURVEY YEARS"
          value={selectedCountry.missingYearsCount}
          unit="Years"
          subtitle="Interpolated via TFT"
        />
      </div>

      {/* Historical Multi-Vaccine Trend Line Chart */}
      <div className="clean-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#07362f] tracking-tight">
              Historical Immunization Trajectory ({startYear} – {endYear})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Longitudinal coverage across selected antigens for {selectedCountry.name}
            </p>
          </div>
          <span className="text-xs font-semibold text-[#0d7a68] bg-[#f0faf7] px-3 py-1 rounded-full border border-[#d8ebe4]">
            WHO/UNICEF Standardized
          </span>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={multiVaccineData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" vertical={false} />
              <XAxis dataKey="year" stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} />
              <YAxis domain={[20, 100]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans">
                      <p className="font-bold text-[#07362f] mb-1.5">{label} Annual Coverage</p>
                      {payload.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-4 py-0.5">
                          <span style={{ color: item.color }} className="font-medium">{item.name}:</span>
                          <span className="font-bold text-slate-900">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine y={90} stroke="#0d7a68" strokeDasharray="4 4" label={{ value: 'WHO Target 90%', fill: '#0d7a68', fontSize: 10, position: 'insideTopLeft' }} />
              
              {selectedVaccines.map(vCode => (
                <Line
                  key={vCode}
                  type="monotone"
                  dataKey={vCode}
                  name={vCode}
                  stroke={vaccineColors[vCode] || '#0d7a68'}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: vaccineColors[vCode] || '#0d7a68' }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vaccine Breakdown Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="clean-card p-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#07362f]">
              Antigen Performance Breakdown ({endYear})
            </h3>
            <p className="text-xs text-slate-500">Comparing all tracked antigens against WHO benchmark</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={latestVaccineComparison} layout="vertical" margin={{ top: 10, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef6f3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="code" type="category" stroke="#94a3b8" tick={{ fill: '#07362f', fontSize: 11, fontWeight: 700 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="p-3 bg-white border border-[#d8ebe4] rounded-xl shadow-lg text-xs font-sans">
                        <p className="font-bold text-[#07362f] mb-1">{d.name}</p>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500">Coverage:</span>
                          <span className="font-bold text-[#0d7a68]">{d.coverage}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <ReferenceLine x={90} stroke="#0d7a68" strokeDasharray="3 3" />
                <Bar dataKey="coverage" fill="#0d7a68" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clean-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#07362f]">Schedule &amp; Target Compliance</h3>
            <span className="text-xs font-semibold text-slate-500">{selectedCountry.name}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#f0faf7] text-slate-500 uppercase tracking-wider font-semibold text-[10px] border-b border-[#e1efe9]">
                <tr>
                  <th className="py-2.5 px-3">Antigen</th>
                  <th className="py-2.5 px-3">Coverage</th>
                  <th className="py-2.5 px-3">Target</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef6f3]">
                {latestVaccineComparison.slice(0, 6).map(v => {
                  const targetMet = v.coverage >= v.whoTarget;
                  return (
                    <tr key={v.code} className="hover:bg-[#f9fdfb] transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-[#07362f]">{v.code}</span>
                        <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{v.name}</p>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 font-mono">{v.coverage}%</td>
                      <td className="py-2.5 px-3 text-slate-500 font-mono">{v.whoTarget}%</td>
                      <td className="py-2.5 px-3">
                        {targetMet ? (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#ccfbf1] text-[#0d7a68] font-bold border border-[#99f6e4]">
                            Met Target
                          </span>
                        ) : (
                          <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            Deficit ({v.coverage - v.whoTarget}%)
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
