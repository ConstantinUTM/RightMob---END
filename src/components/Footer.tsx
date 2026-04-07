import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiBase } from '../lib/api';
import Logo from './Logo';

const Footer: React.FC = () => {
  const { t } = useLanguage();
  const phoneNumber = import.meta.env.VITE_COMPANY_PHONE || '+373 78 68 53 63';
  const email = import.meta.env.VITE_COMPANY_EMAIL || 'contact@rightmob.md';
  const address = import.meta.env.VITE_COMPANY_ADDRESS || 'Chișinău, Moldova';
  const schedule = import.meta.env.VITE_COMPANY_SCHEDULE || 'Lu - Sâm: 09:00 - 18:00';
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '37378685363';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/rightmob';
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/rightmob';
  const addressForMap = (() => {
    const raw = (address || '').trim();
    const withoutEt = raw.split(/\s+et\./i)[0].trim();
    const withoutOf = withoutEt.split(/\s+of\./i)[0].trim();
    return withoutOf.split(',')[0].trim() || raw;
  })();

  const handlePhoneClick = () => {
    window.location.href = `tel:${phoneNumber.replace(/\s/g, '')}`;
  };

  const handleMapsClick = () => {
    window.open(`https://maps.google.com/?q=${encodeURIComponent(addressForMap)}`, '_blank');
  };

  const sendTrack = (source: string) => {
    const device = /iPhone/i.test(navigator.userAgent)
      ? 'iPhone'
      : /iPad/i.test(navigator.userAgent)
        ? 'iPad'
        : /Android/i.test(navigator.userAgent)
          ? 'Android'
          : 'Desktop';
    const city = (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone.split('/').pop()?.replace(/_/g, ' ') || '';
      } catch {
        return '';
      }
    })();
    const lang = (localStorage.getItem('app_lang') || document.documentElement.lang || 'ro').toUpperCase();

    fetch(`${getApiBase()}/api/email-track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device,
        city,
        lang,
        page: window.location.pathname,
        source,
      }),
    }).catch(() => {});
  };

  return (
    <footer className="bg-dark-950 text-white overflow-x-hidden">
      {/* Main Footer Content */}
      <div className="container-custom py-16 max-w-[100vw]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-6">
            <Logo size="md" />
            <p className="text-gray-400 leading-relaxed">
              {t('footer.aboutText')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">{t('footer.quickLinks')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('nav.home'), path: '/' },
                { name: t('nav.products'), path: '/galerie' },
                { name: t('nav.about'), path: '/despre' },
                { name: t('nav.contact'), path: '/contact' },
              ].map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors duration-300 inline-block hover:translate-x-2 transform"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Colecții */}
          <div>
            <h4 className="text-lg font-semibold mb-6">{t('collections.title')}</h4>
            <ul className="space-y-3">
              {[
                { name: t('products.categories.living'), path: '/mobilier/living' },
                { name: t('products.categories.bedroom'), path: '/mobilier/dormitor' },
                { name: t('products.categories.dining'), path: '/mobilier/bucatarie' },
                { name: t('products.categories.office'), path: '/mobilier/birou' },
              ].map((collection) => (
                <li key={collection.name}>
                  <Link
                    to={collection.path}
                    className="text-gray-400 hover:text-primary-400 transition-colors duration-300 inline-block hover:translate-x-2 transform"
                  >
                    {collection.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-lg font-semibold mb-6">{t('contact.title')}</h4>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <button
                  type="button"
                  onClick={handlePhoneClick}
                  className="text-left hover:text-primary-400 transition-colors"
                >
                  {phoneNumber}
                </button>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <a
                  href={`mailto:${email}`}
                  onClick={() => sendTrack(`email:${email}`)}
                  className="hover:text-primary-400 transition-colors"
                >
                  {email}
                </a>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <button
                  type="button"
                  onClick={handleMapsClick}
                  className="text-left hover:text-primary-400 transition-colors"
                >
                  {address}
                </button>
              </li>
              <li className="flex items-start space-x-3 text-gray-400">
                <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                <span>{schedule}</span>
              </li>
            </ul>

            {/* Social Media Icons */}
            <div className="flex items-center space-x-3">
              {/* WhatsApp */}
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Bună ziua! 👋\n\nV-am contactat prin site-ul RightMob.\nAș dori mai multe detalii și o consultație.\n\nVă mulțumesc!`)}`}
                onClick={() => sendTrack('whatsapp')}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-footer whatsapp"
                aria-label="WhatsApp"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
              </a>

              {/* Viber */}
              <a
                href={`viber://chat?number=%2B${import.meta.env.VITE_VIBER_NUMBER || '37378685363'}`}
                onClick={() => sendTrack('viber')}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-footer viber"
                aria-label="Viber"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.323 6.812-.416 7.15-.525.776-.252 5.176-.815 5.89-6.657.734-6.014-.418-9.817-2.1-11.517C19.87.963 16.055.05 12.026 0h-.65.024zm.043 1.803h.495c3.64.043 6.91.828 8.34 2.18 1.447 1.37 2.363 4.553 1.725 9.684-.58 4.666-3.96 5.034-4.618 5.245-.3.098-3.008.773-6.315.524 0 0-2.52 3.04-3.3 3.82-.124.13-.293.17-.392.15-.13-.03-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.295-4.43-8.862.054-2.564.567-4.66 1.99-6.023 1.917-1.814 5.412-2.097 7.05-2.133v-.153zm.202 1.698c-.2.007-.357.057-.357.36 0 .304.19.332.43.332 2.36.063 4.51.67 5.994 1.955 1.49 1.29 2.03 3.083 2.097 5.42.008.23-.01.407.24.482.32.098.476-.06.49-.31.067-2.567-.6-4.63-2.31-6.113-1.718-1.488-4.134-2.128-6.584-2.125zm-3.84 2.05c-.39 0-.707.082-1.005.277l-.01.01c-.31.2-.604.44-.87.71-.26.263-.35.578-.348.873.01.585.22 1.087.596 1.64.75 1.106 1.918 2.603 3.456 4.142 1.54 1.538 3.044 2.71 4.15 3.46.554.376 1.056.587 1.64.597.296.003.61-.087.874-.348.27-.266.51-.56.71-.87l.01-.01c.197-.297.278-.614.278-1.004 0-.292-.11-.594-.398-.895-.387-.403-1.167-.957-1.77-1.414-.457-.347-.95-.328-1.295.017l-.935.935c-.26.26-.586.25-.586.25-3.083-.78-3.86-3.86-3.86-3.86s-.01-.326.25-.586l.935-.935c.346-.346.364-.84.017-1.296-.457-.602-1.01-1.382-1.413-1.77-.3-.287-.603-.398-.894-.398z" />
                </svg>
              </a>

              {/* Instagram */}
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-footer instagram"
                aria-label="Instagram"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* Facebook */}
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-footer facebook"
                aria-label="Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6">
          <p className="text-gray-400 text-sm text-center">
            © {new Date().getFullYear()} RIGHT MOB. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
