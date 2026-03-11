import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { getApiBase } from '../lib/api';

// Când VITE_USE_FIREBASE=true în .env → folosim Firebase Auth. Altfel logare prin API (server).
const USE_MOCK_AUTH = import.meta.env.VITE_USE_FIREBASE !== 'true';

// sessionStorage = nu persistă la închiderea browserului (nu auto-login la deschidere)
const storeAdminToken = (token: string) => {
  try { sessionStorage.setItem('adminToken', token); } catch (e) { console.warn('Could not store admin token', e); }
};

const getAdminToken = () => {
  try { return sessionStorage.getItem('adminToken'); } catch (e) { return null; }
};

const clearAdminToken = () => {
  try { sessionStorage.removeItem('adminToken'); } catch (e) { /* ignore */ }
};

export { getAdminToken }; // Export pentru a fi folosit în altă parte

interface AuthContextType {
  currentUser: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  /* 
   * CONFIGURARE EMAIL ADMIN
   * 
   * După ce creezi utilizatorul admin în Firebase Console:
   * 1. Accesează Firebase Console → Authentication → Users
   * 2. Click "Add user" și creează contul
   * 3. Înlocuiește 'admin@luxmobila.com' cu email-ul tău
   */
  const ADMIN_EMAILS = [
    'constantin.bulai21@gmail.com',
    'rightstep212@gmail.com'
  ];

  useEffect(() => {
    if (USE_MOCK_AUTH) {
      // Mock auth - verifică token din sessionStorage (nu persistă la închidere)
      const token = getAdminToken();
      const mockUser = sessionStorage.getItem('mockAdminUser');
      if (token && mockUser) {
        try {
          const user = JSON.parse(mockUser);
          setCurrentUser(user as any);
          setIsAdmin(true);
        } catch (error) {
          console.error('Error parsing mock user:', error);
          clearAdminToken();
        }
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAdmin(user ? ADMIN_EMAILS.includes(user.email || '') : false);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    if (USE_MOCK_AUTH) {
      // Mock login - verifică credențiale pe server
      try {
        const response = await fetch(`${getApiBase()}/api/admin/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          const msg = data?.error || (response.status === 429 ? 'Prea multe încercări.' : response.status === 500 ? 'Eroare server.' : 'Credențiale invalide');
          throw new Error(msg);
        }
        const token = data.token;
        if (!token) throw new Error('Eroare la autentificare');
        
        // Salvează token în sessionStorage (nu localStorage!)
        storeAdminToken(token);
        
        const mockUser = {
          email: email,
          uid: 'mock-admin-uid',
          displayName: 'Admin'
        };
        try { sessionStorage.setItem('mockAdminUser', JSON.stringify(mockUser)); } catch (e) { console.warn('Could not persist mockAdminUser', e); }
        setCurrentUser(mockUser as any);
        setIsAdmin(true);
        return;
      } catch (error: any) {
        if (error.message?.includes('Failed to fetch') || error.name === 'TypeError') {
          throw new Error('Nu se poate conecta la server. Verifică că serverul rulează pe portul 3001 (npm run dev).');
        }
        throw new Error(error.message || 'Email sau parolă incorectă');
      }
    }
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signOut = async () => {
    if (USE_MOCK_AUTH) {
      const token = getAdminToken();
      if (token) {
        try {
          await fetch(`${getApiBase()}/api/admin/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-admin-token': token },
          });
        } catch (_) {}
      }
      clearAdminToken();
      try { sessionStorage.removeItem('mockAdminUser'); } catch (e) { /* ignore */ }
      setCurrentUser(null);
      setIsAdmin(false);
      return;
    }
    await firebaseSignOut(auth);
  };

  const value: AuthContextType = {
    currentUser,
    isAdmin,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
