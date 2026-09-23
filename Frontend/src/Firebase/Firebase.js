import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

let firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "taskify-57c55.firebaseapp.com",
  projectId: "taskify-57c55",
  storageBucket: "taskify-57c55.firebasestorage.app",
  messagingSenderId: "1006798470943",
  appId: "1:1006798470943:web:d0198bfb84a9952890fa2a",
  measurementId: "G-MB10KMJ03G"
}

// Initialize Firebase
export let app = initializeApp(firebaseConfig);
export let analytics = getAnalytics(app);