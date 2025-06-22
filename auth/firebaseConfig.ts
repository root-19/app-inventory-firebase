// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCJRTrE6oEfFr-ixioSHYmhd9QKO5cIjs8",
  authDomain: "register-655a3.firebaseapp.com",
  databaseURL: "https://register-655a3-default-rtdb.firebaseio.com",
  projectId: "register-655a3",
  storageBucket: "register-655a3.appspot.com",
  messagingSenderId: "27174412215",
  appId: "1:27174412215:web:c352ebeb1d485139909232",
  measurementId: "G-ZQYMNYLM7D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Export services
export const auth = getAuth(app);
export const db = getFirestore(app); 