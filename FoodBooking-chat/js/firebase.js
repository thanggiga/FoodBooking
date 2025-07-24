// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getDatabase, ref, set, get, onValue, push, update } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-database.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCisUCcjEU0DVz0xkRVjBqgFykm0Ayl1M",
  authDomain: "foodbooking-dt2025.firebaseapp.com",
  databaseURL: "https://foodbooking-dt2025-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "foodbooking-dt2025",
  storageBucket: "foodbooking-dt2025.firebasestorage.app",
  messagingSenderId: "829019412638",
  appId: "1:829019412638:web:7ec978e55f9d769d3bc38f",
  measurementId: "G-P4MQBH2M1J"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

export { database, auth, ref, set, get, onValue, push, update };
