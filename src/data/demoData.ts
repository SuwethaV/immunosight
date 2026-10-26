import { 
  CountryMetadata, 
  VaccineMetadata, 
  GlobalDashboardSummary, 
  ModelMetric, 
  ExplainabilityData, 
  DecisionSupportResult,
  ForecastResponse,
  HistoricalCoveragePoint,
  ForecastPoint
} from '../types';
import { VACCINE_REFERENCE } from './vaccineReference';
import { DEFAULT_THRESHOLDS } from '../config/thresholds.config';

/**
 * DEMO DATASET NOTICE:
 * This module contains synthetic demonstration data calibrated against WHO/UNICEF WUENIC patterns.
 * It is completely isolated and used ONLY when Demo Mode is active or when the FastAPI backend is offline.
 * Every object returned here explicitly carries the `isDemo: true` flag.
 */
export const IS_DEMO_DATA = true;

export const DEMO_COUNTRIES: CountryMetadata[] = [
  { code: 'NGA', name: 'Nigeria', region: 'African Region (AFRO)', incomeGroup: 'Lower middle income', population: 218541212, dataCompleteness: 94, missingYearsCount: 1 },
  { code: 'IND', name: 'India', region: 'South-East Asia Region (SEARO)', incomeGroup: 'Lower middle income', population: 1417173173, dataCompleteness: 98, missingYearsCount: 0 },
  { code: 'ETH', name: 'Ethiopia', region: 'African Region (AFRO)', incomeGroup: 'Low income', population: 123379924, dataCompleteness: 91, missingYearsCount: 2 },
  { code: 'COD', name: 'Dem. Rep. Congo', region: 'African Region (AFRO)', incomeGroup: 'Low income', population: 99010212, dataCompleteness: 88, missingYearsCount: 3 },
  { code: 'PAK', name: 'Pakistan', region: 'Eastern Mediterranean (EMRO)', incomeGroup: 'Lower middle income', population: 235824862, dataCompleteness: 95, missingYearsCount: 1 },
  { code: 'IDN', name: 'Indonesia', region: 'South-East Asia Region (SEARO)', incomeGroup: 'Upper middle income', population: 275501339, dataCompleteness: 96, missingYearsCount: 1 },
  { code: 'BRA', name: 'Brazil', region: 'Region of the Americas (AMRO)', incomeGroup: 'Upper middle income', population: 215313498, dataCompleteness: 99, missingYearsCount: 0 },
  { code: 'AFG', name: 'Afghanistan', region: 'Eastern Mediterranean (EMRO)', incomeGroup: 'Low income', population: 41128771, dataCompleteness: 86, missingYearsCount: 3 },
  { code: 'BGD', name: 'Bangladesh', region: 'South-East Asia Region (SEARO)', incomeGroup: 'Lower middle income', population: 171186372, dataCompleteness: 97, missingYearsCount: 1 },
  { code: 'KEN', name: 'Kenya', region: 'African Region (AFRO)', incomeGroup: 'Lower middle income', population: 54027487, dataCompleteness: 96, missingYearsCount: 1 },
  { code: 'PHL', name: 'Philippines', region: 'Western Pacific (WPRO)', incomeGroup: 'Lower middle income', population: 115559009, dataCompleteness: 93, missingYearsCount: 2 },
  { code: 'ZAF', name: 'South Africa', region: 'African Region (AFRO)', incomeGroup: 'Upper middle income', population: 59893885, dataCompleteness: 98, missingYearsCount: 0 },
  { code: 'VNM', name: 'Vietnam', region: 'Western Pacific (WPRO)', incomeGroup: 'Lower middle income', population: 98186856, dataCompleteness: 96, missingYearsCount: 1 },
  { code: 'DEU', name: 'Germany', region: 'European Region (EURO)', incomeGroup: 'High income', population: 83797985, dataCompleteness: 100, missingYearsCount: 0 },
  { code: 'USA', name: 'United States', region: 'Region of the Americas (AMRO)', incomeGroup: 'High income', population: 338289857, dataCompleteness: 100, missingYearsCount: 0 },
  { code: 'GBR', name: 'United Kingdom', region: 'European Region (EURO)', incomeGroup: 'High income', population: 67508936, dataCompleteness: 100, missingYearsCount: 0 },
  { code: 'EGY', name: 'Egypt', region: 'Eastern Mediterranean (EMRO)', incomeGroup: 'Lower middle income', population: 110990103, dataCompleteness: 97, missingYearsCount: 1 },
  { code: 'MEX', name: 'Mexico', region: 'Region of the Americas (AMRO)', incomeGroup: 'Upper middle income', population: 127504125, dataCompleteness: 98, missingYearsCount: 0 },
  { code: 'UGA', name: 'Uganda', region: 'African Region (AFRO)', incomeGroup: 'Low income', population: 47249585, dataCompleteness: 92, missingYearsCount: 2 },
  { code: 'COL', name: 'Colombia', region: 'Region of the Americas (AMRO)', incomeGroup: 'Upper middle income', population: 51874024, dataCompleteness: 97, missingYearsCount: 1 }
];

