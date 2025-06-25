import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD5G5yIQznznEVL8f4SvMahpWLEAwklaHI",
  authDomain: "hhbjn-95b25.firebaseapp.com",
  projectId: "hhbjn-95b25",
  storageBucket: "hhbjn-95b25.appspot.com", // FIXED: correct Firebase Storage bucket name
  messagingSenderId: "861949977935",
  appId: "1:861949977935:web:e885bc39b87cb2549e113a",
  measurementId: "G-Y1ED5CFKRD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
