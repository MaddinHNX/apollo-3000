import {
  type FirebaseApp,
  getApps,
  initializeApp,
} from 'firebase/app'
import {
  type Auth,
  GoogleAuthProvider,
  getAuth,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import {
  type Firestore,
  doc,
  getFirestore,
  onSnapshot,
  setDoc,
} from 'firebase/firestore'
import type { HouseholdState } from '../types/household'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== 'your-api-key-here' &&
    firebaseConfig.projectId
)

let app: FirebaseApp | null = null
let db: Firestore | null = null
let auth: Auth | null = null

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
    db = getFirestore(app)
    auth = getAuth(app)
  } catch (err) {
    console.warn('Firebase Init Warning:', err)
  }
}

export { app, auth, db }

/**
 * Log in with Google Account
 */
export async function loginWithGoogle() {
  if (!auth) {
    throw new Error('Firebase Auth ist noch nicht konfiguriert.')
  }
  const provider = new GoogleAuthProvider()
  provider.addScope('https://www.googleapis.com/auth/calendar.events')
  return await signInWithPopup(auth, provider)
}

/**
 * Sign out
 */
export async function logoutUser() {
  if (!auth) return
  await signOut(auth)
}

/**
 * Subscribe to realtime household changes in Firestore
 */
export function subscribeToHousehold(
  householdId: string,
  onUpdate: (state: HouseholdState) => void
) {
  if (!db) return () => {}
  const householdRef = doc(db, 'households', householdId)
  return onSnapshot(householdRef, (snapshot) => {
    if (snapshot.exists()) {
      onUpdate(snapshot.data() as HouseholdState)
    }
  })
}

/**
 * Sync household state to Firestore
 */
export async function syncHouseholdState(
  householdId: string,
  state: HouseholdState
) {
  if (!db) return
  const householdRef = doc(db, 'households', householdId)
  await setDoc(householdRef, state, { merge: true })
}
