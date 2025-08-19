import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Invoice } from "./storage";

const col = collection(db, "invoices");

export const addInvoice = async (
  inv: Omit<Invoice, "id" | "createdAt" | "updatedAt">,
) => {
  // keep predictable id pattern for UI if needed
  const id = `inv_${Date.now()}`;
  await setDoc(doc(col, id), {
    ...inv,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return id;
};

export const updateInvoice = (id: string, updates: Partial<Invoice>) =>
  setDoc(doc(col, id), { ...updates, updatedAt: serverTimestamp() }, { merge: true });

export const deleteInvoice = (id: string) => deleteDoc(doc(col, id));

export const subscribeInvoices = (cb: (list: Invoice[]) => void) =>
  onSnapshot(query(col, orderBy("createdAt", "desc")), (snap) =>
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Invoice) })))
  );
