import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency } from '../contexts/CurrencyContext';
import { useLanguage } from '../contexts/LanguageContext';
import type { CurrencyCode } from '../contexts/CurrencyContext';

const currencyOptions: { code: CurrencyCode; symbol: string; label: string; flag: string }[] = [
  { code: 'LEI', symbol: 'L', label: 'RON', flag: '🇷🇴' },
  { code: 'EUR', symbol: '€', label: 'EUR', flag: '🇪🇺' },
  { code: 'MDL', symbol: 'L', label: 'MDL', flag: '🇲🇩' },
  { code: 'USD', symbol: '$', label: 'USD', flag: '🇺🇸' },
];

export const CurrencyConverter: React.FC = () => {
  const { currency, setCurrency } = useCurrency();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const currentOption = currencyOptions.find((c) => c.code === currency)!;

  return (
    <div className="relative inline-flex items-center gap-2">
      <span className="text-sm font-medium text-dark-600">
        {t('currency.changeLabel')}
      </span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/80 hover:bg-white rounded-lg border border-primary-200 hover:border-primary-400 transition-all shadow-sm hover:shadow"
        aria-label={t('currency.changeLabel')}
      >
        <span className="flex items-baseline gap-1">
          <span className="text-sm font-semibold text-dark-950">
            {currentOption.symbol}
          </span>
          <span className="text-[10px] font-semibold tracking-wide text-dark-500">
            {currentOption.label}
          </span>
        </span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-dark-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 left-0 right-0 bg-white rounded-lg border border-primary-200 shadow-lg overflow-hidden z-50 min-w-[200px] card-lux-hover"
          >
            {currencyOptions.map((opt) => (
              <button
                key={opt.code}
                onClick={() => {
                  setCurrency(opt.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-4 py-3 hover:bg-primary-50 transition-colors ${
                  currency === opt.code ? 'bg-primary-100' : ''
                }`}
              >
                <span className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-dark-950">
                    {opt.symbol}
                  </span>
                  <span className="text-[11px] font-semibold tracking-wide text-dark-500">
                    {opt.label}
                  </span>
                </span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
