import {
  CountryMetadata,
  VaccineMetadata,
  ForecastResponse,
  ForecastRequest,
  ModelMetric,
  ExplainabilityData,
  DecisionSupportResult,
  BackendHealthResponse,
  GlobalDashboardSummary
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

class ApiService {
  private baseUrl: string;

  constructor() {
    const envUrl = import.meta.env.VITE_API_BASE_URL;
    this.baseUrl = (envUrl || 'http://localhost:8000').replace(/\/$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const targetUrl = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const timeoutMs = 6000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(targetUrl, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options?.headers || {})
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json() as T;
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
      const data = await this.request<BackendHealthResponse>('/health');
      return {
        ...data,
        status: 'online'
      };
    } catch {
      return {
        status: 'offline',
        message: 'Backend connection pending'
      };
    }
  }

  /**
   * Dataset metadata: GET /metadata
   */
  public async getMetadata(): Promise<{
    countries: CountryMetadata[];
    vaccines: VaccineMetadata[];
    horizons: number[];
  }> {
    try {
      return await this.request<{
        countries: CountryMetadata[];
        vaccines: VaccineMetadata[];
        horizons: number[];
      }>('/metadata');
    } catch {
      return {
        countries: DEMO_COUNTRIES,
        vaccines: DEMO_VACCINES,
        horizons: DEMO_AVAILABLE_HORIZONS
      };
    }
  }

  /**
   * Global Dashboard summary: GET /dashboard-summary
   */
  public async getDashboardSummary(): Promise<GlobalDashboardSummary> {
    try {
      return await this.request<GlobalDashboardSummary>('/dashboard-summary');
    } catch {
      return DEMO_GLOBAL_SUMMARY;
    }
  }

  /**
   * Model Forecast: POST /forecast
   */
  public async getForecast(req: ForecastRequest): Promise<ForecastResponse> {
    try {
      return await this.request<ForecastResponse>('/forecast', {
        method: 'POST',
        body: JSON.stringify(req)
      });
    } catch {
      const maxHorizon = Math.max(...req.horizons);
      return generateDemoForecast(req.country, req.vaccine, maxHorizon);
    }
  }

  /**
   * Model Comparison metrics: GET /model-comparison
   */
  public async getModelComparison(): Promise<{ metrics: ModelMetric[] }> {
    try {
      const metrics = await this.request<ModelMetric[]>('/model-comparison');
      return { metrics };
    } catch {
      return { metrics: DEMO_MODEL_COMPARISON };
    }
  }

  /**
   * Model Explainability: POST /explainability
   */
  public async getExplainability(params: { country: string; vaccine: string }): Promise<ExplainabilityData> {
    try {
      return await this.request<ExplainabilityData>('/explainability', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    } catch {
      return {
        ...DEMO_EXPLAINABILITY_DATA,
        country: params.country,
        vaccine: params.vaccine
      };
    }
  }

  /**
   * Decision Support: POST /decision-support
   */
  public async getDecisionSupport(params: { country: string; vaccine: string }): Promise<DecisionSupportResult> {
    try {
      return await this.request<DecisionSupportResult>('/decision-support', {
        method: 'POST',
        body: JSON.stringify(params)
      });
    } catch {
      return getDemoDecisionSupport(params.country, params.vaccine);
    }
  }
}

export const apiService = new ApiService();
