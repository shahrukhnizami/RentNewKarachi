import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
// Replace with your actual Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyD7UnqKYgfWly-B55JSX91kuSlUVy0xHPY",
    authDomain: "rentmanagement-1cf11.firebaseapp.com",
    projectId: "rentmanagement-1cf11",
    storageBucket: "rentmanagement-1cf11.firebasestorage.app",
    messagingSenderId: "502854190835",
    appId: "1:502854190835:web:b1063f1ecb061ca9869986",
    measurementId: "G-55VCNBFQE9"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
