// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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