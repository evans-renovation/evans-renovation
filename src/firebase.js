import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- PASTE YOUR FIREBASE KEYS HERE ---
const firebaseConfig = {
  apiKey: "AIzaSyALphrfKPnXPwUiXIWqjxnmjgfmW1QD3pk",
  authDomain: "evans-renovation-db2c9.firebaseapp.com",
  projectId: "evans-renovation-db2c9",
  storageBucket: "evans-renovation-db2c9.firebasestorage.app",
  messagingSenderId: "1085783628127",
  appId: "1:1085783628127:web:c1ccbd7814aadf10c2beea",
  measurementId: "G-32QFL0FPS3"
};

const app = initializeApp(firebaseConfig);

// EXPORT THE TOOLS SO YOUR APP CAN USE THEM
export const auth = getAuth(app);
export const db = getFirestore(app); // <--- This was likely missing
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    if (error.code === 'auth/popup-blocked' || error.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, googleProvider);
    } else {
        console.error("Login failed", error);
        throw error;
    }
  }
};

// This function was likely missing too
export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};
