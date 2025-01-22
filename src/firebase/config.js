// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { get } from "mongoose";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDGz9AIsUHayliRoTMO3M0DaXkpSdg2EZU",
  authDomain: "react-project-2-try.firebaseapp.com",
  projectId: "react-project-2-try",
  databaseUrl: "https://react-project-2-try-default-rtdb.firebaseio.com/",
  storageBucket: "react-project-2-try.firebasestorage.app",
  messagingSenderId: "784642903479",
  appId: "1:784642903479:web:9570b0edee84f5b09cac32",
  measurementId: "G-M1ND3CMFNJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const database = getDatabase(app);
const auth = getAuth(app); // Initialize authentication


export { database, auth }