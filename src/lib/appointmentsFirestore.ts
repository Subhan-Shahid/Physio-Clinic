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
import type { Appointment } from "./storage";

const col = collection(db, "appointments");

export const addAppointment = (
  a: Omit<Appointment, "id" | "createdAt" | "updatedAt">,
) =>
  addDoc(col, {
    ...a,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

export const updateAppointment = (
  id: string,
  updates: Partial<Appointment>,
) =>
  setDoc(doc(col, id), { ...updates, updatedAt: serverTimestamp() }, { merge: true });

export const deleteAppointment = (id: string) => deleteDoc(doc(col, id));

export const subscribeAppointments = (cb: (list: Appointment[]) => void) =>
  onSnapshot(
    query(col, orderBy("date", "asc")),
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Appointment) })))
  );
