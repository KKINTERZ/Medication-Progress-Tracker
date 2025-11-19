import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDAeGBwLQwIXQiyE6BkWgKDNto7nZnyhNk",
  authDomain: "zotapp-468919.firebaseapp.com",
  projectId: "zotapp-468919",
  storageBucket: "gs://zotapp-468919.firebasestorage.app",
  messagingSenderId: "714585745764",
  appId: "1:714585745764:web:77c47517f413ff9312f271",
  measurementId: "G-B56W1VCW4W"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;