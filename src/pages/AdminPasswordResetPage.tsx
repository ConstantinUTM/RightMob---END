import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiBase } from '../lib/api';

const API_URL = getApiBase();

const passwordMeetsRules = (value: string) => (
  value.length >= 8
  && /[A-Z]/.test(value)
  && /[a-z]/.test(value)
  && /[0-9]/.test(value)
  && /[^a-zA-Z0-9]/.test(value)
);

const AdminPasswordResetPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => {
    return !!token && passwordMeetsRules(newPassword) && newPassword === confirmPassword;
  }, [confirmPassword, newPassword, token]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!token) {
      setError('Linkul de resetare lipsește sau este invalid.');
      return;
    }
    if (!passwordMeetsRules(newPassword)) {
      setError('Parola trebuie să aibă minim 8 caractere și să includă literă mare, literă mică, cifră și simbol.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Parolele nu se potrivesc.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || 'Nu am putut reseta parola.');
      }

      setNotice(data?.message || 'Parola a fost resetată cu succes.');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/admin', { replace: true }), 1800);
    } catch (submitError: any) {
      setError(submitError?.message || 'Nu am putut reseta parola.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-amber-50 px-4 py-10 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl bg-white/95 border border-primary-100 shadow-2xl p-8"
      >
        <div className="mb-6">
          <p className="text-sm uppercase tracking-[0.24em] text-primary-700/70 mb-3">Resetare admin</p>
          <h1 className="text-3xl font-bold text-dark-950 mb-2">Setează parola nouă</h1>
          <p className="text-sm text-dark-600">Folosește linkul primit pe email pentru a seta o parolă nouă și sigură.</p>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 flex gap-3 text-red-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {notice && (
          <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex gap-3 text-emerald-800">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm">{notice}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reset-password" className="block text-sm font-semibold text-dark-950 mb-2">Parolă nouă</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                id="reset-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-primary-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-700"
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="reset-password-confirm" className="block text-sm font-semibold text-dark-950 mb-2">Confirmă parola</label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-dark-400" />
              <input
                id="reset-password-confirm"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full pl-12 pr-12 py-3 border-2 border-primary-200 rounded-2xl focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-dark-700"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-sm text-dark-500">Parola trebuie să conțină minim 8 caractere, literă mare, literă mică, cifră și simbol.</p>

          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full btn-lux py-3 rounded-2xl font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Se salvează...' : 'Resetează parola'}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between gap-3 text-sm">
          <Link to="/admin" className="text-primary-700 hover:text-primary-900 font-medium">Înapoi la autentificare</Link>
          <button type="button" onClick={() => navigate('/')} className="text-dark-500 hover:text-dark-800">Înapoi la site</button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminPasswordResetPage;