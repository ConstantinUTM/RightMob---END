import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type CurrencyCode = 'LEI' | 'EUR' | 'MDL' | 'USD';

const STORAGE_KEY = 'luxmobila-currency';

const exchangeRates: Record<CurrencyCode, number> = {
  LEI: 1,
  EUR: 0.2,   // 1 LEI (RON) = 0.2 EUR
  MDL: 4.5,   // 1 LEI (RON) ≈ 4.5 MDL
  USD: 0.22,  // 1 LEI (RON) = 0.22 USD
};

const currencySymbols: Record<CurrencyCode, string> = {
  LEI: 'LEI',
  EUR: '€',
  MDL: 'MDL',
  USD: '$',
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (code: CurrencyCode) => void;
  /** Convertește un preț din LEI în moneda selectată și îl returnează ca număr */
  convert: (priceInLei: number) => number;
  /** Formatează un preț (în LEI) în moneda selectată, ex: "2 599.80 €" */
  formatPrice: (priceInLei: number) => string;
  symbol: string;
  exchangeRates: Record<CurrencyCode, number>;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CurrencyCode | null;
      if (saved && ['LEI', 'EUR', 'MDL', 'USD'].includes(saved)) return saved;
    } catch (_) {}
    return 'LEI';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, currency);
    } catch (_) {}
  }, [currency]);

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code);
  }, []);

  const convert = useCallback(
    (priceInLei: number) => priceInLei * exchangeRates[currency],
    [currency]
  );

  const formatPrice = useCallback(
    (priceInLei: number) => {
      const value = convert(priceInLei);
      const formatted = value >= 1000
        ? value.toLocaleString('ro-RO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value.toFixed(2);
      return `${formatted} ${currencySymbols[currency]}`;
    },
    [currency, convert]
  );

  const value: CurrencyContextValue = {
    currency,
    setCurrency,
    convert,
    formatPrice,
    symbol: currencySymbols[currency],
    exchangeRates,
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error('useCurrency must be used within CurrencyProvider');
  return ctx;
}
