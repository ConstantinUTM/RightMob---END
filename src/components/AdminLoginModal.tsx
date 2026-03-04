import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      onClose();
      // Clear form
      setEmail('');
      setPassword('');
      // Navigate to dashboard
      setTimeout(() => {
        navigate('/admin', { replace: true });
        window.location.reload();
      }, 100);
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle both Firebase errors and mock errors
      if (error.message) {
        setError(error.message);
      } else if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Email sau parolă incorectă');
      } else if (error.code === 'auth/invalid-email') {
        setError('Email invalid');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Prea multe încercări. Încearcă mai târziu.');
      } else {
        setError('Email sau parolă incorectă. Verifică credențialele din adminSettings.json.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto rounded-3xl p-8 max-w-md w-full shadow-2xl bg-gradient-to-br from-white to-blue-50/80 border border-blue-200/50 card-lux-hover"
            >
          {/* Header – culori RightMob */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500/20 to-red-500/20 border border-primary-200/50">
                <Lock className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-dark-950">Admin RightMob</h2>
                <p className="text-sm text-dark-600">Acces securizat panou administrare</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-primary-50 rounded-full transition-colors text-dark-600 hover:text-primary-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input */}
            <div>
              <label htmlFor="admin-email" className="block text-sm font-semibold text-dark-950 mb-2">
                Nume sau Email
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="admin-email"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nume sau email"
                  required
                  className="w-full pl-12 pr-4 py-3 border-2 border-primary-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors bg-white"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="admin-password" className="block text-sm font-semibold text-dark-950 mb-2">
                Parolă
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-12 pr-12 py-3 border-2 border-primary-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-2xl font-semibold text-white btn-lux disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Se conectează...' : 'Conectare'}
            </motion.button>
          </form>

          {/* Info – culori RightMob */}
          <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-primary-50 to-red-50 border border-primary-200/50">
            <p className="text-sm text-primary-800 text-center">
              🔒 Poți te autentifica cu <strong>numele</strong> sau cu <strong>email-ul</strong> din Setări
            </p>
          </div>
        </motion.div>
      </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default AdminLoginModal;
