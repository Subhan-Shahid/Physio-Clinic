// src/hooks/useAuth.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "@/lib/firebase";
import { setLocalAuthed } from "@/lib/localAuth";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  User,
} from "firebase/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginLocal: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      // Fallback for environments that block popups/3rd-party cookies
      const code = e?.code as string | undefined;
      const fallbackCodes = new Set([
        "auth/popup-blocked",
        "auth/popup-closed-by-user",
        "auth/operation-not-supported-in-this-environment",
      ]);
      if (code && fallbackCodes.has(code)) {
        await signInWithRedirect(auth, provider);
      } else {
        throw e;
      }
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUpWithEmail = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    try { await signOut(auth); } catch { /* ignore */ }
    try { setLocalAuthed(false); } catch { /* ignore */ }
  };

  const loginLocal = async (username: string, password: string) => {
    // Fixed credentials requirement
    if (username === "subhan" && password === "subhan123") {
      setLocalAuthed(true);
      return;
    }
    throw new Error("Invalid username or password");
  };

  const value = useMemo(
    () => ({ user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resetPassword, loginLocal, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
