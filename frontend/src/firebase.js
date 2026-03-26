// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // MUST IMPORT THESE

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyClUR-F_lxtqJ53sKrEoeVnAoaGRv-OoQg",
  authDomain: "tuk-mapping-auth.firebaseapp.com",
  projectId: "tuk-mapping-auth",
  storageBucket: "tuk-mapping-auth.firebasestorage.app",
  messagingSenderId: "922198236380",
  appId: "1:922198236380:web:197bcc7cc161f77854a819",
  measurementId: "G-XV2BXQJDB5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// THESE THREE LINES ARE MANDATORY FOR LOGIN TO WORK:
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();