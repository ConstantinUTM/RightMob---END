import React, { useEffect, useRef, useState } from 'react';
import './FloatingButtons.css';

function getDeviceInfo(): string {
  const ua = navigator.userAgent;
  if (/iPhone/i.test(ua)) return 'iPhone';
  if (/iPad/i.test(ua)) return 'iPad';
  if (/Android/i.test(ua)) return 'Android';
  return 'Desktop';
}

function getLocationFromTimezone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const city = tz.split('/').pop()?.replace(/_/g, ' ') || '';
    return city;
  } catch { return ''; }
}

function getSiteLang(): string {
  const stored = localStorage.getItem('app_lang') || localStorage.getItem('language') || localStorage.getItem('lang');
  if (stored) return stored.toUpperCase();
  return document.documentElement.lang?.toUpperCase() || 'RO';
}

function getPageContext(): { page: string; details: string } {
  const path = window.location.pathname;
  if (path.startsWith('/galerie/') || path.startsWith('/produs/')) {
    const h1 = document.querySelector('h1');
    const name = h1?.textContent?.trim();
    if (name) return { page: 'Produs / Galerie', details: `Sunt interesat de: *${name}*\nLink: ${window.location.href}` };
  }
  if (path === '/galerie') return { page: 'Galerie', details: 'Am navigat prin galeria de produse' };
  if (path === '/despre') return { page: 'Despre noi', details: 'Am vizitat pagina Despre noi' };
  if (path === '/contact') return { page: 'Contact', details: 'Am vizitat pagina de Contact' };
  return { page: 'Pagina principală', details: '' };
}

function sendTrack(source: string): void {
  const device = getDeviceInfo();
  const city = getLocationFromTimezone();
  const lang = getSiteLang();
  const ctx = getPageContext();
  fetch('/api/email-track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device, city, lang, page: ctx.page, pageDetails: ctx.details, source }),
  }).catch(() => {});
}

function buildMessage(format: 'whatsapp' | 'viber' | 'email'): string {
  const ctx = getPageContext();

  const detailsBlock = ctx.details ? `${ctx.details}\n\n` : '';

  if (format === 'email') {
    return (
      'Bună ziua,\n\n' +
      'V-am contactat prin intermediul site-ului RightMob.\n' +
      (ctx.details ? `${ctx.details}\n` : '') +
      '\nAș dori să solicit o consultație și mai multe detalii despre serviciile dumneavoastră.\n\n' +
      'Vă mulțumesc anticipat!\n' +
      'Cu respect,\n'
    );
  }

  if (format === 'viber') {
    return (
      `Bună ziua!\n\n` +
      detailsBlock +
      `Aș dori mai multe detalii și o consultație.\n\n` +
      `Mulțumesc!`
    );
  }

  return (
    `Bună ziua! 👋\n\n` +
    detailsBlock +
    `Aș dori mai multe detalii și o consultație.\n\n` +
    `Vă mulțumesc!`
  );
}

