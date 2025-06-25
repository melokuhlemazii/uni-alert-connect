// Firestore reset script: deletes all documents in modules, alerts, and userSubscriptions
// Run with: npx ts-node --project tsconfig.seed.json scripts/resetFirestore.ts
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";

// Use your real Firebase config (same as in seedFirestore.ts)
const firebaseConfig = {
  apiKey: "AIzaSyD5G5yIQznznEVL8f4SvMahpWLEAwklaHI",
  authDomain: "hhbjn-95b25.firebaseapp.com",
  projectId: "hhbjn-95b25",
  storageBucket: "hhbjn-95b25.appspot.com",
  messagingSenderId: "861949977935",
  appId: "1:861949977935:web:e885bc39b87cb2549e113a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function deleteAllInCollection(collectionName: string) {
  const colRef = collection(db, collectionName);
  const snapshot = await getDocs(colRef);
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, collectionName, docSnap.id));
    console.log(`Deleted from ${collectionName}:`, docSnap.id);
  }
}

async function reset() {
  await deleteAllInCollection("modules");
  await deleteAllInCollection("alerts");
  await deleteAllInCollection("userSubscriptions");
  console.log("Firestore reset: modules, alerts, and userSubscriptions collections are now empty.");
}

reset().catch(console.error);
