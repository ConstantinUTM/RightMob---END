import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSiteContent } from '../contexts/SiteContentContext';
import { getApiBase } from '../lib/api';

const ACCENT = '#374151';
const CREAM = '#FAF8F5';
const CHARCOAL = '#1a1a1a';
const WARM_GREY = '#5c5c5c';

const SUPPORT_EMAILS = [
  {
    type: 'info' as const,
    label: 'Informații generale',
    email: 'info@rightmob.md',
    note: 'Întrebări despre produse, showroom și colaborări.',
  },
  {
    type: 'offer' as const,
    label: 'Oferte personalizate',
    email: 'oferta@rightmob.md',
    note: 'Solicitări de preț pentru mobilier la comandă.',
  },
  {
    type: 'orders' as const,
    label: 'Comenzi',
    email: 'comenzi@rightmob.md',
    note: 'Status comandă, livrare și instalare.',
  },
];

const iconByType = {
  info: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 11V16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  offer: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
      <path d="M4.5 8.5V6a1.5 1.5 0 011.5-1.5h9.2c.4 0 .78.16 1.06.44l3.3 3.3c.28.28.44.66.44 1.06V18A1.5 1.5 0 0118.5 19.5H6A1.5 1.5 0 014.5 18v-2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 12h6M9 15h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
  orders: (
    <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden>
      <path d="M3.5 8.5l8.5-4 8.5 4-8.5 4-8.5-4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M3.5 8.5V16l8.5 4 8.5-4V8.5" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="M12 12.5V20" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  ),
};

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const { getImageOverride } = useSiteContent();
  const heroImage = getImageOverride('contact.heroImage', '/uploads/1771366598610-2026-02-16_20.35.51.jpg');
  const sideImage = getImageOverride('contact.sideImage', '/uploads/1771368519326-Photo__14_of_38_.jpg');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [phoneError, setPhoneError] = useState('');

  const phoneNumber = import.meta.env.VITE_COMPANY_PHONE || '+373 XX XX XX XX';
  const email = import.meta.env.VITE_COMPANY_EMAIL || 'contact@rightmob.md';
  const address = import.meta.env.VITE_COMPANY_ADDRESS || 'Ismail 33, Chișinău';
  const schedule = import.meta.env.VITE_COMPANY_SCHEDULE || 'Lu - Sâm: 09:00 - 18:00';
  const mapsPlaceId = import.meta.env.VITE_GOOGLE_MAPS_PLACE_ID || '';
  const addressForMap = import.meta.env.VITE_GOOGLE_MAPS_QUERY || 'RIGHT MOB, Strada Ismail 33, MD-2001, Chișinău, Moldova';
  const mapsEmbedOverride = import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL || '';
  const mapsSearchUrl = mapsPlaceId
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}&query_place_id=${encodeURIComponent(mapsPlaceId)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressForMap)}`;
  const mapsEmbedUrl = mapsEmbedOverride
    || (mapsPlaceId
      ? `https://maps.google.com/maps?output=embed&q=place_id:${encodeURIComponent(mapsPlaceId)}`
      : `https://maps.google.com/maps?output=embed&q=${encodeURIComponent(addressForMap)}`);
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '373XXXXXXXX';
  const viberNumber = import.meta.env.VITE_VIBER_NUMBER || '373XXXXXXXX';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/rightmob';
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/rightmob';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const buildGmailCardUrl = (type: 'info' | 'offer' | 'orders', targetEmail: string) => {
    const contentByType = {
      info: {
        subject: 'Solicitare informații generale - RightMob',
        intro: 'Doresc informații generale despre produse, showroom și colaborări.',
      },
      offer: {
        subject: 'Solicitare ofertă personalizată - RightMob',
        intro: 'Doresc o ofertă personalizată pentru mobilier la comandă.',
      },
      orders: {
        subject: 'Solicitare privind comandă/livrare - RightMob',
        intro: 'Doresc detalii despre status comandă, livrare sau instalare.',
      },
    };

    const selected = contentByType[type];
    const body = [
      'Bună ziua,',
      '',
      selected.intro,
      '',
      'Aștept mai multe detalii.',
      '',
      'Mulțumesc!',
    ].join('\n');

    return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(selected.subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      const digits = value.replace(/\D/g, '').slice(0, 9);
      setFormData((prev) => ({ ...prev, phone: digits }));
      if (phoneError) setPhoneError('');
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setPhoneError('');

    const normalizedPhone = formData.phone.trim();
    if (normalizedPhone && !/^0\d{8}$/.test(normalizedPhone)) {
      setPhoneError('Telefon invalid. Folosește format MD cu 9 cifre, ex: 078685363.');
      setSubmitStatus('error');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${getApiBase()}/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone: normalizedPhone, timestamp: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitStatus('success');
      setPhoneError('');
      setFormData({ fullName: '', email: '', phone: '', message: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendTrack = (source: string, pageDetails = '') => {
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
        pageDetails,
        source,
      }),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      {/* Hero – imagine full-bleed */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden rounded-t-none rounded-b-3xl"
      >
        <img
          src={heroImage}
          alt="Contact"
          className="absolute inset-0 w-full h-full object-cover rounded-t-none rounded-b-3xl"
          {...({ fetchpriority: 'high' } as React.ImgHTMLAttributes<HTMLImageElement>)}
          loading="eager"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            if (el.dataset.fallbackApplied === '1') {
              el.src = '/images/IMG_9859.JPG';
              return;
            }
            el.dataset.fallbackApplied = '1';
            el.src = '/images/about/about-2.jpg';
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
          }}
        />
        <div className="absolute inset-0 flex items-end pb-16 md:pb-20">
          <div className="container-custom max-w-5xl w-full">
            <span
              className="inline-block text-[11px] font-semibold uppercase tracking-[0.35em] mb-4 text-white/90"
              style={{ letterSpacing: '0.35em' }}
            >
              {t('contact.badge')}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold text-white leading-[1.1] tracking-tight max-w-2xl">
              {t('contact.title')}
            </h1>
            <p className="text-white/90 mt-4 text-lg max-w-xl">
              {t('contact.subtitle')}
            </p>
          </div>
        </div>
      </motion.section>

      <div className="relative pt-16 pb-28">
        <div className="container-custom max-w-6xl">
          {/* Layout tip referință: imagine showroom stânga, panou alb dreapta (titlu + contact + formular) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-0 mb-24 overflow-hidden rounded-2xl shadow-xl"
          >
            {/* Stânga – imagine showroom */}
            <div className="relative min-h-[320px] lg:min-h-[560px] bg-neutral-200">
              <img
                src={sideImage}
                alt="Showroom RIGHT MOB"
                className="absolute inset-0 w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    if (el.dataset.fallbackApplied === '1') {
                      el.src = '/images/IMG_9859.JPG';
                      return;
                    }
                    el.dataset.fallbackApplied = '1';
                    el.src = '/images/about/about-2.jpg';
                  }}
              />
            </div>

            {/* Dreapta – panou alb: titlu, slogan, listă contact, formular */}
            <div className="bg-white p-8 md:p-10 lg:p-12 flex flex-col">
              {/* Listă contact – minimalistă, icon + text */}
              <ul className="space-y-4">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-neutral-800" />
                  <a href={`tel:${phoneNumber.replace(/\s/g, '')}`} className="text-neutral-700 hover:text-neutral-900 hover:underline underline-offset-4 text-sm md:text-base transition-colors">
                    {phoneNumber}
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Bună ziua! Aș dori mai multe detalii despre produsele RightMob.')}`}
                    onClick={() => sendTrack('whatsapp', 'Click WhatsApp din blocul principal de contact')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 p-1.5 rounded-full text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-neutral-800" />
                  <a
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-600 hover:text-neutral-900 text-sm md:text-base transition-colors underline-offset-4 hover:underline"
                  >
                    {address}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-neutral-800" />
                  <span className="text-neutral-700 text-sm md:text-base break-all transition-colors">
                    {email}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-5 h-5 shrink-0 text-neutral-800" />
                  <span className="text-neutral-600 text-sm md:text-base">{schedule}</span>
                </li>
              </ul>

              {/* Formular */}
              <div className="mt-10 pt-8 border-t border-neutral-100">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">
                  {t('contact.formTitle')}
                </p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('contact.name')} *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder={t('contact.placeholders.name')}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/30 transition-all placeholder:text-neutral-400 text-neutral-900"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('contact.email')} *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder={t('contact.placeholders.email')}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/30 transition-all placeholder:text-neutral-400 text-neutral-900"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('contact.phone')} ({t('contact.optional') || 'opțional'})</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder={t('contact.placeholders.phone')}
                      inputMode="numeric"
                      maxLength={9}
                      pattern="0[0-9]{8}"
                      className={`w-full px-4 py-3 border rounded-lg focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/30 transition-all placeholder:text-neutral-400 text-neutral-900 ${phoneError ? 'border-red-300 bg-red-50/40' : 'border-neutral-200'}`}
                    />
                    <p className={`mt-1 text-xs ${phoneError ? 'text-red-600' : 'text-neutral-500'}`}>
                      {phoneError || 'Format MD: 9 cifre, începe cu 0 (ex: 078685363).'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-600 mb-1.5">{t('contact.message')} *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder={t('contact.messagePlaceholder')}
                      rows={4}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/30 transition-all resize-none placeholder:text-neutral-400 text-neutral-900"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-60 hover:opacity-95"
                    style={{ background: ACCENT }}
                  >
                    {isSubmitting ? t('contact.sending') : t('contact.send')}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  {submitStatus === 'success' && (
                    <p className="text-sm text-emerald-600">{t('contact.success')}</p>
                  )}
                  {submitStatus === 'error' && (
                    <p className="text-sm text-red-600">{t('contact.error')}</p>
                  )}
                  <p className="text-[11px] text-neutral-400">{t('contact.privacy')}</p>
                </form>
              </div>
            </div>
          </motion.div>

          {/* Emailuri dedicate - secțiune separată */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mb-14"
          >
            <div className="rounded-2xl p-4 md:p-5 border bg-white" style={{ borderColor: 'rgba(26,26,26,0.08)' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {SUPPORT_EMAILS.map((item, idx) => {
                  const accent = idx === 1 ? '#2563eb' : '#dc2626';
                  return (
                    <motion.a
                      href={buildGmailCardUrl(item.type, item.email)}
                      onClick={() => sendTrack(`email:${item.email}`, `Click email dedicat: ${item.label}`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      key={item.email}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.08 + idx * 0.06 }}
                      className="group rounded-xl p-4 border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md bg-white"
                      style={{ borderColor: `${accent}40` }}
                    >
                      <div className="inline-flex items-center justify-center rounded-lg w-10 h-10 mb-2" style={{ color: accent, backgroundColor: `${accent}14` }}>
                        {iconByType[item.type]}
                      </div>

                      <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-neutral-500 mb-1">
                        {item.label}
                      </p>
                      <p className="text-base font-semibold break-all" style={{ color: accent }}>
                        {item.email}
                      </p>
                      <p className="text-xs text-neutral-600 leading-relaxed mt-2 min-h-[36px]">
                        {item.note}
                      </p>
                    </motion.a>
                  );
                })}
              </div>
            </div>
          </motion.section>

          <div className="h-px w-16 mb-12" style={{ backgroundColor: ACCENT }} aria-hidden />

          {/* Hartă */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mb-24"
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-4"
              style={{ color: ACCENT }}
            >
              Locație
            </p>
            <div className="overflow-hidden border rounded-2xl shadow-lg" style={{ borderColor: 'rgba(26,26,26,0.12)' }}>
              <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr]">
                <div className="p-6 lg:p-8 bg-white border-b lg:border-b-0 lg:border-r rounded-t-2xl lg:rounded-tl-2xl lg:rounded-tr-none lg:rounded-br-none lg:rounded-bl-2xl" style={{ borderColor: 'rgba(26,26,26,0.08)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: ACCENT }}>
                    {t('contact.showroom.title')}
                  </p>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: WARM_GREY }}>{address}</p>
                  <a
                    href={mapsSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium hover:underline"
                    style={{ color: ACCENT }}
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    {t('contact.openInMaps')}
                  </a>
                </div>
                <div className="min-h-[320px] lg:min-h-[380px] rounded-b-2xl lg:rounded-bl-none lg:rounded-tr-2xl lg:rounded-br-2xl overflow-hidden">
                  <iframe
                    title="Locație pe hartă"
                    src={mapsEmbedUrl}
                    className="w-full h-full min-h-[320px] lg:min-h-[380px] border-0 block"
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Social */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.28 }}
            className="text-center"
          >
            <p
              className="text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: ACCENT }}
            >
              {t('contact.followUs')}
            </p>
            <h3 className="text-xl font-serif font-bold mb-8" style={{ color: CHARCOAL }}>
              {t('contact.socialSubtitle')}
            </h3>
            <div className="flex flex-wrap justify-center gap-5">
              {[
                { href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Bună ziua! Aș dori mai multe detalii despre produsele RightMob.')}`, label: 'WhatsApp', icon: 'wa', color: '#25D366', hoverBg: 'linear-gradient(135deg, #25D366, #20BA5A)', trackSource: 'whatsapp' },
                { href: `viber://chat?number=%2B${viberNumber}`, label: 'Viber', icon: 'viber', color: '#665CAC', hoverBg: 'linear-gradient(135deg, #665CAC, #59509D)', trackSource: 'viber' },
                { href: instagramUrl, label: 'Instagram', icon: 'ig', color: '#E1306C', hoverBg: 'linear-gradient(135deg, #f09433, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888)' },
                { href: facebookUrl, label: 'Facebook', icon: 'fb', color: '#1877F2', hoverBg: 'linear-gradient(135deg, #1877F2, #0C5FCD)' },
              ].map((s) => (
                  <motion.a
                    key={s.label}
                    href={s.href}
                    onClick={() => {
                      if (s.trackSource) {
                        sendTrack(s.trackSource, `Click ${s.label} din secțiunea social`);
                      }
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon-contact flex items-center justify-center w-16 h-16 rounded-2xl border transition-all duration-300 shadow-sm"
                    style={{ '--icon-color': s.color, '--icon-hover-bg': s.hoverBg, color: s.color, background: 'rgba(255,255,255,0.9)', borderColor: 'rgba(0,0,0,0.08)' } as React.CSSProperties}
                    whileHover={{ scale: 1.08, y: -3 }}
                    whileTap={{ scale: 0.96 }}
                    aria-label={s.label}
                  >
                    {s.icon === 'wa' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                      </svg>
                    )}
                    {s.icon === 'viber' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                        <path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.323 6.812-.416 7.15-.525.776-.252 5.176-.815 5.89-6.657.734-6.014-.418-9.817-2.1-11.517C19.87.963 16.055.05 12.026 0h-.65.024zm.043 1.803h.495c3.64.043 6.91.828 8.34 2.18 1.447 1.37 2.363 4.553 1.725 9.684-.58 4.666-3.96 5.034-4.618 5.245-.3.098-3.008.773-6.315.524 0 0-2.52 3.04-3.3 3.82-.124.13-.293.17-.392.15-.13-.03-.166-.188-.165-.414l.02-4.018c-4.762-1.32-4.485-6.295-4.43-8.862.054-2.564.567-4.66 1.99-6.023 1.917-1.814 5.412-2.097 7.05-2.133v-.153zm.202 1.698c-.2.007-.357.057-.357.36 0 .304.19.332.43.332 2.36.063 4.51.67 5.994 1.955 1.49 1.29 2.03 3.083 2.097 5.42.008.23-.01.407.24.482.32.098.476-.06.49-.31.067-2.567-.6-4.63-2.31-6.113-1.718-1.488-4.134-2.128-6.584-2.125zm-3.84 2.05c-.39 0-.707.082-1.005.277l-.01.01c-.31.2-.604.44-.87.71-.26.263-.35.578-.348.873.01.585.22 1.087.596 1.64.75 1.106 1.918 2.603 3.456 4.142 1.54 1.538 3.044 2.71 4.15 3.46.554.376 1.056.587 1.64.597.296.003.61-.087.874-.348.27-.266.51-.56.71-.87l.01-.01c.197-.297.278-.614.278-1.004 0-.292-.11-.594-.398-.895-.387-.403-1.167-.957-1.77-1.414-.457-.347-.95-.328-1.295.017l-.935.935c-.26.26-.586.25-.586.25-3.083-.78-3.86-3.86-3.86-3.86s-.01-.326.25-.586l.935-.935c.346-.346.364-.84.017-1.296-.457-.602-1.01-1.382-1.413-1.77-.3-.287-.603-.398-.894-.398z" />
                      </svg>
                    )}
                    {s.icon === 'ig' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 15.838a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    )}
                    {s.icon === 'fb' && (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    )}
                  </motion.a>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
