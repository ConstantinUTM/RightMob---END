import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Camera,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  Box,
} from 'lucide-react';
import { useAuth, getAdminToken } from '../contexts/AuthContext';
import { useSiteSettings } from '../contexts/SiteSettingsContext';
import { getApiBase } from '../lib/api';

const API_URL = getApiBase();

// Încarcă setările de la server cu token din sesiune
const loadAdminSettingsFromServer = async () => {
  try {
    const token = getAdminToken() || '';
    const response = await fetch(`${API_URL}/api/admin/settings`, {
      headers: {
        'x-admin-token': token
      }
    });
    if (response.ok) {
      const settings = await response.json();
      // Sincronizează doar profilul în localStorage (NU credențialele!)
      localStorage.setItem('adminProfile', JSON.stringify(settings.profile));
      return settings;
    }
  } catch (error) {
    console.error('Eroare la încărcarea setărilor de la server:', error);
  }
  // Fallback la localStorage dacă serverul nu e disponibil
  return {
    profile: getAdminProfileFromLocalStorage(),
    credentials: getAdminCredentialsFromLocalStorage(),
    notificationsEmail: '',
    notificationsPhone: ''
  };
};

// Salvează setările pe server
const saveAdminSettingsToServer = async (profile: any, credentials: any, notificationsEmail?: string, notificationsPhone?: string) => {
  try {
    const token = getAdminToken() || '';
    const response = await fetch(`${API_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': token
      },
      body: JSON.stringify({
        profile,
        credentials,
        notificationsEmail: notificationsEmail ?? '',
        notificationsPhone: notificationsPhone ?? ''
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Setări salvate cu succes pe server!', result);
      
      // Sincronizează doar profilul în localStorage (NU credențialele!)
      localStorage.setItem('adminProfile', JSON.stringify(profile));
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ Eroare la salvarea setărilor pe server:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Eroare de rețea la salvarea setărilor pe server:', error);
    return false;
  }
};

// Helper functions pentru localStorage (folosite ca fallback)
const getAdminProfileFromLocalStorage = () => {
  const saved = localStorage.getItem('adminProfile');
  return saved ? JSON.parse(saved) : {
    username: 'Admin',
    email: 'admin@luxmobila.com',
    profileImage: 'https://ui-avatars.com/api/?name=Admin&background=8B4513&color=fff&size=200'
  };
};

const getAdminCredentialsFromLocalStorage = () => {
  return {
    email: 'admin@luxmobila.com',
    uid: 'mock-admin-uid'
  };
};

const AdminSettings: React.FC = () => {
  useAuth();
  const { features, refreshFeatures } = useSiteSettings();
  const [tryInMyRoomEnabled, setTryInMyRoomEnabled] = useState(true);
  const [tryInMyRoomSaving, setTryInMyRoomSaving] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [username, setUsername] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [storedCredentials, setStoredCredentials] = useState<{
    email: string;
    uid?: string;
  } | null>(null);

  const [profileImage, setProfileImage] = useState<string>('');
  const [notificationsEmail, setNotificationsEmail] = useState('');
  const [notificationsPhone, setNotificationsPhone] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await loadAdminSettingsFromServer();
      setUsername(settings.profile?.username ?? '');
      setFormData(prev => ({ ...prev, email: settings.credentials?.email ?? '' }));
      setProfileImage(settings.profile?.profileImage ?? '');
      setStoredCredentials(settings.credentials ?? null);
      setNotificationsEmail((settings as { notificationsEmail?: string }).notificationsEmail ?? '');
      setNotificationsPhone((settings as { notificationsPhone?: string }).notificationsPhone ?? '');
      setLoading(false);
    };
    loadSettings();
  }, []);

  useEffect(() => {
    setTryInMyRoomEnabled(features.tryInMyRoomEnabled);
  }, [features.tryInMyRoomEnabled]);

  const handleTryInMyRoomToggle = async () => {
    const next = !tryInMyRoomEnabled;
    setTryInMyRoomSaving(true);
    try {
      const res = await fetch(`${API_URL}/api/site/features`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getAdminToken() || '',
        },
        body: JSON.stringify({ tryInMyRoomEnabled: next }),
      });
      if (res.ok) {
        setTryInMyRoomEnabled(next);
        await refreshFeatures();
      }
    } finally {
      setTryInMyRoomSaving(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasswordChange = async (currentPassword: string, newPassword: string, confirmPassword: string) => {
    // Validate password inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Toate câmpurile de parolă sunt necesare!');
      return false;
    }
    
    if (newPassword !== confirmPassword) {
      alert('Parolele noi nu se potrivesc!');
      return false;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^a-zA-Z0-9]/.test(newPassword)) {
      alert('Noua parolă trebuie să aibă minim 8 caractere și să includă literă mare, literă mică, cifră și simbol.');
      return false;
    }

    try {
      const token = getAdminToken() || '';
      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': token
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      if (response.ok) {
        console.log('✅ Parolă schimbată cu succes');
        alert('Parolă schimbată cu succes!');
        return true;
      } else {
        const errorData = await response.json();
        alert(`❌ ${errorData.error || 'Eroare la schimbarea parole'}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Eroare de rețea:', error);
      alert('Eroare de rețea la schimbarea parole');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🔵 START: handleSubmit called');
    console.log('🔵 API_URL:', API_URL);
    
    // Verifică dacă serverul rulează
    let serverRunning = false;
    try {
      console.log('🔵 Testing server connection...');
      const testResponse = await fetch(`${API_URL}/api/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(3000) 
      });
      serverRunning = testResponse.ok;
      console.log('🔵 Server test result:', serverRunning);
    } catch (error) {
      console.error('🔴 Server nu este disponibil:', error);
    }

    if (!serverRunning) {
      alert('⚠️ ATENȚIE: Serverul backend nu rulează!\n\nPornește serverul cu: npm run dev\n\nModificările nu vor fi salvate permanent fără server.');
      return;
    }

    // If password change is requested, handle it separately
    if (formData.newPassword || formData.currentPassword) {
      const passwordChangeSuccess = await handlePasswordChange(
        formData.currentPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      
      if (!passwordChangeSuccess) {
        return;
      }
      
      // Clear password fields after successful change
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }

    // Prepare profile and credentials for saving
    const profile = {
      username,
      email: formData.email,
      profileImage
    };

    const updatedCredentials = {
      email: formData.email,
      uid: storedCredentials?.uid || 'mock-admin-uid'
    };

    console.log('🔵 Calling saveAdminSettingsToServer...');
    console.log('🔵 Profile data:', { username: profile.username, email: profile.email, imageLength: profile.profileImage?.length });
    
    const success = await saveAdminSettingsToServer(profile, updatedCredentials, notificationsEmail, notificationsPhone);
    
    console.log('🔵 Save result:', success);

    if (success) {
      console.log('🟢 SUCCESS: Settings saved!');
      // Show success message
      setSaveSuccess(true);

      // Reload settings from server to confirm save
      console.log('🔵 Reloading settings from server...');
      setTimeout(async () => {
        const reloadedSettings = await loadAdminSettingsFromServer();
        console.log('🔵 Reloaded settings:', { username: reloadedSettings.profile.username, email: reloadedSettings.profile.email });
        setUsername(reloadedSettings.profile.username);
        setFormData(prev => ({ ...prev, email: reloadedSettings.credentials.email }));
        setProfileImage(reloadedSettings.profile.profileImage);
        setStoredCredentials(reloadedSettings.credentials);
        setNotificationsEmail((reloadedSettings as { notificationsEmail?: string }).notificationsEmail ?? '');
        setNotificationsPhone((reloadedSettings as { notificationsPhone?: string }).notificationsPhone ?? '');
        
        // Hide success message after reload
        setTimeout(() => setSaveSuccess(false), 2000);
      }, 500);
    } else {
      console.log('🔴 FAILED: Could not save settings');
      alert('❌ Eroare la salvare! Verifică dacă serverul rulează cu: npm run dev');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Setări</h1>
          <p className="text-gray-600">Se încarcă...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Setări</h1>
        <p className="text-gray-600">Gestionează-ți profilul și securitatea</p>
      </div>

      {/* Try My Room - vizibilitate în header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 card-lux-hover">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Box className="w-5 h-5 text-primary-600" />
          Pagina „Testează în camera mea”
        </h2>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            Când este activată, linkul apare în meniul de navigare. Când este dezactivată, dispare din header.
          </p>
          <button
            type="button"
            onClick={handleTryInMyRoomToggle}
            disabled={tryInMyRoomSaving}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${tryInMyRoomEnabled ? 'bg-primary-600' : 'bg-gray-200'}`}
            role="switch"
          >
            <span className="sr-only">Activează / Dezactivează Try My Room</span>
            <span className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition ${tryInMyRoomEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {tryInMyRoomEnabled ? 'Vizibil în header' : 'Ascuns din header'}
        </p>
      </div>

      {/* Email și telefon notificări mesaje */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 card-lux-hover">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5 text-primary-600" />
          Email notificări mesaje
        </h2>
        <p className="text-gray-600 mb-4">
          Mesajele de pe pagina Contact vor fi trimise pe emailul pe care îl scrii mai jos (în plus față de dashboard). Lasă gol dacă nu vrei notificări pe email.
        </p>
        <p className="text-amber-700 text-sm mb-3 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Pentru ca mesajele să se trimită pe email, serverul trebuie pornit cu variabilele de mediu <strong>SMTP_USER</strong> și <strong>SMTP_PASS</strong> setate (vezi .env.example).
        </p>
        <input
          type="email"
          value={notificationsEmail}
          onChange={(e) => setNotificationsEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 mb-3"
          placeholder="ex: constantin.bulai21@gmail.com"
        />
        <p className="text-gray-600 mb-2 text-sm">
          Telefon (opțional) – dacă dorești, îl poți afișa în notificarea prin email ca alternativă de contact.
        </p>
        <input
          type="tel"
          value={notificationsPhone}
          onChange={(e) => setNotificationsPhone(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 mb-3"
          placeholder="ex: +373 69 123 456"
        />
        <button
          type="button"
          onClick={async () => {
            const ok = await saveAdminSettingsToServer(
              { username, email: formData.email, profileImage },
              { email: formData.email, uid: storedCredentials?.uid || 'mock-admin-uid' },
              notificationsEmail,
              notificationsPhone
            );
            if (ok) {
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 2500);
            } else {
              alert('Eroare la salvare. Verifică dacă serverul rulează (npm run dev).');
            }
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Salvează email și telefon
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Image */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-lux-hover">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Poză de profil</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <img
                src={profileImage}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary-100"
              />
              <label className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full cursor-pointer hover:bg-primary-700 transition-colors shadow-lg">
                <Camera className="w-5 h-5" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Schimbă poza de profil</h3>
              <p className="text-sm text-gray-500 mb-3">JPG, PNG sau GIF. Max 2MB.</p>
              <label className="btn-secondary text-sm cursor-pointer inline-block">
                Încarcă imagine
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-lux-hover">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Informații cont</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Nume utilizator
                </div>
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                placeholder="Admin"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </div>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500"
                placeholder="admin@luxmobila.com"
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-lux-hover">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Schimbă parola</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Parola curentă
                </div>
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Parola nouă
                </div>
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirmă parola nouă
                </div>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-500 pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {formData.newPassword && formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
              <p className="text-sm text-red-600">Parolele nu se potrivesc</p>
            )}
            <p className="text-sm text-gray-500">Folosește minim 8 caractere, cu literă mare, literă mică, cifră și simbol.</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end items-center gap-4">
          {saveSuccess && (
            <div className="flex items-center gap-2 text-green-600 animate-fade-in">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Setările au fost salvate!</span>
            </div>
          )}
          <button
            type="submit"
            className="btn-lux flex items-center gap-2 px-8"
          >
            <Save className="w-5 h-5" />
            Salvează modificările
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
