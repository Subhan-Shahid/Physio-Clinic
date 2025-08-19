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
import type { Patient } from "./storage";

// Reference to the `patients` collection
const col = collection(db, "patients");

export const addPatient = (
  p: Omit<Patient, "id" | "createdAt" | "updatedAt">
) =>
  addDoc(col, {
    ...p,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updatePatient = (
  id: string,
  p: Partial<Patient>
) =>
  setDoc(
    doc(col, id),
    { ...p, updatedAt: serverTimestamp() },
    { merge: true }
  );

export const deletePatient = (id: string) => deleteDoc(doc(col, id));

export const subscribePatients = (cb: (list: Patient[]) => void) =>
  onSnapshot(query(col, orderBy("createdAt", "desc")), (snap) =>
    cb(
      snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Patient),
      }))
    )
  );
