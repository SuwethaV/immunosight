import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { DashboardPage } from './pages/DashboardPage';
import { CountryAnalysisPage } from './pages/CountryAnalysisPage';
import { VaccineAnalysisPage } from './pages/VaccineAnalysisPage';
import { ForecastPage } from './pages/ForecastPage';
import { ModelComparisonPage } from './pages/ModelComparisonPage';
import { ExplainabilityPage } from './pages/ExplainabilityPage';
import { DecisionSupportPage } from './pages/DecisionSupportPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/countries" element={<CountryAnalysisPage />} />
          <Route path="/vaccines" element={<VaccineAnalysisPage />} />
          <Route path="/forecast" element={<ForecastPage />} />
          <Route path="/models" element={<ModelComparisonPage />} />
          <Route path="/explainability" element={<ExplainabilityPage />} />
          <Route path="/decision-support" element={<DecisionSupportPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;
