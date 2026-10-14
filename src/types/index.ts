export type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'TARGET_ACHIEVED';

export type TrendDirection = 'increasing' | 'stable' | 'decreasing';

export type TrendClassification = 
  | 'Accelerating' 
  | 'Stagnant' 
  | 'Declining' 
  | 'High Coverage Target Reached';

export interface CountryMetadata {
  code: string;
  name: string;
  region: string;
  incomeGroup: 'Low income' | 'Lower middle income' | 'Upper middle income' | 'High income';
  population?: number;
  dataCompleteness: number; // percentage 0-100
  missingYearsCount: number;
}

export interface VaccineMetadata {
  code: string;
  name: string;
  targetDisease: string;
  recommendedAge: string;
  doses: number;
  whoTarget: number; // standard WHO target is 90% or 95%
  description: string;
}

export interface HistoricalCoveragePoint {
  year: number;
  coverage: number;
  isObserved: true;
  dataSource?: string;
}

export interface ForecastPoint {
  year: number;
  predicted: number;
  lower80?: number;
  upper80?: number;
  lower95?: number;
  upper95?: number;
  isObserved: false;
}

export interface CombinedCoveragePoint {
  year: number;
  historical?: number;
  forecast?: number;
  lower80?: number;
  upper80?: number;
  lower95?: number;
  upper95?: number;
}

export interface ForecastRequest {
  country: string;
  vaccine: string;
  horizons: number[];
}

export interface ForecastResponse {
  country: string;
  countryName: string;
  vaccine: string;
  vaccineName: string;
  latestYear: number;
  latestObserved: number;
  targetHorizonYear: number;
  predictedCoverage: number;
  absoluteChange: number;
  direction: TrendDirection;
  historical: HistoricalCoveragePoint[];
  forecast: ForecastPoint[];
  modelUsed: string;
  generatedAt: string;
  isDemo: boolean;
}

export interface ModelMetric {
  modelId: string;
  modelName: string;
  category: 'Baseline' | 'Classical ML' | 'Deep Learning' | 'Advanced Attention (Proposed)';
  rmse: number;
  mae: number;
  mape: number; // percentage
  smape: number; // percentage
  r2: number;
  trainingTimeSec: number;
  supportsIntervals: boolean;
  supportsInterpretability: boolean;
  notes: string;
  isBest?: {
    rmse?: boolean;
    mae?: boolean;
    mape?: boolean;
    smape?: boolean;
    r2?: boolean;
  };
}

export interface FeatureImportanceItem {
  feature: string;
  displayName: string;
  importance: number; // 0 to 1
  category: 'Static Covariates' | 'Time-Varying Known' | 'Time-Varying Observed';
  description: string;
}

export interface TemporalAttentionItem {
  lagYear: number;
  relativeLag: string; // e.g. "t - 1 (2022)"
  weight: number; // attention weight
  eventContext?: string;
}

export interface ExplainabilityData {
  country: string;
  vaccine: string;
  model: string;
  featureImportance: FeatureImportanceItem[];
  temporalAttention: TemporalAttentionItem[];
  decoderAttention: { horizon: number; year: number; weight: number }[];
  summaryNarrative: string;
  isDemo: boolean;
}

export interface DecisionSupportThresholds {
  highRiskCoverage: number; // e.g. < 70
  mediumRiskCoverage: number; // e.g. 70 - 89
  targetCoverage: number; // e.g. >= 90
  criticalDeclineThreshold: number; // percentage points drop e.g. > 3%
  moderateDeclineThreshold: number; // drop e.g. 1% - 3%
}

export interface DecisionSupportResult {
  country: string;
  countryName: string;
  vaccine: string;
  vaccineName: string;
  latestObservedCoverage: number;
  predictedCoverage: number;
  coverageChange: number;
  trendClassification: TrendClassification;
  riskLevel: RiskLevel;
  suggestedAction: string;
  rationale: string;
  priorityLevel: 'Immediate Intervention' | 'Targeted Outreach' | 'Routine Monitoring' | 'Sustain Coverage';
  triggeredRules: string[];
  recommendedChannels: string[];
  isDemo: boolean;
}

export interface GlobalDashboardSummary {
  globalAverageCoverage: number;
  previousYearCoverage: number;
  yoyChange: number;
  totalCountriesCount: number;
  totalVaccinesCount: number;
  latestObservationYear: number;
  forecastHorizonRange: string;
  highRiskCountriesCount: number;
  targetAchievedCountriesCount: number;
  globalTrend: { year: number; globalAverage: number; lowIncome: number; highIncome: number }[];
  topCoverageCountries: { country: string; code: string; coverage: number; region: string }[];
  lowestCoverageCountries: { country: string; code: string; coverage: number; region: string }[];
  regionalBreakdown: { region: string; coverage: number; countries: number; trend: TrendDirection }[];
  vaccineOverview: { code: string; name: string; globalCoverage: number; target: number }[];
  isDemo: boolean;
}

export interface BackendHealthResponse {
  status: 'online' | 'offline' | 'error';
  message: string;
  version?: string;
  modelsLoaded?: string[];
  timestamp?: string;
}

