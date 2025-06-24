// Firestore seeding script for modules, subscriptions, and alerts/events
// Run this with: npx ts-node scripts/seedFirestore.ts
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  // 1. Seed modules
  const modules = [
    { id: "1", code: "CS101", name: "Computer Science Fundamentals", description: "Introduction to programming and computer science concepts" },
    { id: "2", code: "CS201", name: "Data Structures and Algorithms", description: "Advanced programming concepts and algorithm design" },
    { id: "3", code: "CS301", name: "Web Development", description: "Modern web development using React and Node.js" }
  ];
  for (const mod of modules) {
    await setDoc(doc(db, "modules", mod.id), mod);
  }

  // 2. Seed a student subscription (replace with your student UID)
  const studentUid = "REPLACE_WITH_STUDENT_UID";
  await setDoc(doc(db, "userSubscriptions", studentUid), {
    modules: { "1": true, "2": true }
  });

  // 3. Seed alerts/events for modules
  const now = new Date();
  await addDoc(collection(db, "alerts"), {
    title: "Welcome to CS101!",
    description: "First lecture is on Monday at 9am.",
    type: "event",
    moduleId: "1",
    moduleName: "Computer Science Fundamentals",
    createdAt: now,
    scheduledAt: new Date(now.getTime() + 86400000), // +1 day
  });
  await addDoc(collection(db, "alerts"), {
    title: "Assignment 1 Released",
    description: "Check the portal for your first assignment.",
    type: "assignment",
    moduleId: "2",
    moduleName: "Data Structures and Algorithms",
    createdAt: now,
    scheduledAt: new Date(now.getTime() + 3 * 86400000), // +3 days
  });
  await addDoc(collection(db, "alerts"), {
    title: "Midterm Exam",
    description: "Midterm exam will be held in two weeks.",
    type: "exam",
    moduleId: "1",
    moduleName: "Computer Science Fundamentals",
    createdAt: now,
    scheduledAt: new Date(now.getTime() + 14 * 86400000), // +14 days
  });

  console.log("Firestore seeded successfully!");
}

seed().catch(console.error);
