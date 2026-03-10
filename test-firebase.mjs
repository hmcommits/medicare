import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore/lite'; // using lite for node

const firebaseConfig = {
  apiKey: "AIzaSyDCvQ5J91a_iXAcB4iyna9_l6Mqd-begV8",
  authDomain: "medicare-8e811.firebaseapp.com",
  projectId: "medicare-8e811",
  appId: "1:108590399599:web:58a9c7cd4c9135b219cd9a"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
  console.log("Testing Firestore connection...");
  try {
    const colRef = collection(db, "test", "testDoc", "testCollection");
    console.log("Adding doc...");
    const docRef = await addDoc(colRef, { test: "test" });
    console.log("Success with ID:", docRef.id);
  } catch(e) {
    console.error("Firebase Error! =>", e.message);
  }
}

test();
