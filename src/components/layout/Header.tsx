import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Calendar } from 'lucide-react';

interface HeaderProps {
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const location = useLocation();

  const pageHeaders: Record<string, { title: string; subtitle: string }> = {
    '/': {
      title: 'Global Childhood Immunization Forecast',
      subtitle: 'Powered by Temporal Fusion Transformer, UNICEF data',
    },
    '/countries': {
      title: 'Country Coverage Analysis',
      subtitle: 'Longitudinal national immunization profiles & data completeness',
    },
    '/vaccines': {
      title: 'Vaccine & Antigen Comparative Analysis',
      subtitle: 'Antigen schedules, distribution tiers & WHO benchmark compliance',
    },
    '/forecast': {
      title: 'TFT Multi-Horizon Coverage Forecasting',
      subtitle: 'Multi-horizon quantile predictions with uncertainty bounds',
    },
    '/models': {
      title: 'Benchmark Model Comparison',
      subtitle: 'Evaluation against Linear Regression, Random Forest, XGBoost & LSTM',
    },
    '/explainability': {
      title: 'TFT Model Explainability & Self-Attention',
      subtitle: 'Variable Selection Networks & temporal multi-head attention weights',
    },
    '/decision-support': {
      title: 'Intelligent Decision Support System',
      subtitle: 'Rule-based public-health intervention heuristics & scenario simulator',
    },
  };

  const currentInfo = pageHeaders[location.pathname] || pageHeaders['/'];

  return (
    <header className="px-6 md:px-8 pt-7 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-2 rounded-xl bg-white border border-[#d8ebe4] text-slate-600 shadow-sm"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          <h1 className="text-2xl md:text-[26px] font-extrabold text-[#07362f] tracking-tight">
            {currentInfo.title}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-0.5 font-medium">
            {currentInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right side status pill matching reference screenshot */}
      <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-[#a3e9d4] text-[#0d7a68] text-xs font-semibold shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-[#0d7a68]" />
          <span>Latest data: 2023</span>
        </div>
      </div>
    </header>
  );
};
