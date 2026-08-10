import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Suas chaves que o Google gerou
const firebaseConfig = {
  apiKey: "AIzaSyDEYssOJ9aVZURp6SqpHdA3Ko8cYxvC5x0",
  authDomain: "cuidarbem-ca2dc.firebaseapp.com",
  projectId: "cuidarbem-ca2dc",
  storageBucket: "cuidarbem-ca2dc.firebasestorage.app",
  messagingSenderId: "184081993129",
  appId: "1:184081993129:web:b41c25361d36305ddcc8b8" 
};


const app = initializeApp(firebaseConfig);


export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();