export const DEMO_VACCINES: VaccineMetadata[] = VACCINE_REFERENCE;

export const DEMO_AVAILABLE_HORIZONS = [2024, 2025, 2026, 2027, 2028, 2030];

// Baseline generator for historical data
function generateHistoricalTrajectory(countryCode: string, vaccineCode: string): HistoricalCoveragePoint[] {
  // Deterministic seed based on string hash
  let seed = 0;
  for (let i = 0; i < countryCode.length; i++) seed += countryCode.charCodeAt(i);
  for (let i = 0; i < vaccineCode.length; i++) seed += vaccineCode.charCodeAt(i);

  const baseCoverage = 45 + (seed % 45); // between 45 and 90
  const history: HistoricalCoveragePoint[] = [];

  for (let year = 2000; year <= 2023; year++) {
    const t = year - 2000;
    // General upward progress over 20 years
    let progress = Math.sin(t / 4) * 3 + (t * 0.9);
    // COVID disruption dip in 2020-2021
    if (year === 2020) progress -= 4.5;
    if (year === 2021) progress -= 3.8;
    if (year === 2022) progress -= 1.2;

    let cov = Math.round((baseCoverage + progress + ((seed * year) % 5 - 2.5)) * 10) / 10;
    if (cov > 99) cov = 99;
    if (cov < 25) cov = 25;

    history.push({
      year,
      coverage: cov,
      isObserved: true,
      dataSource: 'WHO/UNICEF WUENIC Standardized'
    });
  }
  return history;
}

// Generate realistic future forecast using TFT characteristics
export function generateDemoForecast(countryCode: string, vaccineCode: string, horizonYear: number): ForecastResponse {
  const country = DEMO_COUNTRIES.find(c => c.code === countryCode) || DEMO_COUNTRIES[0];
  const vaccine = DEMO_VACCINES.find(v => v.code === vaccineCode) || DEMO_VACCINES[0];
  const historical = generateHistoricalTrajectory(countryCode, vaccineCode);
  const latestPoint = historical[historical.length - 1];

  const forecast: ForecastPoint[] = [];
  const years = [2024, 2025, 2026, 2027, 2028, 2029, 2030].filter(y => y <= horizonYear);

  let prevCoverage = latestPoint.coverage;
  const isDeveloping = country.incomeGroup === 'Low income' || country.incomeGroup === 'Lower middle income';
  const growthRate = isDeveloping ? 0.9 : 0.3;

  for (const year of years) {
    const deltaYears = year - 2023;
    const uncertaintyBand = deltaYears * 1.6; // TFT expands prediction intervals with horizon
    let pred = Math.round((prevCoverage + growthRate * deltaYears + (Math.sin(deltaYears) * 0.4)) * 10) / 10;
    if (pred > 98) pred = 98;
    if (pred < 20) pred = 20;

    const lower80 = Math.max(15, Math.round((pred - uncertaintyBand * 1.28) * 10) / 10);
    const upper80 = Math.min(99, Math.round((pred + uncertaintyBand * 1.28) * 10) / 10);
    const lower95 = Math.max(10, Math.round((pred - uncertaintyBand * 1.96) * 10) / 10);
    const upper95 = Math.min(100, Math.round((pred + uncertaintyBand * 1.96) * 10) / 10);

    forecast.push({
      year,
      predicted: pred,
      lower80,
      upper80,
      lower95,
      upper95,
      isObserved: false
    });
  }

  const targetForecastPoint = forecast[forecast.length - 1] || { predicted: latestPoint.coverage, year: horizonYear };
  const change = Math.round((targetForecastPoint.predicted - latestPoint.coverage) * 10) / 10;
  
  let direction: 'increasing' | 'stable' | 'decreasing' = 'stable';
  if (change > 0.5) direction = 'increasing';
  else if (change < -0.5) direction = 'decreasing';

  return {
    country: country.code,
    countryName: country.name,
    vaccine: vaccine.code,
    vaccineName: vaccine.name,
    latestYear: 2023,
    latestObserved: latestPoint.coverage,
    targetHorizonYear: horizonYear,
    predictedCoverage: targetForecastPoint.predicted,
    absoluteChange: change,
    direction,
    historical,
    forecast,
    modelUsed: 'Temporal Fusion Transformer (TFT) with Quantile Regression',
    generatedAt: new Date().toISOString(),
    isDemo: true
  };
}

