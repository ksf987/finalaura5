
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCk8JK34vV2LuhudfRweMIkb3zNiUtESp8",
  authDomain: "task-manager-app-c5e76.firebaseapp.com",
  projectId: "task-manager-app-c5e76",
  storageBucket: "task-manager-app-c5e76.firebasestorage.app",
  messagingSenderId: "395879286216",
  appId: "1:395879286216:web:98b905ecbe56f54260ecfd"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
