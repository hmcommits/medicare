import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDCvQ5J91a_iXAcB4iyna9_l6Mqd-begV8",
  authDomain: "medicare-8e811.firebaseapp.com",
  projectId: "medicare-8e811",
  appId: "1:108590399599:web:58a9c7cd4c9135b219cd9a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