const FloatingButtons: React.FC = () => {
  const [emailMenuOpen, setEmailMenuOpen] = useState(false);
  const emailMenuRef = useRef<HTMLDivElement | null>(null);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '37378685363';
  const viberNumber = import.meta.env.VITE_VIBER_NUMBER || '37378685363';
  const emailTargets = [
    {
      label: 'Info',
      email: 'info@rightmob.md',
      subject: 'Solicitare informații generale - RightMob',
      intro: 'Doresc informații generale despre produse, showroom și colaborări.',
    },
    {
      label: 'Ofertă',
      email: 'oferta@rightmob.md',
      subject: 'Solicitare ofertă personalizată - RightMob',
      intro: 'Doresc o ofertă personalizată pentru mobilier la comandă.',
    },
    {
      label: 'Comenzi',
      email: 'comenzi@rightmob.md',
      subject: 'Solicitare privind comandă/livrare - RightMob',
      intro: 'Doresc detalii despre status comandă, livrare sau instalare.',
    },
  ];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (!emailMenuRef.current) return;
      if (!emailMenuRef.current.contains(e.target as Node)) {
        setEmailMenuOpen(false);
      }
    };

    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setEmailMenuOpen(false);
    };

    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  const openWhatsApp = () => {
    sendTrack('whatsapp');
    const msg = encodeURIComponent(buildMessage('whatsapp'));
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const url = isMobile
      ? `whatsapp://send?phone=${whatsappNumber}&text=${msg}`
      : `https://wa.me/${whatsappNumber}?text=${msg}`;
    window.open(url, '_blank');
  };
  const openViber = () => {
    sendTrack('viber');
    const msg = encodeURIComponent(buildMessage('viber'));
    window.open(`viber://chat?number=%2B${viberNumber}&text=${msg}`, '_blank');
  };
  const openEmail = (target: { email: string; subject: string; intro: string }) => {
    sendTrack(`email:${target.email}`);
    const ctx = getPageContext();
    const subject = encodeURIComponent(target.subject);
    const body = encodeURIComponent(
      `Bună ziua,\n\n${target.intro}\n${ctx.details ? `\n${ctx.details}\n` : '\n'}\nAștept mai multe detalii.\n\nMulțumesc!\n`
    );
    const gmailUrl = `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(target.email)}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setEmailMenuOpen(false);
  };

  return (
    <div className="floating-buttons-container">
      <button className="bloom-button whatsapp-bloom" onClick={openWhatsApp} aria-label="WhatsApp" title="WhatsApp">
        <div className="bloom-container">
          <div className="button-container-main">
            <div className="button-inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="svg" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
            <div className="bloom bloom1" /><div className="bloom bloom2" />
          </div>
        </div>
      </button>
      <div className={`email-selector-wrapper ${emailMenuOpen ? 'open' : ''}`} ref={emailMenuRef}>
        <button
          className="bloom-button gmail-bloom"
          onClick={() => setEmailMenuOpen((prev) => !prev)}
          aria-label="Email"
          title="Email"
          aria-expanded={emailMenuOpen}
          aria-haspopup="menu"
        >
          <div className="bloom-container">
            <div className="button-container-main">
              <div className="button-inner">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="svg" fill="white">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
              </div>
              <div className="bloom bloom1" /><div className="bloom bloom2" />
            </div>
          </div>
        </button>
        <div className="email-menu" role="menu" aria-label="Selectează adresa de email">
          {emailTargets.map((target) => (
            <button
              key={target.email}
              type="button"
              role="menuitem"
              className="email-menu-item"
              onClick={() => openEmail(target)}
              title={target.email}
            >
              <span className="email-menu-label">{target.label}</span>
              <span className="email-menu-address">{target.email}</span>
            </button>
          ))}
        </div>
      </div>
      <button className="bloom-button viber-bloom" onClick={openViber} aria-label="Viber" title="Viber">
        <div className="bloom-container">
          <div className="button-container-main">
            <div className="button-inner">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="svg" fill="white">
                <path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.323 6.812-.416 7.15-.525.776-.252 5.176-.815 5.89-6.657.734-6.014-.418-9.817-2.1-11.517C19.87.963 16.055.05 12.026 0h-.65.024zm.043 1.803h.495c3.64.043 6.91.828 8.34 2.18 1.447 1.37 2.363 4.553 1.725 9.684-.58 4.666-3.96 5.034-4.618 5.245-.3.098-3.008.773-6.315.524 0 0-2.52 3.04-3.3 3.82-.124.13-.293.17-.392.15-.13-.03-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.295-4.43-8.862.054-2.564.567-4.66 1.99-6.023 1.917-1.814 5.412-2.097 7.05-2.133v-.153zm.202 1.698c-.2.007-.357.057-.357.36 0 .304.19.332.43.332 2.36.063 4.51.67 5.994 1.955 1.49 1.29 2.03 3.083 2.097 5.42.008.23-.01.407.24.482.32.098.476-.06.49-.31.067-2.567-.6-4.63-2.31-6.113-1.718-1.488-4.134-2.128-6.584-2.125zm-3.84 2.05c-.39 0-.707.082-1.005.277l-.01.01c-.31.2-.604.44-.87.71-.26.263-.35.578-.348.873.01.585.22 1.087.596 1.64.75 1.106 1.918 2.603 3.456 4.142 1.54 1.538 3.044 2.71 4.15 3.46.554.376 1.056.587 1.64.597.296.003.61-.087.874-.348.27-.266.51-.56.71-.87l.01-.01c.197-.297.278-.614.278-1.004 0-.292-.11-.594-.398-.895-.387-.403-1.167-.957-1.77-1.414-.457-.347-.95-.328-1.295.017l-.935.935c-.26.26-.586.25-.586.25-3.083-.78-3.86-3.86-3.86-3.86s-.01-.326.25-.586l.935-.935c.346-.346.364-.84.017-1.296-.457-.602-1.01-1.382-1.413-1.77-.3-.287-.603-.398-.894-.398z" />
              </svg>
            </div>
            <div className="bloom bloom1" /><div className="bloom bloom2" />
          </div>
        </div>
      </button>
    </div>
  );
};

export default FloatingButtons;
