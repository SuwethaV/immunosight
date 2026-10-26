import {
  CountryMetadata,
  VaccineMetadata,
  ForecastResponse,
  ForecastRequest,
  ModelMetric,
  ExplainabilityData,
  DecisionSupportResult,
  BackendHealthResponse,
  GlobalDashboardSummary,
  CountryHistoryResponse,
  VaccineCoverageItem
} from '../types';
import {
  DEMO_COUNTRIES,
  DEMO_VACCINES,
  DEMO_AVAILABLE_HORIZONS,
  DEMO_GLOBAL_SUMMARY,
  DEMO_MODEL_COMPARISON,
  DEMO_EXPLAINABILITY_DATA,
  generateDemoForecast,
  getDemoDecisionSupport
} from '../data/demoData';
import { VACCINE_REFERENCE } from '../data/vaccineReference';
import { DEFAULT_THRESHOLDS } from '../config/thresholds.config';
import { buildDecisionSupport } from './decisionEngine';

class ApiService {
  private baseUrl: string;
  private cache: Map<string, any> = new Map();

  constructor() {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    this.baseUrl = (envUrl || 'http://localhost:8000').replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const targetUrl = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const method = (options?.method || 'GET').toUpperCase();

    // Check in-memory cache for GET requests
    if (method === 'GET' && this.cache.has(targetUrl)) {
      return this.cache.get(targetUrl) as T;
    }

    // 60-second timeout for Render free tier cold starts
    const timeoutMs = 60000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(options?.headers as Record<string, string> || {})
      };

