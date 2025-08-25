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
} from "firebase/firestore";
import { db } from "./firebase";
import type { Staff } from "./storage";

const col = collection(db, "staff");

// Create a new staff document with server-side timestamps
export const addStaff = (
  s: Omit<Staff, "id" | "createdAt" | "updatedAt">
) =>
  addDoc(col, {
    ...s,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

// Update an existing staff document and bump updatedAt
export const updateStaff = (id: string, updates: Partial<Staff>) =>
  setDoc(
    doc(col, id),
    { ...updates, updatedAt: serverTimestamp() },
    { merge: true }
  );

export const deleteStaff = (id: string) => deleteDoc(doc(col, id));

// Subscribe to staff list; order by lastName then firstName when available,
// fallback to createdAt if names aren't present
export const subscribeStaff = (cb: (list: Staff[]) => void) =>
  onSnapshot(
    // Order only by lastName to minimize index/query constraints
    query(col, orderBy("lastName", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Staff) }))),
    (error) => {
      // eslint-disable-next-line no-console
      console.error("subscribeStaff error:", error);
    }
  );
