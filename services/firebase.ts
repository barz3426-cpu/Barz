
import { initializeApp, getApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBpmvldWQbsybSkrDA7eu324GD7Hnx7Tt8", 
  authDomain: "kadamatibarz.firebaseapp.com",
  projectId: "kadamatibarz",
  storageBucket: "kadamatibarz.appspot.com",
  messagingSenderId: "367285194025",
  appId: "1:367285194025:web:865d8a9e6f3b2c1a"
};

// تهيئة التطبيق بشكل آمن
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

/** 
 * تهيئة المصادقة - نستخدم الإصدار 11.1.0 المستقر من importmap
 * المكون auth يتم تسجيله تلقائياً عند استدعاء getAuth لأول مرة
 */
const auth: Auth = getAuth(app);
auth.languageCode = 'ar';

// تهيئة قاعدة البيانات
const db_firestore: Firestore = getFirestore(app);

export { auth, db_firestore, RecaptchaVerifier, signInWithPhoneNumber };
