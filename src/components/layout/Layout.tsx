import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useMetadata } from '../../context/MetadataContext';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { defaultCountry, defaultVaccine } = useMetadata();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry || 'India');
  const [selectedVaccine, setSelectedVaccine] = useState(defaultVaccine || 'MCV1');

  useEffect(() => {
    if (defaultCountry) setSelectedCountry(defaultCountry);
  }, [defaultCountry]);

  useEffect(() => {
    if (defaultVaccine) setSelectedVaccine(defaultVaccine);
  }, [defaultVaccine]);

  return (
    <div className="min-h-screen bg-[#f0faf7] text-slate-800 flex antialiased">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          selectedCountry={selectedCountry}
          selectedVaccine={selectedVaccine}
          onCountryChange={setSelectedCountry}
          onVaccineChange={setSelectedVaccine}
        />
      </div>

      {/* Mobile Drawer */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative w-64 h-full bg-white z-10 flex flex-col shadow-2xl">
            <Sidebar
              collapsed={false}
              onToggle={() => setMobileSidebarOpen(false)}
              selectedCountry={selectedCountry}
              selectedVaccine={selectedVaccine}
              onCountryChange={setSelectedCountry}
              onVaccineChange={setSelectedVaccine}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <Header onToggleMobileSidebar={() => setMobileSidebarOpen(true)} />

        <main className="flex-1 px-6 md:px-8 pb-10 space-y-6 max-w-[1400px] w-full">
          {children}
        </main>
      </div>
    </div>
  );
};