export const DEMO_GLOBAL_SUMMARY: GlobalDashboardSummary = {
  globalAverageCoverage: 84.2,
  previousYearCoverage: 83.1,
  yoyChange: +1.1,
  totalCountriesCount: 194,
  totalVaccinesCount: 11,
  latestObservationYear: 2023,
  forecastHorizonRange: '2024 - 2030',
  highRiskCountriesCount: 38,
  targetAchievedCountriesCount: 64,
  globalTrend: [
    { year: 2010, globalAverage: 82.5, lowIncome: 65.2, highIncome: 94.8 },
    { year: 2012, globalAverage: 83.2, lowIncome: 67.1, highIncome: 95.1 },
    { year: 2014, globalAverage: 84.0, lowIncome: 69.4, highIncome: 95.3 },
    { year: 2016, globalAverage: 84.8, lowIncome: 70.8, highIncome: 95.0 },
    { year: 2018, globalAverage: 85.5, lowIncome: 72.3, highIncome: 95.2 },
    { year: 2019, globalAverage: 86.0, lowIncome: 73.1, highIncome: 95.4 },
    { year: 2020, globalAverage: 82.8, lowIncome: 68.9, highIncome: 93.8 }, // COVID dip
    { year: 2021, globalAverage: 81.9, lowIncome: 67.4, highIncome: 93.5 },
    { year: 2022, globalAverage: 83.1, lowIncome: 69.2, highIncome: 94.2 },
    { year: 2023, globalAverage: 84.2, lowIncome: 71.0, highIncome: 94.7 },
  ],
  topCoverageCountries: [
    { country: 'Germany', code: 'DEU', coverage: 97.4, region: 'EURO' },
    { country: 'United Kingdom', code: 'GBR', coverage: 95.8, region: 'EURO' },
    { country: 'United States', code: 'USA', coverage: 94.6, region: 'AMRO' },
    { country: 'Bangladesh', code: 'BGD', coverage: 93.8, region: 'SEARO' },
    { country: 'Vietnam', code: 'VNM', coverage: 92.5, region: 'WPRO' }
  ],
  lowestCoverageCountries: [
    { country: 'Afghanistan', code: 'AFG', coverage: 56.4, region: 'EMRO' },
    { country: 'Dem. Rep. Congo', code: 'COD', coverage: 58.2, region: 'AFRO' },
    { country: 'Nigeria', code: 'NGA', coverage: 62.1, region: 'AFRO' },
    { country: 'Ethiopia', code: 'ETH', coverage: 65.5, region: 'AFRO' },
    { country: 'Pakistan', code: 'PAK', coverage: 71.2, region: 'EMRO' }
  ],
  regionalBreakdown: [
    { region: 'European Region (EURO)', coverage: 95.2, countries: 53, trend: 'stable' },
    { region: 'Region of the Americas (AMRO)', coverage: 89.4, countries: 35, trend: 'increasing' },
    { region: 'Western Pacific (WPRO)', coverage: 91.1, countries: 27, trend: 'increasing' },
    { region: 'South-East Asia (SEARO)', coverage: 87.3, countries: 11, trend: 'increasing' },
    { region: 'Eastern Mediterranean (EMRO)', coverage: 79.8, countries: 21, trend: 'stable' },
    { region: 'African Region (AFRO)', coverage: 71.6, countries: 47, trend: 'increasing' },
  ],
  vaccineOverview: [
    { code: 'BCG', name: 'BCG (Tuberculosis)', globalCoverage: 88.5, target: 90 },
    { code: 'DTP3', name: 'DTP3 (Diphtheria-Tetanus-Pertussis)', globalCoverage: 84.2, target: 90 },
    { code: 'MCV1', name: 'MCV1 (Measles 1st Dose)', globalCoverage: 83.1, target: 95 },
    { code: 'Pol3', name: 'Pol3 (Polio 3rd Dose)', globalCoverage: 84.0, target: 90 },
    { code: 'HepB3', name: 'HepB3 (Hepatitis B 3rd Dose)', globalCoverage: 83.8, target: 90 },
    { code: 'PCV3', name: 'PCV3 (Pneumococcal 3rd Dose)', globalCoverage: 65.2, target: 90 },
    { code: 'RotaC', name: 'RotaC (Rotavirus Complete)', globalCoverage: 55.4, target: 90 },
  ],
  isDemo: true
};

