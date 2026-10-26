import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { useMetadata } from '../../context/MetadataContext';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  selectedCountry?: string;
  selectedVaccine?: string;
  onCountryChange?: (country: string) => void;
  onVaccineChange?: (vaccine: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  collapsed, 
  onToggle,
  selectedCountry,
  selectedVaccine,
  onCountryChange,
  onVaccineChange
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { countries, vaccines, defaultCountry, defaultVaccine } = useMetadata();

  const currentCountry = selectedCountry || defaultCountry;
  const currentVaccine = selectedVaccine || defaultVaccine;

  const navItems = [
    { to: '/', label: 'Dashboard' },
    { to: '/countries', label: 'Country Analysis' },
    { to: '/vaccines', label: 'Vaccine Analysis' },
    { to: '/forecast', label: 'Forecast' },
    { to: '/models', label: 'Model Comparison' },
    { to: '/explainability', label: 'Explainability' },
    { to: '/decision-support', label: 'Decision Support' },
  ];

  const handleCountrySelect = (code: string) => {
    if (onCountryChange) onCountryChange(code);
    navigate(`/countries?code=${encodeURIComponent(code)}`);
  };

  const handleVaccineSelect = (code: string) => {
    if (onVaccineChange) onVaccineChange(code);
    navigate(`/vaccines?code=${encodeURIComponent(code)}`);
  };

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 bg-white border-r border-[#d8ebe4] transition-all duration-300 flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-[#e8f4f0]">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-[#0d7a68] flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            {!collapsed && (
              <div className="truncate">
                <h1 className="text-base font-extrabold tracking-tight text-[#07362f] font-sans flex items-center gap-1">
                  <span>ImmunoSight</span>
                </h1>
                <p className="text-[11px] text-slate-400 font-medium tracking-tight truncate">
                  Immunization Forecasting
                </p>
              </div>
            )}
          </div>

          <button
            onClick={onToggle}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-[13px] transition-all relative ${
                  isActive
                    ? 'bg-[#e6f7f2] text-[#0d7a68] font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active Indicator Bar on the left */}
                  {isActive && (
                    <span className="absolute -left-3 top-2 bottom-2 w-1.5 bg-[#0d7a68] rounded-r-md" />
                  )}

                  {/* Bullet Dot */}
                  <span
                    className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${
                      isActive ? 'bg-[#0d7a68]' : 'bg-slate-300'
                    }`}
                  />

                  {!collapsed && <span className="truncate">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Global Filters: Country & Vaccine Selectors */}
      {!collapsed && (
        <div className="p-4 border-t border-[#e8f4f0] bg-[#fbfdfc] space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">
              Country
            </label>
            <select
              value={currentCountry}
              onChange={(e) => handleCountrySelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8ebe4] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-500 block">
              Vaccine
            </label>
            <select
              value={currentVaccine}
              onChange={(e) => handleVaccineSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#d8ebe4] text-xs font-medium text-slate-800 focus:outline-none focus:border-[#0d7a68] shadow-sm cursor-pointer"
            >
              {vaccines.map((v) => (
                <option key={v.code} value={v.code}>
                  {v.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </aside>
  );
};