      // Only send Content-Type when a request body exists
      if (options?.body) {
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
        headers
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json() as T;

      // Cache GET responses
      if (method === 'GET') {
        this.cache.set(targetUrl, data);
      }

      return data;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  /**
   * Health check endpoint: GET /health
   */
  public async checkHealth(): Promise<BackendHealthResponse> {
    try {
      const data = await this.request<{ status: string }>('/health');
      return {
        status: data.status === 'ok' ? 'online' : 'online',
        message: 'Backend connection active',
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.warn('[api] checkHealth failed, using fallback status', err);
      return {
        status: 'offline',
        message: 'Backend unreachable'
      };
    }
  }

  /**
   * Dataset metadata: GET /meta & GET /forecast (for region mapping)
   */
  public async getMetadata(): Promise<{
    countries: CountryMetadata[];
    vaccines: VaccineMetadata[];
    horizons: number[];
  }> {
    try {
      const meta = await this.request<{
        countries: string[];
        vaccines: string[];
        regions: string[];
        forecast_years: [number, number];
        backtest_years: number[];
        has_history: boolean;
      }>('/meta');

      // Fetch region mapping from forecast endpoint
      let regionMap: Map<string, string> = new Map();
      try {
        const fc = await this.request<{ data: { Country: string; UNICEF_Region?: string }[] }>(
          '/forecast?year_from=2030&year_to=2030&limit=50000'
        );
        if (fc?.data) {
          fc.data.forEach(d => {
            if (d.Country && d.UNICEF_Region) {
              regionMap.set(d.Country.toLowerCase(), d.UNICEF_Region);
            }
          });
        }
      } catch {
        // Non-blocking region map fallback
      }

      const countries: CountryMetadata[] = meta.countries.map(name => ({
        code: name,
        name,
        region: regionMap.get(name.toLowerCase()) || 'Global'
      }));

      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

      const vaccines: VaccineMetadata[] = meta.vaccines.map(name => {
        const normName = normalize(name);
        const refMatch = VACCINE_REFERENCE.find(ref => {
          const normRefCode = normalize(ref.code);
          const normRefName = normalize(ref.name);
          return normName === normRefCode ||
                 normName.includes(normRefCode) || normRefCode.includes(normName) ||
                 normName.includes(normRefName) || normRefName.includes(normName);
        });

        if (refMatch) {
          return {
            code: name,
            name,
            targetDisease: refMatch.targetDisease,
            recommendedAge: refMatch.recommendedAge,
            doses: refMatch.doses,
            whoTarget: refMatch.whoTarget,
            description: refMatch.description
          };
        }

        const isMeasles = /measles|mcv/i.test(name);
        return {
          code: name,
          name,
          targetDisease: '',
          recommendedAge: '',
          doses: 1,
          whoTarget: isMeasles ? 95 : 90,
          description: ''
        };
      });

      const minYear = meta.forecast_years?.[0] ?? 2024;
      const maxYear = meta.forecast_years?.[1] ?? 2030;
      const horizons = DEMO_AVAILABLE_HORIZONS.filter(h => h >= minYear && h <= maxYear);

      return {
        countries,
        vaccines,
        horizons: horizons.length > 0 ? horizons : DEMO_AVAILABLE_HORIZONS
      };
    } catch (err) {
      console.warn('[api] getMetadata failed, using demo data', err);
      return {
        countries: DEMO_COUNTRIES,
        vaccines: DEMO_VACCINES,
        horizons: DEMO_AVAILABLE_HORIZONS
      };
    }
  }

  /**
   * Historical series for a country: GET /historical?country=CODE
   */
  public async getHistorical(country: string): Promise<Record<string, { year: number; coverage: number }[]> | null> {
    try {
      return await this.request<Record<string, { year: number; coverage: number }[]>>(`/historical?country=${encodeURIComponent(country)}`);
    } catch (err) {
      console.warn('[api] getHistorical failed, returning null', err);
      return null;
    }
  }

  /**
   * Country multi-antigen history for CountryAnalysisPage: GET /series per vaccine & GET /backtest
   */
  public async getCountryHistory(
    country: string,
    vaccines: string[],
    startYear: number = 2000,
    endYear: number = 2023
  ): Promise<CountryHistoryResponse> {
    try {
      // Fetch series for each requested vaccine in parallel
      const seriesPromises = vaccines.map(v =>
        this.request<{
          country: string;
          vaccine: string;
          history: { Year: number; Coverage: number }[];
          backtest: { Year: number; Actual_Coverage: number }[];
        }>(`/series?country=${encodeURIComponent(country)}&vaccine=${encodeURIComponent(v)}`).catch(() => null)
      );

      // Fetch latest backtest comparison row for 2023
      const comparisonPromise = this.request<{
        data: { Vaccine: string; Actual_Coverage: number }[];
      }>(`/backtest?country=${encodeURIComponent(country)}&year_from=2023&year_to=2023&limit=100`).catch(() => ({ data: [] }));

      const [seriesResults, compRes] = await Promise.all([
        Promise.all(seriesPromises),
        comparisonPromise
      ]);

      // Build year-by-year map: Year -> { [vaccineCode]: coverage }
      const yearMap = new Map<number, { year: number; [vaccineCode: string]: number }>();
      for (let y = startYear; y <= endYear; y++) {
        yearMap.set(y, { year: y });
      }

      seriesResults.forEach((res, idx) => {
        if (!res) return;
        const vCode = vaccines[idx];
        const points = (res.history && res.history.length > 0)
          ? res.history.map(h => ({ year: h.Year, coverage: h.Coverage }))
          : (res.backtest && res.backtest.length > 0)
          ? res.backtest.map(b => ({ year: b.Year, coverage: b.Actual_Coverage }))
          : [];

        points.forEach(p => {
          if (p.year >= startYear && p.year <= endYear) {
            let row = yearMap.get(p.year);
            if (!row) {
              row = { year: p.year };
              yearMap.set(p.year, row);
            }
            row[vCode] = Math.round(p.coverage * 10) / 10;
          }
        });
      });

      const series = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

      // Latest comparison
      const latestComparison = (compRes?.data || []).map(row => {
        const isMeasles = /measles|mcv/i.test(row.Vaccine);
        return {
          code: row.Vaccine,
          name: row.Vaccine,
          coverage: Math.round(row.Actual_Coverage * 10) / 10,
          whoTarget: isMeasles ? 95 : 90
        };
      }).sort((a, b) => b.coverage - a.coverage);

      return { series, latestComparison };
    } catch (err) {
      console.warn('[api] getCountryHistory failed, using demo data', err);
      return { series: [], latestComparison: [] };
    }
  }

  /**
   * Vaccine cross-country coverage for VaccineAnalysisPage: GET /backtest (<=2023) or GET /forecast (>=2024)
   */
  public async getVaccineCoverage(vaccine: string, year: number): Promise<VaccineCoverageItem[]> {
    try {
      if (year <= 2023) {
        const res = await this.request<{
          data: { Country: string; UNICEF_Region?: string; Actual_Coverage: number }[];
        }>(`/backtest?vaccine=${encodeURIComponent(vaccine)}&year_from=${year}&year_to=${year}&limit=50000`);

        return (res?.data || []).map(row => ({
          code: row.Country,
          name: row.Country,
          region: row.UNICEF_Region || '',
          coverage: Math.round(row.Actual_Coverage * 10) / 10
        }));
      } else {
        const res = await this.request<{
          data: { Country: string; UNICEF_Region?: string; Predicted_Coverage: number }[];
        }>(`/forecast?vaccine=${encodeURIComponent(vaccine)}&year_from=${year}&year_to=${year}&limit=50000`);

        return (res?.data || []).map(row => ({
          code: row.Country,
          name: row.Country,
          region: row.UNICEF_Region || '',
          coverage: Math.round(row.Predicted_Coverage * 10) / 10
        }));
      }
    } catch (err) {
      console.warn('[api] getVaccineCoverage failed, using demo data', err);
      return [];
    }
  }

  /**
   * Global Dashboard summary: GET /summary, GET /forecast, GET /backtest
   */
  public async getDashboardSummary(): Promise<GlobalDashboardSummary> {
    try {
      const [summaryRes, forecastRes, backtestRes] = await Promise.all([
        this.request<{
          year: number;
          regions: { UNICEF_Region: string; mean_coverage: number; n_series: number }[];
        }>('/summary?year=2030'),
        this.request<{
          count: number;
          data: { Country: string; Vaccine: string; UNICEF_Region?: string; Year: number; Predicted_Coverage: number }[];
        }>('/forecast?limit=50000'),
        this.request<{
          count: number;
          data: { Country: string; Vaccine: string; Year: number; Actual_Coverage: number }[];
        }>('/backtest?limit=50000')
      ]);

      const backtestData = backtestRes?.data || [];
      const forecastData = forecastRes?.data || [];

      // Global Trend from backtest (2020-2023)
      const yearCoverageMap: Record<number, number[]> = {};
      backtestData.forEach(d => {
        if (!yearCoverageMap[d.Year]) yearCoverageMap[d.Year] = [];
        yearCoverageMap[d.Year].push(d.Actual_Coverage);
      });

      const sortedYears = Object.keys(yearCoverageMap).map(Number).sort((a, b) => a - b);
      const globalTrend = sortedYears.map(y => {
        const arr = yearCoverageMap[y];
        const avg = arr.reduce((acc, v) => acc + v, 0) / (arr.length || 1);
        return {
          year: y,
          globalAverage: Math.round(avg * 10) / 10
        };
      });

      const latestObservationYear = sortedYears[sortedYears.length - 1] ?? 2023;
      const prevObservationYear = sortedYears[sortedYears.length - 2] ?? 2022;

      const latestArr = yearCoverageMap[latestObservationYear] || [];
      const prevArr = yearCoverageMap[prevObservationYear] || [];

      const globalAverageCoverage = latestArr.length
        ? Math.round((latestArr.reduce((a, b) => a + b, 0) / latestArr.length) * 10) / 10
        : 86.4;

      const previousYearCoverage = prevArr.length
        ? Math.round((prevArr.reduce((a, b) => a + b, 0) / prevArr.length) * 10) / 10
        : Math.round((globalAverageCoverage - 0.8) * 10) / 10;

      const yoyChange = Math.round((globalAverageCoverage - previousYearCoverage) * 10) / 10;

      // Forecast trend (2024-2030)
      const forecastYearMap: Record<number, number[]> = {};
      forecastData.forEach(d => {
        if (!forecastYearMap[d.Year]) forecastYearMap[d.Year] = [];
        forecastYearMap[d.Year].push(d.Predicted_Coverage);
      });

      const forecastTrend = Object.keys(forecastYearMap).map(Number).sort((a, b) => a - b).map(y => {
        const arr = forecastYearMap[y];
        const avg = arr.reduce((acc, v) => acc + v, 0) / (arr.length || 1);
        return {
          year: y,
          predicted: Math.round(avg * 10) / 10,
          isObserved: false as const
        };
      });

      const arr2030 = forecastYearMap[2030] || [];
      const forecast2030 = arr2030.length
        ? Math.round((arr2030.reduce((a, b) => a + b, 0) / arr2030.length) * 10) / 10
        : 89.7;
      const forecast2030Change = Math.round((forecast2030 - globalAverageCoverage) * 10) / 10;

      // Region mapping from forecast rows
      const countryRegionMap: Record<string, string> = {};
      forecastData.forEach(d => {
        if (d.Country && d.UNICEF_Region && !countryRegionMap[d.Country]) {
          countryRegionMap[d.Country] = d.UNICEF_Region;
        }
      });

      // Country coverage in latest year
      const latestCountryMap: Record<string, number[]> = {};
      const latestVaccineMap: Record<string, number[]> = {};
      backtestData.filter(d => d.Year === latestObservationYear).forEach(d => {
        if (!latestCountryMap[d.Country]) latestCountryMap[d.Country] = [];
        latestCountryMap[d.Country].push(d.Actual_Coverage);

        if (!latestVaccineMap[d.Vaccine]) latestVaccineMap[d.Vaccine] = [];
        latestVaccineMap[d.Vaccine].push(d.Actual_Coverage);
      });

      const countryCoverage = Object.keys(latestCountryMap).map(country => {
        const arr = latestCountryMap[country];
        const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
        return {
          country,
          code: country,
          coverage: Math.round(avg * 10) / 10,
          region: countryRegionMap[country] || 'Global'
        };
      }).sort((a, b) => b.coverage - a.coverage);

      const highRiskCountriesCount = countryCoverage.filter(c => c.coverage < DEFAULT_THRESHOLDS.highRiskCoverage).length;
      const targetAchievedCountriesCount = countryCoverage.filter(c => c.coverage >= DEFAULT_THRESHOLDS.targetCoverage).length;

      const topCoverageCountries = countryCoverage.slice(0, 5);
      const lowestCoverageCountries = [...countryCoverage].reverse().slice(0, 5);

      // Best vaccine
      let bestVaccine = { code: 'BCG', coverage: 97.1 };
      let highestVaccineCov = -1;
      const vaccineOverview = Object.keys(latestVaccineMap).map(v => {
        const arr = latestVaccineMap[v];
        const avg = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10;
        if (avg > highestVaccineCov) {
          highestVaccineCov = avg;
          bestVaccine = { code: v, coverage: avg };
        }
        return {
          code: v,
          name: v,
          globalCoverage: avg,
          target: /measles|mcv/i.test(v) ? 95 : 90
        };
      }).sort((a, b) => b.globalCoverage - a.globalCoverage);

      // Regional breakdown from /summary
      const regionalBreakdown = (summaryRes?.regions || []).map(r => ({
        region: r.UNICEF_Region,
        coverage: Math.round(r.mean_coverage * 10) / 10,
        countries: r.n_series
      })).sort((a, b) => b.coverage - a.coverage);

      return {
        globalAverageCoverage,
        previousYearCoverage,
        yoyChange,
        totalCountriesCount: countryCoverage.length || 194,
        totalVaccinesCount: vaccineOverview.length || 11,
        latestObservationYear,
        forecastHorizonRange: `${latestObservationYear + 1} - 2030`,
        highRiskCountriesCount,
        targetAchievedCountriesCount,
        globalTrend,
        topCoverageCountries,
        lowestCoverageCountries,
        regionalBreakdown,
        vaccineOverview: vaccineOverview.length ? vaccineOverview : DEMO_GLOBAL_SUMMARY.vaccineOverview,
        isDemo: false,
        forecastTrend,
        forecast2030,
        forecast2030Change,
        bestVaccine,
        countryCoverage
      };
    } catch (err) {
      console.warn('[api] getDashboardSummary failed, using demo data', err);
      return {
        ...DEMO_GLOBAL_SUMMARY,
        isDemo: true
      };
    }
  }

  /**
   * Model Forecast: GET /series
   */
  public async getForecast(req: ForecastRequest): Promise<ForecastResponse> {
    try {
      const res = await this.request<{
        country: string;
        vaccine: string;
        history: { Year: number; Coverage: number }[];
        backtest: {
          Year: number;
          Actual_Coverage: number;
          TFT_Predicted_Coverage: number;
          Persistence_Predicted_Coverage: number;
          Absolute_Error: number;
          Persistence_Absolute_Error: number;
        }[];
        forecast: {
          Country?: string;
          Vaccine?: string;
          Year: number;
          Predicted_Coverage: number;
        }[];
      }>(`/series?country=${encodeURIComponent(req.country)}&vaccine=${encodeURIComponent(req.vaccine)}`);

      // 1. Build historical observations
      let historical = (res.history && res.history.length > 0)
        ? res.history.map(h => ({ year: h.Year, coverage: Math.round(h.Coverage * 10) / 10, isObserved: true as const }))
        : (res.backtest && res.backtest.length > 0)
        ? res.backtest.map(b => ({ year: b.Year, coverage: Math.round(b.Actual_Coverage * 10) / 10, isObserved: true as const }))
        : [];

      historical = historical.sort((a, b) => a.year - b.year);

      const latestHist = historical[historical.length - 1];
      const latestObserved = latestHist ? latestHist.coverage : 80.0;
      const latestYear = latestHist ? latestHist.year : 2023;

      const targetHorizonYear = Math.max(...req.horizons);

      // 2. Compute backtest-calibrated uncertainty factor q:
      // q = 80th percentile of |Actual_Coverage - TFT_Predicted_Coverage| over backtest rows (fallback 3.0 if < 3 rows)
      let q = 3.0;
      if (res.backtest && res.backtest.length >= 3) {
        const errors = res.backtest
          .map(b => Math.abs(b.Actual_Coverage - b.TFT_Predicted_Coverage))
          .filter(e => typeof e === 'number' && !isNaN(e))
          .sort((a, b) => a - b);

        if (errors.length >= 3) {
          const idx = Math.min(errors.length - 1, Math.max(0, Math.floor(errors.length * 0.8)));
          q = errors[idx] ?? 3.0;
        }
      }

      // 3. Filter forecast rows with Year <= max(req.horizons)
      const rawForecast = (res.forecast || [])
        .filter(f => f.Year <= targetHorizonYear)
        .sort((a, b) => a.Year - b.Year);

      const forecast = rawForecast.map(f => {
        const predicted = Math.round(f.Predicted_Coverage * 10) / 10;
        const h = Math.max(1, f.Year - latestYear);
        const lower80 = Math.max(0, Math.min(100, Math.round((predicted - q * Math.sqrt(h)) * 10) / 10));
        const upper80 = Math.max(0, Math.min(100, Math.round((predicted + q * Math.sqrt(h)) * 10) / 10));
        const lower95 = Math.max(0, Math.min(100, Math.round((predicted - q * Math.sqrt(h) * 1.53) * 10) / 10));
        const upper95 = Math.max(0, Math.min(100, Math.round((predicted + q * Math.sqrt(h) * 1.53) * 10) / 10));

        return {
          year: f.Year,
          predicted,
          lower80,
          upper80,
          lower95,
          upper95,
          isObserved: false as const
        };
      });

      const targetPoint = forecast.find(f => f.year === targetHorizonYear) || forecast[forecast.length - 1];
      const predictedCoverage = targetPoint ? targetPoint.predicted : latestObserved;
      const absoluteChange = Math.round((predictedCoverage - latestObserved) * 10) / 10;
      const direction = absoluteChange > 0.5 ? 'increasing' : absoluteChange < -0.5 ? 'decreasing' : 'stable';

      return {
        country: req.country,
        countryName: req.country,
        vaccine: req.vaccine,
        vaccineName: req.vaccine,
        latestYear,
        latestObserved,
        targetHorizonYear,
        predictedCoverage,
        absoluteChange,
        direction,
        historical,
        forecast,
        modelUsed: 'Temporal Fusion Transformer (TFT) ensemble',
        generatedAt: new Date().toISOString(),
        isDemo: false
      };
    } catch (err) {
      console.warn('[api] getForecast failed, using demo data', err);
      const maxHorizon = Math.max(...req.horizons);
      return {
        ...generateDemoForecast(req.country, req.vaccine, maxHorizon),
        isDemo: true
      };
    }
  }

  /**
   * Model Comparison metrics: GET /metrics
   */
  public async getModelComparison(): Promise<{ metrics: ModelMetric[] }> {
    try {
      const rows = await this.request<any[]>('/metrics');

      const getSlug = (name: string) => {
        const low = name.toLowerCase();
        if (low.includes('persistence')) return 'persistence';
        if (low.includes('linear')) return 'linear';
        if (low.includes('random') || low.includes('rf')) return 'rf';
        if (low.includes('xgboost')) return 'xgboost';
        if (low.includes('lstm')) return 'lstm';
        if (low.includes('transformer') || low.includes('tft')) return 'tft';
        return low.replace(/[^a-z0-9]/g, '_');
      };

      const getCategory = (name: string): ModelMetric['category'] => {
        const low = name.toLowerCase();
        if (low.includes('persistence') || low.includes('linear')) return 'Baseline';
        if (low.includes('random') || low.includes('xgboost')) return 'Classical ML';
        if (low.includes('lstm')) return 'Deep Learning';
        if (low.includes('transformer') || low.includes('tft')) return 'Advanced Attention (Proposed)';
        return 'Classical ML';
      };

      const getNotes = (name: string) => {
        const low = name.toLowerCase();
        if (low.includes('tft') || low.includes('transformer')) return 'Proposed architecture with multi-horizon self-attention and quantile loss.';
        if (low.includes('lstm')) return 'Standard recurrent baseline.';
        if (low.includes('xgboost')) return 'Gradient boosted decision trees baseline.';
        if (low.includes('random')) return 'Random Forest ensemble baseline.';
        if (low.includes('linear')) return 'Parametric linear regression reference baseline.';
        if (low.includes('persistence')) return 'Naive persistence baseline carrying forward last observed value.';
        return 'Comparative benchmark model.';
      };

      const parsed: ModelMetric[] = rows.map(r => ({
        modelId: getSlug(r.Model || ''),
        modelName: r.Model || '',
        category: getCategory(r.Model || ''),
        rmse: Math.round((Number(r.RMSE) || 0) * 100) / 100,
        mae: Math.round((Number(r.MAE) || 0) * 100) / 100,
        mape: Math.round((Number(r.MAPE) || 0) * 100) / 100,
        smape: Math.round((Number(r.SMAPE) || 0) * 100) / 100,
        r2: Math.round((Number(r.R2) || 0) * 1000) / 1000,
        trainingTimeSec: 0,
        supportsIntervals: false,
        supportsInterpretability: /transformer|tft/i.test(r.Model || ''),
        notes: getNotes(r.Model || ''),
        accuracy: r.Accuracy !== undefined ? Math.round(Number(r.Accuracy) * 100) / 100 : undefined,
        within5pp: r.Within_5pp !== undefined ? Math.round(Number(r.Within_5pp) * 100) / 100 : undefined,
        isBest: {}
      }));

      // Find best values
      const minRmse = Math.min(...parsed.map(m => m.rmse));
      const minMae = Math.min(...parsed.map(m => m.mae));
      const minMape = Math.min(...parsed.map(m => m.mape));
      const minSmape = Math.min(...parsed.map(m => m.smape));
      const maxR2 = Math.max(...parsed.map(m => m.r2));

      parsed.forEach(m => {
        m.isBest = {
          rmse: m.rmse === minRmse,
          mae: m.mae === minMae,
          mape: m.mape === minMape,
          smape: m.smape === minSmape,
          r2: m.r2 === maxR2
        };
      });

      return { metrics: parsed };
    } catch (err) {
      console.warn('[api] getModelComparison failed, using demo data', err);
      return { metrics: DEMO_MODEL_COMPARISON };
    }
  }

  /**
   * Model Explainability: POST /explainability
   * Note: The backend model deployment does not currently output attention weights or VSN scores.
   * Uses demo explainability data as fallback.
   */
  public async getExplainability(params: { country: string; vaccine: string }): Promise<ExplainabilityData> {
    // TODO: Backend does not supply explainability/attention weights yet.
    console.warn('[api] getExplainability not supported by backend, using demo data');
    return {
      ...DEMO_EXPLAINABILITY_DATA,
      country: params.country,
      vaccine: params.vaccine,
      isDemo: true
    };
  }

  /**
   * Decision Support: Evaluated via buildDecisionSupport on forecast results
   */
  public async getDecisionSupport(params: { country: string; vaccine: string }): Promise<DecisionSupportResult> {
    try {
      const forecast = await this.getForecast({
        country: params.country,
        vaccine: params.vaccine,
        horizons: [2028]
      });

      return buildDecisionSupport(forecast, DEFAULT_THRESHOLDS);
    } catch (err) {
      console.warn('[api] getDecisionSupport failed, using demo data', err);
      return getDemoDecisionSupport(params.country, params.vaccine);
    }
  }
}

export const apiService = new ApiService();