export const DEMO_MODEL_COMPARISON: ModelMetric[] = [
  {
    modelId: 'tft',
    modelName: 'Temporal Fusion Transformer (TFT)',
    category: 'Advanced Attention (Proposed)',
    rmse: 2.41,
    mae: 1.82,
    mape: 3.12,
    smape: 3.05,
    r2: 0.941,
    trainingTimeSec: 420,
    supportsIntervals: true,
    supportsInterpretability: true,
    notes: 'Proposed deep architecture; leverages multi-horizon self-attention, variable selection networks, and quantile loss for prediction intervals.',
    isBest: {
      rmse: true,
      mae: true,
      mape: true,
      smape: true,
      r2: true,
    }
  },
  {
    modelId: 'lstm',
    modelName: 'LSTM Recurrent Neural Network',
    category: 'Deep Learning',
    rmse: 3.84,
    mae: 2.91,
    mape: 5.24,
    smape: 5.10,
    r2: 0.862,
    trainingTimeSec: 180,
    supportsIntervals: false,
    supportsInterpretability: false,
    notes: 'Standard recurrent baseline; captures sequential dependencies but struggles with long-range covariate interactions and lacks intrinsic explainability.',
    isBest: {}
  },
  {
    modelId: 'xgboost',
    modelName: 'XGBoost Regressor',
    category: 'Classical ML',
    rmse: 3.25,
    mae: 2.45,
    mape: 4.38,
    smape: 4.29,
    r2: 0.898,
    trainingTimeSec: 25,
    supportsIntervals: false,
    supportsInterpretability: true,
    notes: 'Strong tabular gradient boosting baseline; relies on manually engineered lag features without explicit temporal sequence inductive bias.',
    isBest: {}
  },
  {
    modelId: 'random_forest',
    modelName: 'Random Forest Regressor',
    category: 'Classical ML',
    rmse: 4.12,
    mae: 3.18,
    mape: 5.82,
    smape: 5.71,
    r2: 0.835,
    trainingTimeSec: 15,
    supportsIntervals: false,
    supportsInterpretability: true,
    notes: 'Non-linear ensemble; fast training, but suffers from extrapolation limits outside historical coverage ranges.',
    isBest: {}
  },
  {
    modelId: 'linear_regression',
    modelName: 'Linear Regression (Baseline)',
    category: 'Baseline',
    rmse: 6.78,
    mae: 5.20,
    mape: 9.65,
    smape: 9.42,
    r2: 0.612,
    trainingTimeSec: 2,
    supportsIntervals: true,
    supportsInterpretability: true,
    notes: 'Parametric reference baseline; fails to capture pandemic disruptions, structural breaks, and nonlinear regional saturation curves.',
    isBest: {}
  }
];

