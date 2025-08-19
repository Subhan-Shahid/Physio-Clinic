// src/lib/firebase.ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";

// Helper: ensure required env vars exist to avoid silent undefined values
const getEnv = (key: string) => {
  const v = (import.meta as any).env?.[key];
  if (!v || String(v).trim() === "") {
    // eslint-disable-next-line no-console
    console.error(`Missing environment variable: ${key}`);
    throw new Error(`Missing environment variable: ${key}`);
  }
  return String(v).trim();
};

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
  // measurementId is optional for web apps
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || undefined,
};

// Ensure we don't re-initialize in HMR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const analyticsPromise = (async () => {
  try {
    if (typeof window !== "undefined" && (await analyticsSupported())) {
      return getAnalytics(app);
    }
  } catch (e) {
    // no-op
  }
  return null;
})();

export default app;
