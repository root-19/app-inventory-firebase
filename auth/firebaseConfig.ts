// firebaseConfig.ts
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

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

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
