// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // ✅ added Firestore import

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBs5cUMk4jewhPCiVm-EH86FmA93h1iFag",
  authDomain: "perfumes-d89f3.firebaseapp.com",
  projectId: "perfumes-d89f3",
  storageBucket: "perfumes-d89f3.firebasestorage.app",
  messagingSenderId: "148229794291",
  appId: "1:148229794291:web:cc48a148f82d40764e4a86",
  measurementId: "G-F0Z4EB4WB4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// ✅ Initialize and export Firestore
export const db = getFirestore(app);
