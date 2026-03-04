import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/* 
 * Firebase: activat cu VITE_USE_FIREBASE=true în .env
 * Chei reale: pune în .env variabilele VITE_FIREBASE_* (vezi .env.example).
 * Fără ele, folosim config dummy (doar când useFirebase=false, ca să nu apară 400).
 */

const env = import.meta.env;
const useFirebase = env.VITE_USE_FIREBASE === 'true';

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyDummy-Key-For-Local-Development-Only",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "luxmobila-local.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "luxmobila-local",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "luxmobila-local.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789:web:local-dev-only"
};

let app: any;
let auth: any;
let db: any;
let storage: any;

if (useFirebase) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.warn('Firebase initialization failed - using mock objects');
    auth = { currentUser: null };
    db = {};
    storage = {};
  }
} else {
  // Mock mode: nu inițializăm Firebase → niciun request la identitytoolkit (fără 400 în consolă)
  auth = { currentUser: null };
  db = {};
  storage = {};
}

export { auth, db, storage };
export default app;
