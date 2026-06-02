import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC1GjTHszVRVYVKpD_7vOKyR-HYOqlG8hI",
  authDomain: "central-uni-school-of-health.firebaseapp.com",
  projectId: "central-uni-school-of-health",
  storageBucket: "central-uni-school-of-health.firebasestorage.app",
  messagingSenderId: "926477120049",
  appId: "1:926477120049:web:3d965e0569fca8b968db10",
  measurementId: "G-KZTKQZV6SL"
};

let app, auth, db, analytics;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  // Analytics is optional and can fail in some environments (like extensions), so we catch it
  try {
    analytics = getAnalytics(app);
  } catch (e) {
    console.warn("Analytics initialization skipped");
  }
} catch (error) {
  console.error("Firebase initialization error", error);
}

export { auth, db, analytics };
