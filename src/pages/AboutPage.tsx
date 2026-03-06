import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Plus, ChevronDown } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

const ACCENT = '#374151';
const RED = '#dc2626';
const CREAM = '#FAF8F5';
const CHARCOAL = '#0f0f0f';
const WARM_GREY = '#5c5c5c';

const AboutPage: React.FC = () => {
  const { t } = useLanguage();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const aboutImages = [
    '/images/about/about-1.jpg',
    '/images/about/about-2.jpg',
    '/images/about/about-3.jpg',
    '/images/IMG_9859.JPG',
    '/images/IMG_9872.JPG',
  ];
  const fallbackImages = ['/images/IMG_9859.JPG', '/images/IMG_9872.JPG', '/images/IMG_9859.JPG'];

  const steps = [
    { key: 'step1' as const, num: '01' },
    { key: 'step2' as const, num: '02' },
    { key: 'step3' as const, num: '03' },
    { key: 'step4' as const, num: '04' },
  ];

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {/* Hero – layout asimetric: text stânga, imagini dreapta, cu stil editorial */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative text-white py-10 sm:py-14 px-4 sm:px-6 overflow-hidden"
      >
        <img
          src="/images/about/about-2.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/IMG_9872.JPG'; }}
        />
        <div className="absolute inset-0 bg-black/65" />
        {/* Accente discrete */}
        <div className="absolute top-10 right-10 opacity-15" aria-hidden>
          <ChevronDown className="w-8 h-8 text-white" />
        </div>
        <div className="absolute bottom-8 left-6 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[12px] border-b-white/25" aria-hidden />
        <div className="absolute top-1/3 right-12 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[10px] border-r-white/20" aria-hidden />

        <div className="container-custom max-w-6xl mx-auto w-full relative">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-10 lg:gap-16 items-center min-h-0">
            {/* Coloana stânga – titlu și text */}
            <div className="max-w-xl">
              <p className="text-[11px] text-white/50 uppercase tracking-[0.22em] mb-4">
                principal / {t('nav.about').toLowerCase()}
              </p>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-serif font-light leading-[1.05] tracking-tight">
                <span className="block">{t('about.title').split(' ')[0]}</span>
                <span className="block mt-1.5">{t('about.title').split(' ').slice(1).join(' ')}</span>
              </h1>
              <div className="flex items-start gap-3 mt-6">
                <span className="text-white/50 shrink-0 mt-0.5" aria-hidden><Plus className="w-4 h-4" /></span>
                <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                  {t('about.subtitle')}
                </p>
              </div>
            </div>

            {/* Coloana dreapta – două imagini mai mari, din uploads + folder */}
            <div className="flex flex-wrap items-end justify-end gap-4 sm:gap-5 lg:gap-6">
              <div className="w-44 sm:w-56 lg:w-64 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl flex-shrink-0 ring-1 ring-white/10">
                <img
                  src={aboutImages[0]}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.src = fallbackImages[0];
                  }}
                />
              </div>
              <div className="w-36 sm:w-44 lg:w-52 aspect-square rounded-xl overflow-hidden shadow-xl flex-shrink-0 mt-8 sm:mt-12 ring-1 ring-white/10 hidden sm:block">
                <img
                  src={aboutImages[2]}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.src = fallbackImages[1];
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Cine suntem – bloc text mare, fundal deschis */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-[#FAFAF9]">
        <div className="container-custom max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.2em] mb-6"
          >
            {t('about.whoWeAre')}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-2xl md:text-3xl font-serif font-light text-neutral-900 leading-tight mb-6"
          >
            {t('about.customFurnitureTitle')}
          </motion.h2>
          <div className="space-y-4 text-base md:text-lg text-neutral-600 leading-relaxed">
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }}>
              {t('about.whoWeAreP1')}
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.15 }}>
              {t('about.whoWeAreP2')}
            </motion.p>
            <motion.p initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }}>
              {t('about.whoWeAreP3')}
            </motion.p>
          </div>
        </div>
      </section>

      {/* Imagine mare cu cardurile Livrare & Montaj peste imagine */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative -mx-4 sm:mx-0 my-10 sm:my-12"
      >
        <div className="relative w-full min-h-[50vh] sm:min-h-[55vh] md:min-h-[60vh] max-h-[75vh] overflow-hidden rounded-2xl">
          <img
            src="/images/IMG_9872.JPG"
            alt="Producție și montaj"
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              if (el.src !== '/images/IMG_9859.JPG') el.src = '/images/IMG_9859.JPG';
            }}
          />
          {/* Gradient pentru lizibilitate */}
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(37,99,235,0.25) 0%, rgba(10,10,10,0.5) 50%, rgba(220,38,38,0.2) 100%)',
            }}
          />
          {/* Cardurile Livrare & Montaj */}
          <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-auto">
            <div className="flex flex-col items-center w-full max-w-2xl">
              <p className="text-[11px] font-medium text-white uppercase tracking-[0.2em] mb-4 sm:mb-5 text-center">
                • {t('about.deliveryTitle')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full justify-items-center sm:justify-items-stretch">
                {steps.map(({ key, num }, i) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="flex gap-3 p-4 sm:p-5 rounded-xl bg-white/95 backdrop-blur-md border border-white/20 shadow-xl"
                  >
                    <div
                      className="flex shrink-0 w-10 h-10 rounded-lg items-center justify-center"
                      style={{ background: i % 2 === 0 ? 'linear-gradient(135deg, #2563eb18, #2563eb10)' : 'linear-gradient(135deg, #dc262618, #dc262610)' }}
                    >
                      <span className="text-sm font-semibold tabular-nums" style={{ color: i % 2 === 0 ? '#2563eb' : '#dc2626' }}>{num}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-semibold text-neutral-800 uppercase tracking-wider mb-1">
                        {t(`about.deliverySteps.${key}.title`)}
                      </h3>
                      <p className="text-xs text-neutral-600 leading-snug">
                        {t(`about.deliverySteps.${key}.desc`)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Misiune – citat */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-[#FAFAF9]">
        <div className="container-custom max-w-3xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.2em] mb-6"
          >
            {t('about.missionLabel')}
          </motion.p>
          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="border-l-2 pl-8 py-2"
            style={{ borderColor: ACCENT }}
          >
            <p className="text-xl md:text-2xl font-serif italic text-neutral-800 leading-relaxed">
              {t('about.missionQuote')}
            </p>
          </motion.blockquote>
        </div>
      </section>

      {/* De ce să ne alegeți + video */}
      <section className="py-12 md:py-16 px-4 sm:px-6 bg-white">
        <div className="container-custom max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-[0.2em] mb-4">
              {t('about.whyChooseUs')}
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-light text-neutral-900 leading-tight mb-6">
              {t('about.whyChooseUsTitle')}
            </h2>
            <div className="space-y-4 text-neutral-600 leading-relaxed">
              <p>{t('about.whyChooseUsP1')}</p>
              <p>{t('about.whyChooseUsP2')}</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2 rounded-2xl overflow-hidden aspect-[9/16] max-h-[70vh] bg-black"
          >
            <video
              className="w-full h-full object-contain"
              src="/images/video/about.mp4"
              autoPlay
              playsInline
              muted
              loop
              controls
              preload="auto"
            />
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-10 md:py-14 px-4 sm:px-6 text-white text-center overflow-x-hidden">
        <img
          src="/images/about/about-3.jpg"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = '/images/IMG_9859.JPG'; }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative z-10 text-2xl md:text-3xl font-serif font-light mb-10 max-w-2xl mx-auto"
        >
          {t('about.ctaText')}
        </motion.h2>
        <Link
          to="/contact"
          className="relative z-10 group inline-flex items-center gap-3 px-8 py-4 border-2 border-white text-white font-medium tracking-wide transition-all hover:bg-white hover:text-[#0a0a0a]"
        >
          {t('about.ctaButton')}
          <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
        </Link>
      </section>
    </div>
  );
};

export default AboutPage;
