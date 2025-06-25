// Firestore seeding script for modules, subscriptions, and alerts/events
// Run this with: npx ts-node scripts/seedFirestore.ts
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, collection, addDoc } from "firebase/firestore";

// TODO: Replace with your Firebase config
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

async function seed() {
  // 1. Seed modules (variety: tech, engineering, business, health, arts)
  const modules = [
    { id: "CS101", code: "CS101", name: "Computer Science Fundamentals", description: "Intro to programming and computer science concepts.", field: "Technology" },
    { id: "ENG201", code: "ENG201", name: "Engineering Mechanics", description: "Statics, dynamics, and mechanics for engineers.", field: "Engineering" },
    { id: "BUS110", code: "BUS110", name: "Principles of Business", description: "Foundations of business, management, and entrepreneurship.", field: "Business" },
    { id: "HLT120", code: "HLT120", name: "Health & Wellness", description: "Personal health, wellness, and nutrition.", field: "Health" },
    { id: "ART205", code: "ART205", name: "Modern Art History", description: "Study of modern and contemporary art movements.", field: "Arts" },
    { id: "PHY150", code: "PHY150", name: "Physics I", description: "Classical mechanics, motion, and energy.", field: "Science" },
    { id: "MTH101", code: "MTH101", name: "Calculus I", description: "Limits, derivatives, and integrals.", field: "Mathematics" },
    { id: "CIV210", code: "CIV210", name: "Civil Engineering Materials", description: "Properties and testing of construction materials.", field: "Engineering" },
    { id: "BIO140", code: "BIO140", name: "Biology Basics", description: "Cell biology, genetics, and evolution.", field: "Science" },
    { id: "MKT200", code: "MKT200", name: "Marketing Principles", description: "Core marketing concepts and strategies.", field: "Business" },
    { id: "NOPS", code: "NOPS", name: "Networking and Operating Systems", description: "Covers computer networks and operating system fundamentals.", field: "Technology" },
    { id: "SADS", code: "SADS", name: "Systems Analysis and Design", description: "System development life cycle, analysis, and design techniques.", field: "Technology" },
    { id: "DSA", code: "DSA", name: "Data Structures and Algorithms", description: "Advanced programming concepts and algorithm design.", field: "Technology" },
    { id: "INFM", code: "INFM", name: "Information Management", description: "Principles of managing information systems and databases.", field: "Technology" }
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
