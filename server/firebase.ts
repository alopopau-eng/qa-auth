import admin from "firebase-admin";

// Initialize Firebase Admin SDK
function getPrivateKey(): string | undefined {
  const key = process.env.FIREBASE_PRIVATE_KEY;
  if (!key) return undefined;
  
  // Handle escaped newlines
  let formattedKey = key.replace(/\\n/g, '\n');
  
  // If key is wrapped in quotes, remove them
  if (formattedKey.startsWith('"') && formattedKey.endsWith('"')) {
    formattedKey = formattedKey.slice(1, -1);
  }
  if (formattedKey.startsWith("'") && formattedKey.endsWith("'")) {
    formattedKey = formattedKey.slice(1, -1);
  }
  
  return formattedKey;
}

let firestoreDb: admin.firestore.Firestore | null = null;
let firestoreAuth: admin.auth.Auth | null = null;

try {
  const privateKey = getPrivateKey();
  
  if (privateKey && process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          privateKey: privateKey,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
      });
    }
    firestoreDb = admin.firestore();
    firestoreAuth = admin.auth();
    console.log("Firebase initialized successfully");
  } else {
    console.warn("Firebase credentials not found, using fallback mode");
  }
} catch (error) {
  console.error("Firebase initialization error:", error);
}

export const db = firestoreDb!;
export const auth = firestoreAuth;

// Collection references (will be null if Firebase not initialized)
export const collections = firestoreDb ? {
  users: firestoreDb.collection('users'),
  admins: firestoreDb.collection('admins'),
  visitors: firestoreDb.collection('visitors'),
  applications: firestoreDb.collection('applications'),
  otps: firestoreDb.collection('otps'),
  onlineSessions: firestoreDb.collection('onlineSessions'),
} : null;
