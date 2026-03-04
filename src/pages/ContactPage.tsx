import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getUploadsBase } from '../lib/api';

const ACCENT = '#374151';
const RED = '#dc2626';
const CREAM = '#FAF8F5';
const CHARCOAL = '#1a1a1a';
const WARM_GREY = '#5c5c5c';

const ContactPage: React.FC = () => {
  const { t } = useLanguage();
  const base = getUploadsBase();
  const heroImage = `${base}/uploads/1771366598610-2026-02-16_20.35.51.jpg`;
  const sideImage = `${base}/uploads/1771368519326-Photo__14_of_38_.jpg`;
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const phoneNumber = import.meta.env.VITE_COMPANY_PHONE || '+373 XX XX XX XX';
  const email = import.meta.env.VITE_COMPANY_EMAIL || 'contact@rightmob.md';
  const address = import.meta.env.VITE_COMPANY_ADDRESS || 'Ismail 33, Chișinău';
  const schedule = import.meta.env.VITE_COMPANY_SCHEDULE || 'Lu - Sâm: 09:00 - 18:00';
  const addressForMap = (() => {
    const raw = (address || '').trim();
    const withoutEt = raw.split(/\s+et\./i)[0].trim();
    const withoutOf = withoutEt.split(/\s+of\./i)[0].trim();
    const firstPart = withoutOf.split(',')[0].trim();
    return firstPart || raw;
  })();
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '373XXXXXXXX';
  const viberNumber = import.meta.env.VITE_VIBER_NUMBER || '373XXXXXXXX';
  const instagramUrl = import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/rightmob';
  const facebookUrl = import.meta.env.VITE_FACEBOOK_URL || 'https://facebook.com/rightmob';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    try {
      const hostname = window.location.hostname;
      const res = await fetch(`http://${hostname}:3001/api/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, timestamp: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed');
      setSubmitStatus('success');
      setFormData({ fullName: '', email: '', phone: '', message: '' });
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: CREAM }}>
      {/* Hero – imagine full-bleed */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        className="relative h-[55vh] min-h-[380px] max-h-[600px] overflow-hidden rounded-b-3xl"
      >
        <img
          src={heroImage}
          alt="Contact"
          className="absolute inset-0 w-full h-full object-cover rounded-b-3xl"
          fetchPriority="high"
          loading="eager"
          onError={(e) => {
            const el = e.target as HTMLImageElement;
            if (el.src !== '/images/about/about-2.jpg') el.src = '/images/about/about-2.jpg';
            else if (el.src !== '/images/IMG_9859.JPG') el.src = '/images/IMG_9859.JPG';
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
                    if (el.src !== '/images/about/about-2.jpg') el.src = '/images/about/about-2.jpg';
                    else if (el.src !== '/images/IMG_9859.JPG') el.src = '/images/IMG_9859.JPG';
                    else el.style.display = 'none';
                  }}
              />
            </div>

            {/* Dreapta – panou alb: titlu, slogan, listă contact, formular */}
            <div className="bg-white p-8 md:p-10 lg:p-12 flex flex-col">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-neutral-900 tracking-tight">
                {t('contact.title')}
              </h2>
              <p className="mt-3 text-sm md:text-base text-neutral-500 leading-relaxed max-w-md">
                {t('contact.subtitle')}
              </p>

              {/* Listă contact – minimalistă, icon + text */}
              <ul className="mt-8 space-y-4">
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 shrink-0 text-neutral-800" />
                  <a href={`tel:${phoneNumber.replace(/\s/g, '')}`} className="text-neutral-700 hover:text-neutral-900 text-sm md:text-base transition-colors">
                    {phoneNumber}
                  </a>
                  <a
                    href={`https://wa.me/${whatsappNumber}`}
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
                  <span className="text-neutral-600 text-sm md:text-base">{address}</span>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 shrink-0 text-neutral-800" />
                  <a href={`mailto:${email}`} className="text-neutral-700 hover:text-neutral-900 text-sm md:text-base break-all transition-colors">
                    {email}
                  </a>
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
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/30 transition-all placeholder:text-neutral-400 text-neutral-900"
                    />
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
                    style={{ background: `linear-gradient(90deg, ${ACCENT} 0%, ${RED} 100%)` }}
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
                    href={`https://www.google.com/maps?q=${encodeURIComponent(addressForMap)}`}
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
                    src={`https://www.google.com/maps?q=${encodeURIComponent(addressForMap)}&z=15&output=embed`}
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
                { href: `https://wa.me/${whatsappNumber}`, label: 'WhatsApp', icon: 'wa' },
                { href: `viber://chat?number=%2B${viberNumber}`, label: 'Viber', icon: 'viber' },
                { href: instagramUrl, label: 'Instagram', icon: 'ig' },
                { href: facebookUrl, label: 'Facebook', icon: 'fb' },
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`social-contact-icon social-contact-icon-${s.icon}`}
                  whileHover={{ scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  aria-label={s.label}
                >
                  {s.icon === 'wa' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                  )}
                  {s.icon === 'viber' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden>
                      <path d="M11.4 0C9.473.028 5.333.344 3.02 2.467 1.302 4.187.696 6.7.633 9.817.57 12.933.488 18.776 6.12 20.36h.003l-.004 2.416s-.037.977.61 1.177c.777.242 1.234-.5 1.98-1.302.407-.44.972-1.084 1.397-1.58 3.85.323 6.812-.416 7.15-.525.776-.252 5.176-.815 5.89-6.657.734-6.014-.418-9.817-2.1-11.517C19.87.963 16.055.05 12.026 0h-.65.024z" />
                    </svg>
                  )}
                  {s.icon === 'ig' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" fillRule="evenodd" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069z M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324z M18.406 5.155a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  )}
                  {s.icon === 'fb' && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
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
