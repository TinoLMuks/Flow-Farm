import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBTET_JhcKH4dmKmkYDPTP67MFwI8hIxaM",
  authDomain: "flow-farm-dashboard.firebaseapp.com",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();