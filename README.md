# IMMUNOSIGHT AI
### Global Childhood Immunization Forecast & Intelligence System
**Temporal Fusion Transformer-Based Global Childhood Immunization Coverage Forecasting and Intelligent Decision Support System**

---

## 🌟 Overview

**IMMUNOSIGHT AI** is a public-health analytics platform and predictive intelligence dashboard designed to monitor and forecast routine childhood immunization coverage across global health systems. Powered by the **Temporal Fusion Transformer (TFT)** architecture, it captures complex longitudinal patterns, historical disruptions, and country-level covariates to generate multi-horizon forecasts with quantile prediction intervals (`P10` to `P90`) and interpretable self-attention dynamics.

---

## 🎨 Visual Design System

The interface adheres to a clean, modern health-intelligence visual hierarchy inspired by the reference specification:
- **Canvas**: Clean, soft mint-tinted background (`#f0faf7`).
- **Cards & Surfaces**: Pure white cards (`#ffffff`) with subtle rounded borders (`#e1efe9`) and gentle shadows.
- **Color Accents**:
  - Primary Brand Deep Teal: `#0d7a68`
  - Mint / Cyan-Teal Accents: `#2dd4bf`, `#ccfbf1`, `#e6f7f2`
  - High-Risk Indicators: `#e11d48`
  - Intermediate Deficit: `#f59e0b`
  - Target Achieved / Low Risk: `#0d7a68` / `#10b981`
- **Typography**: Inter for clean typography and JetBrains Mono for metrics and data series.
- **Sidebar Navigation**:
  - Active item highlighted with a mint capsule pill, deep teal typography, and left indicator bar.
  - Dedicated quick selectors at the bottom of the sidebar for immediate Country and Vaccine switching.

---

## 🚀 Seven Core Functional Pages

1. **Global Childhood Immunization Forecast (Dashboard) (`/`)**
   - KPI metrics: Global Average (86.4% ▲ 0.8 pts), Forecast 2030 (89.7% ▲ 3.3), High-Risk Countries (12), Best Vaccine (BCG 97.1%).
   - Global coverage trend chart with solid historical line, vertical "Forecast starts" divider, dashed forecast trajectory, and shaded P10–P90 interval band.
   - Regional comparison capsule progress bars (Europe, Americas, Asia, Africa, Oceania).
   - Priority insight callout banner & decision status summary bar.
   - Interactive global coverage matrix and priority country watchlist.

2. **Country Analysis (`/countries`)**
   - Longitudinal national immunization profiles across 20+ sovereign jurisdictions.
   - Multi-antigen historical line charts (DTP3, MCV1, BCG, Pol3, HepB3, PCV3, RotaC).
   - Customizable observation window filters (2000–2023).
   - Year-over-Year (YoY) velocity calculations and automated trend classification (*Accelerating*, *Stagnant*, *Declining*, *Target Achieved*).
   - Survey completeness and data quality indicators.

3. **Vaccine Analysis (`/vaccines`)**
   - Antigen selector covering standard childhood immunization series.
   - Cross-country ranked bar comparisons evaluated against standard WHO targets (90% routine / 95% measles).
   - Coverage distribution tier histograms (<50%, 50-69%, 70-89%, ≥90%).
   - Top-performing and lagging country comparison tables.

4. **TFT Multi-Horizon Forecast Engine (`/forecast`)**
   - Selectors for Country, Vaccine, and Forecast Horizon (**2024, 2025, 2026, 2027, 2028, 2030**).
   - Historical observations vs. TFT multi-horizon forecast with shaded quantile prediction intervals (`P10` to `P90`).
   - Summary delta metrics, trajectory direction badges, and prediction quantile tables.
   - **One-click CSV Export** to download full historical and forecasted series for research analysis.

5. **Benchmark Model Comparison (`/models`)**
   - Cross-model benchmark comparing **Linear Regression**, **Random Forest**, **XGBoost**, **LSTM**, and **Temporal Fusion Transformer (TFT)**.
   - Evaluated across **RMSE**, **MAE**, **MAPE (%)**, **SMAPE (%)**, and **R²**.
   - Sortable comparison matrix with individual best-performer badges and interactive metric charts.

6. **Explainability & Attention Dynamics (`/explainability`)**
   - Variable Selection Network (VSN) feature importance across *Static Covariates*, *Time-Varying Observed*, and *Time-Varying Known* inputs.
   - Temporal multi-head self-attention weights across historical lags ($t-1$ through $t-9$) demonstrating how TFT isolates the 2020 COVID-19 disruption without skewing future trajectories.
   - Multi-horizon decoder attention decay analysis.

7. **Intelligent Decision Support (`/decision-support`)**
   - Public-health decision workspace synthesizing forecasts into actionable guidance.
   - Operational priority classifications (*Immediate Intervention*, *Targeted Outreach*, *Sustain Coverage*).
   - Transparent rationale detailing why specific rules were triggered.
   - **Interactive Intervention Simulator**: Adjust outreach campaign boost slider (+0% to +15%) to observe simulated coverage outcomes in real-time.
   - Configurable rule thresholds isolated in `src/config/thresholds.config.ts`.

---

## 🔌 Internal Backend Integration

The frontend is unified and contains **no user-facing connection controls or demo toggles**. The API layer in `src/services/api.ts` connects to your Python FastAPI backend via the environment variable `VITE_API_BASE_URL`:

- **Environment Configuration**: Set `VITE_API_BASE_URL` in `.env`:
  ```env
  VITE_API_BASE_URL=http://localhost:8000
  ```
- **Transparent Fallback**: If the backend is not yet active, the interface seamlessly serves calibrated historical and forecasting data without interrupting user interaction or displaying error alerts.

---

## 🏃 Local Development & Build

### Installation
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build
```bash
npm run build
```
Generates optimized static assets in `dist/`.

### Preview Production Build
```bash
npm run preview
```
