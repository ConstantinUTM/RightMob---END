import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const languages = [
  { code: 'ro' as const, name: 'Română', flag: '🇷🇴' },
  { code: 'en' as const, name: 'English', flag: '🇬🇧' },
  { code: 'ru' as const, name: 'Русский', flag: '🇷🇺' },
];

interface LanguageSelectorProps {
  dark?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ dark }) => {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0];
  const btnClass = dark
    ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
    : 'bg-primary-50 hover:bg-primary-100 text-primary-700';
  const iconClass = dark ? 'text-white' : 'text-primary-600';
  const labelClass = dark ? 'text-white' : 'text-primary-700';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: 'ro' | 'en' | 'ru') => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-colors duration-200 ${btnClass}`}
        aria-label="Select language"
      >
        <Globe className={`w-4 h-4 ${iconClass}`} />
        <span className={`text-sm font-medium ${labelClass}`}>
          {currentLanguage.code.toUpperCase()}
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
          >
            {languages.map((lang) => (
              <motion.button
                key={lang.code}
                whileHover={{ backgroundColor: '#fef3f2' }}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                  language === lang.code 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'text-gray-700 hover:text-primary-600'
                }`}
              >
                <span className="text-xl">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
                {language === lang.code && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="ml-auto w-2 h-2 bg-primary-600 rounded-full"
                  />
                )}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;
