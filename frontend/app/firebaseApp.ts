// Import the functions you need from the SDKs you need
import { FirebaseApp, getApps, initializeApp } from "firebase/app";
import { Auth } from "firebase/auth";
import { Firestore, getFirestore } from "firebase/firestore";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
let app: FirebaseApp | null = null;

export const initFirebase = (): FirebaseApp | null => {
  if (!firebaseApiKey) return null;

  if (!app) {
    app = getApps()[0] ?? initializeApp({
      apiKey: firebaseApiKey,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    });
  }

  return app;
};

const disabledAuth = {
  currentUser: null,
  onAuthStateChanged: (observer: (user: null) => void) => {
    observer(null);
    return () => undefined;
  },
} as unknown as Auth;

const disabledFirestore = {
  app: { container: {} },
} as unknown as Firestore;

export const getFirebaseAuth = (): Auth => {
  const firebaseApp = initFirebase();
  if (!firebaseApp) return disabledAuth;

  const { getAuth } = require("firebase/auth") as typeof import("firebase/auth");
  return getAuth(firebaseApp);
};

export const getFirebaseDb = (): Firestore => {
  const firebaseApp = initFirebase();
  return firebaseApp ? getFirestore(firebaseApp) : disabledFirestore;
};
