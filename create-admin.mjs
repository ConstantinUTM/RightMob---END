// Script pentru crearea contului de admin
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import * as readline from 'readline';

// Configurația Firebase - TREBUIE SĂ COMPLETEZI MAI ÎNTÂI!
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Verifică dacă Firebase este configurat
if (firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
  console.error('\n❌ EROARE: Firebase nu este configurat!\n');
  console.log('Pași:');
  console.log('1. Mergi la: https://console.firebase.google.com/');
  console.log('2. Creează proiect și activează Authentication');
  console.log('3. Copiază credențialele în acest fișier (create-admin.mjs)');
  console.log('4. Rulează din nou scriptul\n');
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n🔐 Creare Cont Admin\n');
    
    const email = await question('Email admin: ');
    const password = await question('Parolă (min 6 caractere): ');
    
    if (!email || !password) {
      console.error('❌ Email și parolă sunt obligatorii!');
      process.exit(1);
    }
    
    if (password.length < 6) {
      console.error('❌ Parola trebuie să aibă minim 6 caractere!');
      process.exit(1);
    }
    
    console.log('\n⏳ Se creează contul...\n');
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log('✅ Cont admin creat cu succes!');
    console.log('📧 Email:', userCredential.user.email);
    console.log('🆔 UID:', userCredential.user.uid);
    console.log('\n📝 Pași următori:');
    console.log('1. Deschide src/contexts/AuthContext.tsx');
    console.log(`2. Adaugă email-ul "${email}" în lista ADMIN_EMAILS`);
    console.log('3. Actualizează regulile Firestore și Storage cu acest email');
    console.log('4. Rulează aplicația: npm run dev');
    console.log('5. Login cu acest email și parolă\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Eroare la crearea contului:');
    
    if (error.code === 'auth/email-already-in-use') {
      console.error('Email-ul este deja folosit. Încearcă alt email sau folosește cel existent.');
    } else if (error.code === 'auth/invalid-email') {
      console.error('Email invalid. Verifică formatul email-ului.');
    } else if (error.code === 'auth/weak-password') {
      console.error('Parola este prea slabă. Folosește minim 6 caractere.');
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

createAdmin();
