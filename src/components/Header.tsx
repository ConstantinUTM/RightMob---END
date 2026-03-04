import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Box, Mail, LayoutDashboard, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import LanguageSelector from './LanguageSelector';
import Logo from './Logo';

const Header: React.FC = () => {
  const { isAdmin, signOut } = useAuth();
  const { t } = useLanguage();
  const { features } = useSiteSettings();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isSticky = scrolled;
  const isHome = location.pathname === '/';
  const isTransparentPage = isHome || location.pathname === '/despre';
  const headerBg = isSticky
    ? 'bg-white/95 backdrop-blur-xl shadow-md border-b border-neutral-200/80'
    : isTransparentPage
      ? 'bg-transparent backdrop-blur-none border-b border-white/10'
      : 'bg-white/95 backdrop-blur-md shadow-sm border-b border-neutral-200/80';
  const textColor = isSticky || !isTransparentPage ? 'text-dark-900' : 'text-white';
  const navLinkClass = (active: boolean) => {
    const darkNav = isSticky || !isTransparentPage;
    return darkNav
      ? `font-medium transition-colors duration-200 ${active ? 'text-[#2563eb]' : 'text-dark-700 hover:text-[#2563eb]'}`
      : `font-medium transition-colors duration-200 ${active ? 'text-[#2563eb]' : 'text-white/85 hover:text-white'}`;
  };

  const email = import.meta.env.VITE_COMPANY_EMAIL || 'contact@rightmob.md';
  const phone = import.meta.env.VITE_COMPANY_PHONE || '';

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg} py-4`}>
      <nav className="container-custom">
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
          {/* Stânga: logo + pe mobil email și telefon */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Link to="/" className="flex items-center shrink-0 group">
              <Logo size="md" />
            </Link>
            {/* Mobil: email și telefon – email pe două rânduri dacă e lung, ca să se vadă tot */}
            <div className={`lg:hidden flex items-center gap-2 sm:gap-3 min-w-0 ${textColor}`}>
              <a href={`mailto:${email}`} className={`flex items-center gap-1.5 p-1.5 rounded-lg font-medium transition-colors hover:opacity-80 min-w-0 ${isSticky || !isTransparentPage ? 'text-[#2563eb]' : ''}`} aria-label={email}>
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs break-all line-clamp-2 max-w-[110px] min-[380px]:max-w-[150px] sm:max-w-[200px]">{email}</span>
              </a>
              {phone && (
                <a href={`tel:${phone.replace(/\s/g, '')}`} className={`flex items-center gap-1.5 p-1.5 rounded-lg font-medium transition-colors hover:opacity-80 shrink-0 ${isSticky || !isTransparentPage ? 'text-[#2563eb]' : ''}`} aria-label="Telefon">
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="text-xs hidden sm:inline">{phone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Desktop: navigare + contact + utilități */}
          <div className={`hidden lg:flex items-center flex-nowrap gap-4 xl:gap-6 justify-end min-w-0 ${textColor}`}>
            {/* Linkuri pagini */}
            {features.tryInMyRoomEnabled && (
              <Link to="/try-room" className={`flex items-center gap-2 shrink-0 ${navLinkClass(isActive('/try-room'))}`}>
                <Box className="w-4 h-4" />
                {t('nav.tryRoom')}
              </Link>
            )}
            <Link to="/galerie" className={`shrink-0 ${navLinkClass(isActive('/galerie'))}`}>
              {t('nav.products')}
            </Link>
            <Link to="/despre" className={`shrink-0 ${navLinkClass(isActive('/despre'))}`}>
              {t('nav.about')}
            </Link>
            <Link to="/contact" className={`shrink-0 ${navLinkClass(isActive('/contact'))}`}>
              {t('nav.contact')}
            </Link>
            {/* Separator vizual între nav și contact/utils */}
            <span className="hidden xl:block w-px h-6 bg-current opacity-20 shrink-0" aria-hidden />
            <a
              href={`mailto:${email}`}
              className={`hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${isSticky || !isTransparentPage ? 'text-[#2563eb] hover:bg-blue-50/80' : 'text-white/90 hover:text-white'}`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="text-sm hidden xl:inline truncate max-w-[160px]">{email}</span>
            </a>
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, '')}`}
                className={`hidden xl:flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${isSticky || !isTransparentPage ? 'text-[#2563eb]' : 'text-white/90 hover:text-white'}`}
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span className="text-sm whitespace-nowrap">{phone}</span>
              </a>
            )}
            <span className="shrink-0"><LanguageSelector dark={isTransparentPage && !isSticky} /></span>
            {isAdmin && (
              <>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium transition-colors shrink-0 whitespace-nowrap ${isSticky || !isTransparentPage ? 'text-[#2563eb] hover:bg-blue-50' : 'text-white hover:bg-white/10'}`}
                  aria-label="Dashboard"
                >
                  <LayoutDashboard className="w-5 h-5 shrink-0" />
                  <span className="hidden xl:inline">Dashboard</span>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => signOut()}
                  className={`p-2 rounded-full transition-all duration-200 shrink-0 ${isSticky || !isTransparentPage ? 'hover:bg-red-50 text-red-600' : 'hover:bg-white/10 text-white'}`}
                  aria-label="Logout"
                >
                  <LogOut className="w-6 h-6" />
                </motion.button>
              </>
            )}
          </div>

          {/* Mobil: buton meniu (hamburger) – mereu vizibil sub lg */}
          <button
            type="button"
            className={`lg:hidden p-2 shrink-0 rounded-lg ${isSticky || !isTransparentPage ? 'text-dark-900 hover:bg-gray-100' : 'text-white hover:bg-white/10'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? 'Închide meniul' : 'Deschide meniul'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>

        {/* Meniu mobil */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={`lg:hidden mt-6 pb-6 space-y-1 rounded-xl ${isSticky || !isTransparentPage ? 'text-dark-900 bg-white/95' : 'text-white bg-black/20 backdrop-blur-sm'}`}
            >
              <Link to="/galerie" className={`block px-4 py-3 font-medium ${isActive('/galerie') ? 'text-primary-500' : ''} hover:opacity-90`} onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.products')}
              </Link>
              {features.tryInMyRoomEnabled && (
                <Link to="/try-room" className={`block px-4 py-3 font-medium ${isActive('/try-room') ? 'text-primary-500' : ''} hover:opacity-90`} onClick={() => setIsMobileMenuOpen(false)}>
                  {t('nav.tryRoom')}
                </Link>
              )}
              <Link to="/despre" className={`block px-4 py-3 font-medium ${isActive('/despre') ? 'text-primary-500' : ''} hover:opacity-90`} onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.about')}
              </Link>
              <Link to="/contact" className={`block px-4 py-3 font-medium ${isActive('/contact') ? 'text-primary-500' : ''} hover:opacity-90`} onClick={() => setIsMobileMenuOpen(false)}>
                {t('nav.contact')}
              </Link>
              {isAdmin && (
                <Link to="/admin" className="block px-4 py-3 font-medium hover:opacity-90" onClick={() => setIsMobileMenuOpen(false)}>
                  Dashboard
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
