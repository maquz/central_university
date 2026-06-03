import { initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyC1GjTHszVRVYVKpD_7vOKyR-HYOqlG8hI",
  authDomain: "central-uni-school-of-health.firebaseapp.com",
  projectId: "central-uni-school-of-health",
  storageBucket: "central-uni-school-of-health.firebasestorage.app",
  messagingSenderId: "926477120049",
  appId: "1:926477120049:web:3d965e0569fca8b968db10",
  measurementId: "G-KZTKQZV6SL"
};

let auth: Auth | null = null;
let db: Firestore | null = null;
let analytics: Analytics | null = null;

try {
  const app: FirebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  try {
    analytics = getAnalytics(app);
  } catch (_e) {
    console.warn('Analytics initialization skipped');
  }
} catch (error) {
  console.error('Firebase initialization error', error);
}

export { auth, db, analytics };
