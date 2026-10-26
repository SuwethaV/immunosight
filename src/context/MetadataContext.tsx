import React, { createContext, useContext, useEffect, useState } from 'react';
import { CountryMetadata, VaccineMetadata } from '../types';
import { apiService } from '../services/api';
import { DEMO_COUNTRIES, DEMO_VACCINES } from '../data/demoData';

interface MetadataContextType {
  countries: CountryMetadata[];
  vaccines: VaccineMetadata[];
  horizons: number[];
  defaultCountry: string;
  defaultVaccine: string;
  loading: boolean;
}

const MetadataContext = createContext<MetadataContextType | undefined>(undefined);

export const MetadataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [countries, setCountries] = useState<CountryMetadata[]>(DEMO_COUNTRIES);
  const [vaccines, setVaccines] = useState<VaccineMetadata[]>(DEMO_VACCINES);
  const [horizons, setHorizons] = useState<number[]>([2024, 2025, 2026, 2027, 2028, 2029, 2030]);
  const [defaultCountry, setDefaultCountry] = useState<string>('India');
  const [defaultVaccine, setDefaultVaccine] = useState<string>('MCV1');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMeta = async () => {
      try {
        const meta = await apiService.getMetadata();
        if (!isMounted) return;

        if (meta.countries && meta.countries.length > 0) {
          setCountries(meta.countries);
          // defaultCountry: country whose name equals "India" (case-insensitive) if present, else countries[0]?.name
          const foundIndia = meta.countries.find(
            (c) => c.name.toLowerCase() === 'india' || c.code.toLowerCase() === 'india'
          );
          setDefaultCountry(foundIndia ? foundIndia.name : meta.countries[0].name);
        }

        if (meta.vaccines && meta.vaccines.length > 0) {
          setVaccines(meta.vaccines);
          // defaultVaccine: first vaccine whose normalized alphanumeric name contains "mcv1", else vaccines[0]?.name
          const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
          const foundMcv1 = meta.vaccines.find(
            (v) => normalize(v.name).includes('mcv1') || normalize(v.code).includes('mcv1')
          );
          setDefaultVaccine(foundMcv1 ? foundMcv1.code : meta.vaccines[0].code);
        }

        if (meta.horizons && meta.horizons.length > 0) {
          setHorizons(meta.horizons);
        }
      } catch (err) {
        console.warn('[MetadataContext] Failed to load metadata, falling back to defaults', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMeta();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <MetadataContext.Provider
      value={{
        countries,
        vaccines,
        horizons,
        defaultCountry,
        defaultVaccine,
        loading,
      }}
    >
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetadata = (): MetadataContextType => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetadata must be used within a MetadataProvider');
  }
  return context;
};

