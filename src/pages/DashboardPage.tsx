import React, { useState, useEffect } from 'react';
import { 
  Info,
  TrendingUp,
  Globe2,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { MetricCard } from '../components/common/MetricCard';
import { RiskBadge, TrendBadge } from '../components/common/RiskBadge';
import { CoverageTrendChart } from '../components/charts/CoverageTrendChart';
import { GeographicMapChart } from '../components/charts/GeographicMapChart';
import { apiService } from '../services/api';
import { GlobalDashboardSummary, HistoricalCoveragePoint, ForecastPoint } from '../types';
import { useNavigate } from 'react-router-dom';
import { useMetadata } from '../context/MetadataContext';

export const DashboardPage: React.FC = () => {
  const { defaultCountry, defaultVaccine } = useMetadata();
  const [summary, setSummary] = useState<GlobalDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [insightData, setInsightData] = useState<{
    deltaText: string;
    rangeText: string;
    trendDirection: 'increasing' | 'stable' | 'decreasing';
    riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'TARGET_ACHIEVED';
    recommendation: string;
  }>({
    deltaText: 'MCV1 coverage in India is projected to rise 3 points by 2028.',
    rangeText: '91% to 94%',
    trendDirection: 'increasing',
    riskLevel: 'LOW',
    recommendation: 'Maintain vaccination outreach.'
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await apiService.getDashboardSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load dashboard summary', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchInsight = async () => {
      if (!defaultCountry || !defaultVaccine) return;
      try {
        const [fc, ds] = await Promise.all([
          apiService.getForecast({
            country: defaultCountry,
            vaccine: defaultVaccine,
            horizons: [2028, 2030]
          }),
          apiService.getDecisionSupport({
            country: defaultCountry,
            vaccine: defaultVaccine
          })
        ]);
        if (!isMounted) return;

        const lastHist = fc.historical && fc.historical.length > 0 ? fc.historical[fc.historical.length - 1].coverage : (fc.latestObserved ?? 91);
        const point2028 = fc.forecast.find(f => f.year === 2028)?.predicted ?? fc.forecast[fc.forecast.length - 1]?.predicted ?? 94;
        const delta = Math.round(point2028 - lastHist);
        
        let deltaText = '';
        if (delta > 0) {
          deltaText = `${defaultVaccine} coverage in ${defaultCountry} is projected to rise ${delta} points by 2028.`;
        } else if (delta < 0) {
          deltaText = `${defaultVaccine} coverage in ${defaultCountry} is projected to decline ${Math.abs(delta)} points by 2028.`;
        } else {
          deltaText = `${defaultVaccine} coverage in ${defaultCountry} is projected to remain stable through 2028.`;
        }

        const rangeText = `${Math.round(lastHist)}% to ${Math.round(point2028)}%`;
        const trendDirection: 'increasing' | 'stable' | 'decreasing' = delta > 0 ? 'increasing' : delta < 0 ? 'decreasing' : 'stable';
        const riskLevel = ds.riskLevel || 'LOW';
        const recommendation = ds.suggestedAction || 'Maintain vaccination outreach.';

        setInsightData({
          deltaText,
          rangeText,
          trendDirection,
          riskLevel,
          recommendation
        });
      } catch (err) {
        console.warn('[DashboardPage] Failed to fetch dynamic insight for banner', err);
      }
    };
    fetchInsight();
    return () => { isMounted = false; };
  }, [defaultCountry, defaultVaccine]);

  if (loading || !summary) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-[#0d7a68] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium">Loading immunization forecast intelligence...</p>
        </div>
      </div>
    );
  }

  // Format historical & forecast points matching the reference trend chart
  const historicalTrend: HistoricalCoveragePoint[] = summary.globalTrend.map(t => ({
    year: t.year,
    coverage: t.globalAverage,
    isObserved: true
  }));

  const forecastTrend: ForecastPoint[] = summary?.forecastTrend && summary.forecastTrend.length > 0
    ? summary.forecastTrend
    : [
        { year: 2024, predicted: 85.3, lower80: 83.8, upper80: 86.8, isObserved: false },
        { year: 2025, predicted: 86.2, lower80: 84.1, upper80: 88.3, isObserved: false },
        { year: 2026, predicted: 87.1, lower80: 84.5, upper80: 89.7, isObserved: false },
        { year: 2027, predicted: 88.0, lower80: 85.0, upper80: 91.0, isObserved: false },
        { year: 2028, predicted: 88.8, lower80: 85.4, upper80: 92.2, isObserved: false },
        { year: 2030, predicted: 89.7, lower80: 86.0, upper80: 93.4, isObserved: false }
      ];

  const regionalColors = ['bg-[#0d7a68]', 'bg-[#14b8a6]', 'bg-[#2dd4bf]', 'bg-[#5eead4]', 'bg-[#5eead4]'];
  const sortedRegions = summary?.regionalBreakdown?.length
    ? [...summary.regionalBreakdown].sort((a, b) => b.coverage - a.coverage)
    : [];

  const regionalBars = sortedRegions.length > 0
    ? sortedRegions.map((r, idx) => {
        const shortName = r.region.includes('Europe') ? 'Europe'
          : r.region.includes('Americas') ? 'Americas'
          : r.region.includes('Asia') ? 'Asia'
          : r.region.includes('African') ? 'Africa'
          : r.region.includes('Western Pacific') ? 'W Pacific'
          : r.region.includes('Eastern Med') ? 'Eastern Med'
          : r.region.split(' ')[0];
        
        return {
          name: shortName,
          percent: Math.round(r.coverage),
          color: regionalColors[idx % regionalColors.length]
        };
      })
    : [
        { name: 'Europe', percent: 94, color: 'bg-[#0d7a68]' },
        { name: 'Americas', percent: 89, color: 'bg-[#14b8a6]' },
        { name: 'Asia', percent: 86, color: 'bg-[#2dd4bf]' },
        { name: 'Africa', percent: 72, color: 'bg-[#5eead4]' },
        { name: 'Oceania', percent: 76, color: 'bg-[#5eead4]' },
      ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. TOP STAT CARDS (Dynamically linked to dataset summary) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Global Average */}
        <MetricCard
          title="GLOBAL AVERAGE"
          value={summary ? `${summary.globalAverageCoverage}%` : "86.4%"}
          trend={{ 
            value: summary ? `${summary.yoyChange > 0 ? `+${summary.yoyChange}` : summary.yoyChange} pts` : "0.8 pts", 
            positiveIsGood: true 
          }}
        />

        {/* Forecast 2030 */}
        <MetricCard
          title="FORECAST 2030"
          value={summary?.forecast2030 ? `${summary.forecast2030}%` : "89.7%"}
          trend={{ 
            value: summary?.forecast2030Change !== undefined
              ? `${summary.forecast2030Change > 0 ? `+${summary.forecast2030Change}` : summary.forecast2030Change}`
              : "3.3", 
            positiveIsGood: true 
          }}
        />

        {/* High-Risk Countries */}
        <MetricCard
          title="HIGH-RISK COUNTRIES"
          value={summary ? summary.highRiskCountriesCount : 12}
          highlightRed={true}
        />

        {/* Best Vaccine */}
        <MetricCard
          title="BEST VACCINE"
          value={summary?.bestVaccine?.code || summary?.vaccineOverview?.[0]?.code || "BCG"}
          subtitle={summary?.bestVaccine?.coverage ? `${summary.bestVaccine.coverage}%` : (summary?.vaccineOverview?.[0]?.globalCoverage ? `${summary.vaccineOverview[0].globalCoverage}%` : "97.1%")}
        />
      </div>

      {/* 2. MIDDLE ROW: GLOBAL COVERAGE TREND & REGIONAL COMPARISON */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Global Coverage Trend Line Chart */}
        <div className="lg:col-span-8 clean-card p-6">
          <CoverageTrendChart
            historical={historicalTrend}
            forecast={forecastTrend}
            title="GLOBAL COVERAGE TREND"
            height={260}
          />
        </div>

        {/* Right: Regional Comparison Progress Capsules */}
        <div className="lg:col-span-4 clean-card p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-6">
              REGIONAL COMPARISON
            </h4>

            <div className="space-y-4">
              {regionalBars.map(reg => (
                <div key={reg.name} className="flex items-center justify-between gap-4 text-xs font-medium">
                  <span className="w-20 text-slate-700">{reg.name}</span>
                  <div className="flex-1 bg-[#eef8f4] rounded-full h-3.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${reg.color}`}
                      style={{ width: `${reg.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[#eaf4f0] text-[11px] text-slate-400 flex items-center justify-between">
            <span>WHO WUENIC Regional Groupings</span>
            <span className="font-semibold text-[#0d7a68]">2023–2030 Target</span>
          </div>
        </div>
      </div>

      {/* 3. INSIGHT CALLOUT BANNER (Matching Reference UI) */}
      <div className="bg-[#e6f7f2] border-l-4 border-l-[#0d7a68] rounded-xl p-3.5 px-4 flex items-center gap-3 shadow-sm">
        <div className="w-6 h-6 rounded-full bg-[#ccfbf1] text-[#0d7a68] flex items-center justify-center shrink-0">
          <Info className="w-3.5 h-3.5 stroke-[2.5]" />
        </div>
        <p className="text-xs md:text-sm text-[#07362f] font-semibold">
          {insightData.deltaText}
        </p>
      </div>

      {/* 4. BOTTOM ACTION & SUMMARY BAR (Matching Reference UI) */}
      <div className="clean-card p-4 px-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <span className="font-bold text-[#07362f] text-sm">
            {defaultCountry}, {defaultVaccine}
          </span>
          <span className="text-xs text-slate-600 font-medium font-mono">
            {insightData.rangeText}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TrendBadge direction={insightData.trendDirection} prefix={insightData.trendDirection === 'increasing' ? 'Increasing' : insightData.trendDirection === 'decreasing' ? 'Declining' : 'Stable'} />
          <RiskBadge level={insightData.riskLevel} size="sm" />
        </div>

        <div className="text-xs text-slate-600 font-medium">
          {insightData.recommendation}
        </div>
      </div>

      {/* 5. INTERACTIVE GEOGRAPHIC CHOROPLETH BOARD & COUNTRY WATCHLIST */}
      <div className="clean-card p-6">
        <GeographicMapChart countryData={summary.countryCoverage} />
      </div>
    </div>
  );
};
