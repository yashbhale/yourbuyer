import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDfahG5GNHhkjgksDRGuGzJv1hcQAo3y38",
  authDomain: "your-buyer.firebaseapp.com",
  databaseURL: "https://your-buyer-default-rtdb.firebaseio.com",
  projectId: "your-buyer",
  storageBucket: "your-buyer.firebasestorage.app",
  messagingSenderId: "312879927997",
  appId: "1:312879927997:web:d3513e6c3599d5f2a6ddd4",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
