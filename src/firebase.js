import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, signInWithEmailAndPassword } from "firebase/auth";

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
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const loginWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error("Login failed", error);
    throw error;
  }
};