export const DEMO_EXPLAINABILITY_DATA: ExplainabilityData = {
  country: 'NGA',
  vaccine: 'DTP3',
  model: 'Temporal Fusion Transformer (TFT)',
  featureImportance: [
    {
      feature: 'historical_coverage_lag_1',
      displayName: 'Coverage Lag (t - 1)',
      importance: 0.285,
      category: 'Time-Varying Observed',
      description: 'Most immediate antecedent immunization coverage level in the preceding observation year.'
    },
    {
      feature: 'income_group_static',
      displayName: 'Country Income Classification',
      importance: 0.192,
      category: 'Static Covariates',
      description: 'Macro-economic World Bank tier reflecting national health financing and institutional capacity.'
    },
    {
      feature: 'who_region_code',
      displayName: 'WHO Geographic Region',
      importance: 0.145,
      category: 'Static Covariates',
      description: 'Regional epidemiological clustering, shared cross-border programs, and supply logistics.'
    },
    {
      feature: 'historical_coverage_lag_2',
      displayName: 'Coverage Lag (t - 2)',
      importance: 0.128,
      category: 'Time-Varying Observed',
      description: 'Two-year retrospective momentum indicator capturing lingering programmatic shifts.'
    },
    {
      feature: 'gdp_per_capita_growth',
      displayName: 'Per-Capita GDP Trend',
      importance: 0.094,
      category: 'Time-Varying Observed',
      description: 'Economic fluctuation influencing local primary healthcare expenditure.'
    },
    {
      feature: 'calendar_year',
      displayName: 'Forecast Target Horizon Year',
      importance: 0.082,
      category: 'Time-Varying Known',
      description: 'Known temporal horizon index encoding secular global technological improvements.'
    },
    {
      feature: 'national_target_flag',
      displayName: 'Target Coverage Schedule',
      importance: 0.074,
      category: 'Time-Varying Known',
      description: 'Government policy target milestones for immunization acceleration.'
    }
  ],
  temporalAttention: [
    { lagYear: 2023, relativeLag: 'Lag t-1 (2023)', weight: 0.34, eventContext: 'Latest post-COVID recovery baseline' },
    { lagYear: 2022, relativeLag: 'Lag t-2 (2022)', weight: 0.22, eventContext: 'Early rebound from lockdown interruptions' },
    { lagYear: 2020, relativeLag: 'Lag t-4 (2020)', weight: 0.19, eventContext: 'COVID-19 pandemic global service disruption' },
    { lagYear: 2021, relativeLag: 'Lag t-3 (2021)', weight: 0.12, eventContext: 'Secondary supply chain bottlenecks' },
    { lagYear: 2019, relativeLag: 'Lag t-5 (2019)', weight: 0.08, eventContext: 'Pre-pandemic structural baseline' },
    { lagYear: 2015, relativeLag: 'Lag t-9 (2015)', weight: 0.05, eventContext: 'Historical baseline anchor' },
  ],
  decoderAttention: [
    { horizon: 1, year: 2024, weight: 0.45 },
    { horizon: 2, year: 2025, weight: 0.25 },
    { horizon: 3, year: 2026, weight: 0.15 },
    { horizon: 4, year: 2027, weight: 0.09 },
    { horizon: 5, year: 2028, weight: 0.06 },
  ],
  summaryNarrative: 'The TFT model places 28.5% of its internal attention on immediate 1-year coverage inertia, while using country income group as the primary static normalizer. Crucially, multi-head self-attention reveals high temporal attention weight (0.19) directed at the 2020 pandemic anomaly, allowing the model to adaptively discount severe non-routine interruptions without permanently degrading long-term growth trajectories.',
  isDemo: true
};

