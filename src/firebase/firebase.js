import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDB_rSv4K1cJLKDvsAgvixnHv7Qf9d3cw8",
  authDomain: "ai-study-f8380.firebaseapp.com",
  projectId: "ai-study-f8380",
  storageBucket: "ai-study-f8380.firebasestorage.app",
  messagingSenderId: "725279172866",
  appId: "1:725279172866:web:5e92fe1e0d2041ca8f3a1b"
};

// If Firebase is already initialized, use that existing instance. Otherwise, initialize fresh!
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;