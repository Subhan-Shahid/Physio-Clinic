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
import type { InventoryItem } from "./storage";

const col = collection(db, "inventory");

export const addItem = (
  item: Omit<InventoryItem, "id" | "createdAt" | "updatedAt">
) =>
  addDoc(col, {
    ...item,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateItem = (id: string, updates: Partial<InventoryItem>) =>
  setDoc(doc(col, id), { ...updates, updatedAt: serverTimestamp() }, { merge: true });

export const deleteItem = (id: string) => deleteDoc(doc(col, id));

export const subscribeItems = (cb: (list: InventoryItem[]) => void) =>
  onSnapshot(query(col, orderBy("createdAt", "desc")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as InventoryItem) })))
  );
