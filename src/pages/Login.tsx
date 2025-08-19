// src/pages/Login.tsx
import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";

const Login: React.FC = () => {
  const { user, loading, signInWithGoogle } = useAuth();
  const location = useLocation() as any;

  if (loading) return <div className="p-6">Loading...</div>;
  if (user) {
    const redirectTo = location.state?.from?.pathname || "/";
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>
        <button
          onClick={signInWithGoogle}
          className="w-full py-2 px-4 rounded-md bg-black text-white hover:opacity-90"
        >
          Continue with Google
        </button>
        <p className="text-xs text-muted-foreground text-center">
          By continuing you agree to the Terms and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default Login;
