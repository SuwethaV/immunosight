import React, { useState } from 'react';
import { DEMO_COUNTRIES } from '../../data/demoData';
import { RiskBadge } from '../common/RiskBadge';
import { Globe2, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface GeoDataPoint {
  code: string;
  name: string;
  region: string;
  coverage: number;
  incomeGroup: string;
  population?: number;
}

const COUNTRY_SAMPLE_DATA: GeoDataPoint[] = [
  { code: 'NGA', name: 'Nigeria', region: 'AFRO', coverage: 62.1, incomeGroup: 'Lower middle income', population: 218541212 },
  { code: 'IND', name: 'India', region: 'SEARO', coverage: 89.2, incomeGroup: 'Lower middle income', population: 1417173173 },
  { code: 'ETH', name: 'Ethiopia', region: 'AFRO', coverage: 65.5, incomeGroup: 'Low income', population: 123379924 },
  { code: 'COD', name: 'Dem. Rep. Congo', region: 'AFRO', coverage: 58.2, incomeGroup: 'Low income', population: 99010212 },
  { code: 'PAK', name: 'Pakistan', region: 'EMRO', coverage: 71.2, incomeGroup: 'Lower middle income', population: 235824862 },
  { code: 'IDN', name: 'Indonesia', region: 'SEARO', coverage: 82.4, incomeGroup: 'Upper middle income', population: 275501339 },
  { code: 'BRA', name: 'Brazil', region: 'AMRO', coverage: 85.0, incomeGroup: 'Upper middle income', population: 215313498 },
  { code: 'AFG', name: 'Afghanistan', region: 'EMRO', coverage: 56.4, incomeGroup: 'Low income', population: 41128771 },
  { code: 'BGD', name: 'Bangladesh', region: 'SEARO', coverage: 93.8, incomeGroup: 'Lower middle income', population: 171186372 },
  { code: 'KEN', name: 'Kenya', region: 'AFRO', coverage: 83.0, incomeGroup: 'Lower middle income', population: 54027487 },
  { code: 'PHL', name: 'Philippines', region: 'WPRO', coverage: 74.5, incomeGroup: 'Lower middle income', population: 115559009 },
  { code: 'ZAF', name: 'South Africa', region: 'AFRO', coverage: 78.6, incomeGroup: 'Upper middle income', population: 59893885 },
  { code: 'VNM', name: 'Vietnam', region: 'WPRO', coverage: 92.5, incomeGroup: 'Lower middle income', population: 98186856 },
  { code: 'DEU', name: 'Germany', region: 'EURO', coverage: 97.4, incomeGroup: 'High income', population: 83797985 },
  { code: 'USA', name: 'United States', region: 'AMRO', coverage: 94.6, incomeGroup: 'High income', population: 338289857 },
  { code: 'GBR', name: 'United Kingdom', region: 'EURO', coverage: 95.8, incomeGroup: 'High income', population: 67508936 },
  { code: 'EGY', name: 'Egypt', region: 'EMRO', coverage: 91.2, incomeGroup: 'Lower middle income', population: 110990103 },
  { code: 'MEX', name: 'Mexico', region: 'AMRO', coverage: 86.4, incomeGroup: 'Upper middle income', population: 127504125 },
  { code: 'UGA', name: 'Uganda', region: 'AFRO', coverage: 76.8, incomeGroup: 'Low income', population: 47249585 },
  { code: 'COL', name: 'Colombia', region: 'AMRO', coverage: 88.9, incomeGroup: 'Upper middle income', population: 51874024 }
];

export const GeographicMapChart: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');
  const navigate = useNavigate();

  const regions = [
    { id: 'ALL', label: 'All Regions' },
    { id: 'AFRO', label: 'Africa (AFRO)' },
    { id: 'AMRO', label: 'Americas (AMRO)' },
    { id: 'EMRO', label: 'Eastern Med (EMRO)' },
    { id: 'EURO', label: 'Europe (EURO)' },
    { id: 'SEARO', label: 'SE Asia (SEARO)' },
    { id: 'WPRO', label: 'W Pacific (WPRO)' }
  ];

  const filteredCountries = selectedRegion === 'ALL'
    ? COUNTRY_SAMPLE_DATA
    : COUNTRY_SAMPLE_DATA.filter(c => c.region === selectedRegion);

  const getCoverageBarColor = (cov: number) => {
    if (cov >= 90) return 'bg-[#0d7a68]';
    if (cov >= 70) return 'bg-[#f59e0b]';
    return 'bg-[#e11d48]';
  };

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          <Globe2 className="w-4 h-4 text-[#0d7a68]" />
          <span>National Immunization Coverage Matrix &amp; Drill-Down</span>
        </div>

        {/* Region Pills */}
        <div className="flex flex-wrap items-center gap-1 bg-[#f0faf7] p-1 rounded-xl border border-[#d8ebe4]">
          {regions.map(r => (
            <button
              key={r.id}
              onClick={() => setSelectedRegion(r.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedRegion === r.id
                  ? 'bg-[#0d7a68] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of country cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredCountries.map((country) => {
          const barColorClass = getCoverageBarColor(country.coverage);
          const riskLevel = country.coverage >= 90 ? 'TARGET_ACHIEVED' : country.coverage >= 70 ? 'MEDIUM' : 'HIGH';

          return (
            <div
              key={country.code}
              onClick={() => navigate(`/countries?code=${country.code}`)}
              className="p-3.5 rounded-xl border border-[#e1efe9] bg-white hover:border-[#a3e9d4] hover:shadow-card-hover transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-[#f0faf7] text-[#0d7a68] border border-[#d8ebe4]">
                    {country.code}
                  </span>
                  <span className="font-bold text-[#07362f] text-sm truncate max-w-[120px]">
                    {country.name}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0d7a68] transition-colors" />
              </div>

              <div className="flex items-baseline justify-between mt-3">
                <span className="text-xs text-slate-500 font-medium">{country.region}</span>
                <span className="font-mono font-bold text-lg text-[#07362f]">
                  {country.coverage}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-[#eef8f4] rounded-full h-1.5 mt-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${barColorClass}`}
                  style={{ width: `${Math.min(100, country.coverage)}%` }}
                />
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[110px]">{country.incomeGroup}</span>
                <RiskBadge level={riskLevel} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend & Stats Banner */}
      <div className="p-3 bg-[#f0faf7] rounded-xl border border-[#d8ebe4] flex flex-wrap items-center justify-between gap-4 text-xs font-medium">
        <div className="flex items-center gap-4">
          <span className="text-slate-400 uppercase tracking-wider text-[11px] font-bold">Coverage Tiers:</span>
          <div className="flex items-center gap-1.5 text-[#0d7a68]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d7a68] inline-block" />
            <span>≥90% (WHO Target Reached)</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span>70% - 89% (Medium / Lagging)</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>&lt;70% (High Vulnerability Risk)</span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500">
          Click any country tile to launch Country Analysis profile
        </span>
      </div>
    </div>
  );
};
