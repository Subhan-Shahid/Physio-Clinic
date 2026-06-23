import {
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import type { UserAccount } from "./storage";

const col = collection(db, "users");

// Create a new user document with server-side timestamps
export const addUser = (u: Omit<UserAccount, "id" | "createdAt" | "updatedAt">) =>
  addDoc(col, {
    ...u,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

// Update an existing user document
export const updateUser = (id: string, updates: Partial<UserAccount>) =>
  setDoc(
    doc(col, id),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true }
  );

// Delete a user document
export const deleteUser = (id: string) => deleteDoc(doc(col, id));

// Subscribe to users list (ordered alphabetically by username)
export const subscribeUsers = (cb: (list: UserAccount[]) => void) =>
  onSnapshot(
    query(col, orderBy("username", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as UserAccount) }))),
    (error) => {
      console.error("subscribeUsers error:", error);
    }
  );

// Check if username already exists
export const checkUsernameExists = async (username: string): Promise<boolean> => {
  const q = query(col, where("username", "==", username.trim().toLowerCase()));
  const snap = await getDocs(q);
  return !snap.empty;
};

// Find user by username or email for login
export const findUserByUsername = async (identifier: string): Promise<UserAccount | null> => {
  const cleanId = identifier.trim().toLowerCase();
  
  // Try querying by username
  let q = query(col, where("username", "==", cleanId));
  let snap = await getDocs(q);
  
  if (snap.empty) {
    // If not found, try querying by email
    q = query(col, where("email", "==", cleanId));
    snap = await getDocs(q);
  }
  
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as UserAccount) };
};
