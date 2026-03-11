import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, Box, Mail, LayoutDashboard, Phone, Shield } from 'lucide-react';
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
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '373XXXXXXXX';

  const getHeaderContext = () => {
    const path = location.pathname;
    const now = new Date();
    const dateTime = `${now.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${now.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`;
    const device = /iPhone/i.test(navigator.userAgent) ? 'iPhone' : /iPad/i.test(navigator.userAgent) ? 'iPad' : /Android/i.test(navigator.userAgent) ? 'Android' : 'Desktop';
    const city = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ') || ''; } catch { return ''; } })();
    const lang = (localStorage.getItem('language') || localStorage.getItem('lang') || 'ro').toUpperCase();
    let pageCtx = '';
    if (path.startsWith('/galerie/') || path.startsWith('/produs/')) {
      const h1 = document.querySelector('h1');
      const name = h1?.textContent?.trim();
      if (name) pageCtx = `Sunt interesat de: ${name}\nLink: ${window.location.href}`;
    } else if (path === '/galerie') pageCtx = 'Am navigat prin galeria de produse.';
    else if (path === '/despre') pageCtx = 'Am vizitat pagina Despre noi.';
    return { pageCtx, dateTime, device, city, lang };
  };

  const openHeaderWhatsApp = () => {
    const { pageCtx, dateTime, device, city, lang } = getHeaderContext();
    sendTrack('whatsapp');
    const info = [`📱 ${device}`, city ? `📍 ${city}` : '', `🌐 ${lang}`, `📄 ${location.pathname}`].filter(Boolean).join('  |  ');
    const msg = encodeURIComponent(`Bună ziua! 👋\n\n${pageCtx ? pageCtx + '\n\n' : ''}Aș dori mai multe detalii și o consultație.\n\n${info}\n\nVă mulțumesc!`);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile ? `whatsapp://send?phone=${whatsappNumber}&text=${msg}` : `https://wa.me/${whatsappNumber}?text=${msg}`;
    window.open(url, '_blank');
  };
  const [phoneCopied, setPhoneCopied] = useState(false);
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false);
  const handleCopyPhone = () => {
    const raw = phone.replace(/\s/g, '');
    navigator.clipboard.writeText(raw).then(() => {
      setPhoneCopied(true);
      setPhoneMenuOpen(false);
      setTimeout(() => setPhoneCopied(false), 2000);
    });
  };
  const handlePhoneWhatsApp = () => {
    setPhoneMenuOpen(false);
    sendTrack('whatsapp');
    const { pageCtx, device, city, lang } = getHeaderContext();
    const info = [`📱 ${device}`, city ? `📍 ${city}` : '', `🌐 ${lang}`, `📄 ${location.pathname}`].filter(Boolean).join('  |  ');
    const msg = encodeURIComponent(`Bună ziua! 👋\n\n${pageCtx ? pageCtx + '\n\n' : ''}Aș dori mai multe detalii și o consultație.\n\n${info}\n\nVă mulțumesc!`);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile ? `whatsapp://send?phone=${whatsappNumber}&text=${msg}` : `https://wa.me/${whatsappNumber}?text=${msg}`;
    window.open(url, '_blank');
  };
  const sendTrack = (source: string) => {
    const { pageCtx, device, city, lang } = getHeaderContext();
    const page = location.pathname;
    fetch('/api/email-track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device, city, lang, page, pageDetails: pageCtx, source }),
    }).catch(() => {});
  };

  const buildGmailUrl = () => {
    const { pageCtx, dateTime, device, city, lang } = getHeaderContext();
    sendTrack('email');
    const subject = 'Solicitare consultație – RightMob';
    const body = `Bună ziua,\n\nV-am contactat prin intermediul site-ului RightMob.\n${pageCtx ? pageCtx + '\n' : ''}\nAș dori să solicit o consultație și mai multe detalii.\n\n---\nDispozitiv: ${device}\n${city ? `Locație aprox.: ${city}\n` : ''}Limba site: ${lang}\nPagina: ${location.pathname}\n---\n\nVă mulțumesc anticipat!\nCu respect,\n`;
    return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

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
              <a href="#" onClick={(e) => { e.preventDefault(); window.open(buildGmailUrl(), '_blank', 'noopener,noreferrer'); }} className={`flex items-center gap-1.5 p-1.5 rounded-lg font-medium transition-colors hover:opacity-80 min-w-0 ${isSticky || !isTransparentPage ? 'text-[#2563eb]' : ''}`} aria-label={email}>
                <Mail className="w-4 h-4 shrink-0" />
                <span className="text-[11px] sm:text-xs break-all line-clamp-2 max-w-[110px] min-[380px]:max-w-[150px] sm:max-w-[200px]">{email}</span>
              </a>
              {phone && (
                <div className="relative shrink-0">
                  <button onClick={() => setPhoneMenuOpen(o => !o)} className={`flex items-center gap-1.5 p-1.5 rounded-lg font-medium transition-colors hover:opacity-80 ${isSticky || !isTransparentPage ? 'text-[#2563eb]' : ''}`} aria-label="Telefon">
                    <Phone className="w-4 h-4 shrink-0" />
                    <span className="text-xs hidden sm:inline">{phoneCopied ? '✓ Copiat!' : phone}</span>
                  </button>
                  <AnimatePresence>
                    {phoneMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setPhoneMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-[180px] overflow-hidden"
                        >
                          <button onClick={handleCopyPhone} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                            <Phone className="w-4 h-4 text-blue-600" />
                            Copiază numărul
                          </button>
                          <button onClick={handlePhoneWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors border-t border-gray-100">
                            <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                            Scrie pe WhatsApp
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
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
              href="#"
              onClick={(e) => { e.preventDefault(); window.open(buildGmailUrl(), '_blank', 'noopener,noreferrer'); }}
              className={`hidden sm:flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium transition-colors shrink-0 ${isSticky || !isTransparentPage ? 'text-[#2563eb] hover:bg-blue-50/80' : 'text-white/90 hover:text-white'}`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span className="text-sm hidden xl:inline truncate max-w-[160px]">{email}</span>
            </a>
            {phone && (
              <div className="relative hidden xl:block shrink-0">
                <button
                  onClick={() => setPhoneMenuOpen(o => !o)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${isSticky || !isTransparentPage ? 'text-[#2563eb] hover:bg-blue-50/80' : 'text-white/90 hover:text-white hover:bg-white/10'}`}
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span className="text-sm whitespace-nowrap">{phoneCopied ? '✓ Copiat!' : phone}</span>
                </button>
                <AnimatePresence>
                  {phoneMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setPhoneMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 z-50 min-w-[200px] overflow-hidden"
                      >
                        <button onClick={handleCopyPhone} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <Phone className="w-4 h-4 text-blue-600" />
                          Copiază numărul
                        </button>
                        <button onClick={handlePhoneWhatsApp} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-green-50 transition-colors border-t border-gray-100">
                          <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          Scrie pe WhatsApp
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )}
            <span className="shrink-0"><LanguageSelector dark={isTransparentPage && !isSticky} /></span>
            {isAdmin ? (
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
            ) : (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-2 py-1.5 rounded-lg font-medium transition-colors shrink-0 whitespace-nowrap border ${isSticky || !isTransparentPage ? 'text-[#1e3a8a] border-blue-200 hover:bg-blue-50' : 'text-white border-white/40 hover:bg-white/10'}`}
                aria-label="Admin login"
              >
                <Shield className="w-4 h-4 shrink-0" />
                <span className="hidden xl:inline">Admin</span>
              </Link>
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
              <Link to="/admin" className="block px-4 py-3 font-medium hover:opacity-90" onClick={() => setIsMobileMenuOpen(false)}>
                {isAdmin ? 'Dashboard' : 'Admin Login'}
              </Link>
              <div className="px-4 py-3 border-t border-current/10">
                <LanguageSelector dark={isTransparentPage && !isSticky} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Header;