export function getDemoDecisionSupport(countryCode: string, vaccineCode: string): DecisionSupportResult {
  const country = DEMO_COUNTRIES.find(c => c.code === countryCode) || DEMO_COUNTRIES[0];
  const vaccine = DEMO_VACCINES.find(v => v.code === vaccineCode) || DEMO_VACCINES[0];
  const forecast = generateDemoForecast(countryCode, vaccineCode, 2026);

  let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'TARGET_ACHIEVED' = 'MEDIUM';
  let trendClass: 'Accelerating' | 'Stagnant' | 'Declining' | 'High Coverage Target Reached' = 'Stagnant';
  let priorityLevel: 'Immediate Intervention' | 'Targeted Outreach' | 'Routine Monitoring' | 'Sustain Coverage' = 'Targeted Outreach';
  let suggestedAction = '';
  let rationale = '';
  const triggeredRules: string[] = [];

  const pred = forecast.predictedCoverage;
  const change = forecast.absoluteChange;

  if (pred < DEFAULT_THRESHOLDS.highRiskCoverage || change <= -DEFAULT_THRESHOLDS.criticalDeclineThreshold) {
    riskLevel = 'HIGH';
    priorityLevel = 'Immediate Intervention';
    trendClass = change < -1 ? 'Declining' : 'Stagnant';
    suggestedAction = 'Execute emergency micro-planning, activate rapid response mobile immunization posts, and resolve district cold chain stockouts.';
    rationale = `Coverage is projected at ${pred}%, which is severely below the minimum ${DEFAULT_THRESHOLDS.highRiskCoverage}% vulnerability threshold. Critical protection deficits leave birth cohorts vulnerable to outbreak transmission.`;
    triggeredRules.push('RULE_HIGH_EPIDEMIOLOGICAL_RISK (< 70% threshold)');
    if (change < -1) triggeredRules.push('RULE_NEGATIVE_MOMENTUM_DETECTION');
  } else if (pred >= DEFAULT_THRESHOLDS.targetCoverage) {
    riskLevel = 'TARGET_ACHIEVED';
    priorityLevel = 'Sustain Coverage';
    trendClass = 'High Coverage Target Reached';
    suggestedAction = 'Maintain active sentinel surveillance, safeguard cold-chain resilience, and conduct sub-district equity audits for hard-to-reach pockets.';
    rationale = `Projected coverage of ${pred}% meets or exceeds the global benchmark of ${DEFAULT_THRESHOLDS.targetCoverage}%. National systems are functioning effectively; prioritize zero-dose equity in remote communities.`;
    triggeredRules.push('RULE_GLOBAL_TARGET_MET (>= 90% WHO standard)');
  } else {
    riskLevel = 'MEDIUM';
    priorityLevel = 'Targeted Outreach';
    trendClass = change > 1.5 ? 'Accelerating' : 'Stagnant';
    suggestedAction = 'Implement targeted digital reminder registries to decrease dropout between series doses, and expand primary clinic operating hours.';
    rationale = `Projected coverage is ${pred}%. While performing above critical danger thresholds, there remains a ${Math.round((DEFAULT_THRESHOLDS.targetCoverage - pred)*10)/10}% deficit below the 90% target.`;
    triggeredRules.push('RULE_INTERMEDIATE_DEFICIT (70% - 89% range)');
  }

  return {
    country: country.code,
    countryName: country.name,
    vaccine: vaccine.code,
    vaccineName: vaccine.name,
    latestObservedCoverage: forecast.latestObserved,
    predictedCoverage: pred,
    coverageChange: change,
    trendClassification: trendClass,
    riskLevel,
    suggestedAction,
    rationale,
    priorityLevel,
    triggeredRules,
    recommendedChannels: [
      'Mobile Outreach in Peri-Urban Settlements',
      'Electronic Immunization Registry (EIR) Dropout Tracking',
      'Community Health Worker In-Person Tracing',
      'Sub-District Vaccine Logistics Buffer Stocks'
    ],
    isDemo: true
  };
}

