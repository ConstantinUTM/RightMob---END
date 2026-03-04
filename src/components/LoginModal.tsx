import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon } from 'lucide-react';
import Logo from './Logo';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop peste toată pagina – blur pe tot conținutul */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-md z-[9998]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-lg md:max-w-2xl lg:max-w-4xl mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative rounded-3xl shadow-2xl overflow-hidden bg-white flex flex-col md:flex-row min-h-[480px] max-h-[90vh] border border-primary-100/50 card-lux-hover">
                {/* Stânga – imagine și mesaj */}
                <div className="w-full md:w-2/5 relative min-h-[200px] md:min-h-0 flex-shrink-0">
                  <img
                    src="https://images.unsplash.com/photo-1555041469-586c214bc6d2?w=600&h=700&fit=crop"
                    alt="Mobilier premium"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-900/85 via-primary-900/30 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                    <span className="text-white/70 text-xs font-medium uppercase tracking-wider mb-2">
                      Mobilier premium
                    </span>
                    <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">
                      Bine ai venit!
                    </h3>
                    <p className="text-white/90 text-sm leading-relaxed max-w-[90%]">
                      Descoperă colecția noastră exclusivistă de mobilier premium
                    </p>
                  </div>
                </div>

                {/* Dreapta – formular */}
                <div className="w-full md:w-3/5 flex flex-col bg-white relative">
                  <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-dark-400 hover:bg-primary-50 hover:text-dark-600 transition-colors z-10"
                    aria-label="Închide"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  <div className="flex-1 flex flex-col justify-center px-6 sm:px-8 md:px-10 py-8 md:py-10 overflow-y-auto">
                    <div className="w-full max-w-[320px] mx-auto">
                      <div className="text-center mb-6 flex flex-col items-center">
                        <Logo size="md" className="mb-3" />
                        <p className="text-dark-500 text-sm">
                          {isRegister ? 'Creează un cont nou' : 'Intră în cont pentru a continua'}
                        </p>
                      </div>

                      <form className="space-y-3.5" onSubmit={(e) => e.preventDefault()}>
                        {isRegister && (
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                              type="text"
                              placeholder="Nume complet"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-dark-200 bg-dark-50/50 text-dark-900 placeholder-dark-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-all text-sm"
                            />
                          </div>
                        )}

                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                          <input
                            type="email"
                            placeholder="Email"
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-dark-200 bg-dark-50/50 text-dark-900 placeholder-dark-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-all text-sm"
                          />
                        </div>

                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                          <input
                            type="password"
                            placeholder="Parola"
                            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-dark-200 bg-dark-50/50 text-dark-900 placeholder-dark-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-all text-sm"
                          />
                        </div>

                        {isRegister && (
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                            <input
                              type="password"
                              placeholder="Confirmă parola"
                              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-dark-200 bg-dark-50/50 text-dark-900 placeholder-dark-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 transition-all text-sm"
                            />
                          </div>
                        )}

                        {!isRegister && (
                          <div className="flex items-center justify-between gap-3 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500 focus:ring-offset-0"
                              />
                              <span className="text-dark-600">Ține-mă minte</span>
                            </label>
                            <a
                              href="#"
                              className="text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap text-sm"
                            >
                              Ai uitat parola?
                            </a>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="w-full py-3 rounded-2xl btn-lux font-semibold text-sm mt-1"
                        >
                          {isRegister ? 'Înregistrează-te' : 'Intră în cont'}
                        </button>

                        <p className="text-center text-sm text-dark-500 pt-2">
                          {isRegister ? (
                            <>
                              Ai deja cont?{' '}
                              <button
                                type="button"
                                onClick={() => setIsRegister(false)}
                                className="text-primary-600 hover:text-primary-700 font-semibold"
                              >
                                Intră în cont
                              </button>
                            </>
                          ) : (
                            <>
                              Nu ai cont?{' '}
                              <button
                                type="button"
                                onClick={() => setIsRegister(true)}
                                className="text-primary-600 hover:text-primary-700 font-semibold"
                              >
                                Înregistrează-te
                              </button>
                            </>
                          )}
                        </p>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default LoginModal;
