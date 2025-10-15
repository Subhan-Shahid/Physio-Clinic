// src/pages/Login.tsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { isLocalAuthed } from "@/lib/localAuth";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const Login: React.FC = () => {
  const { user, loading, loginLocal } = useAuth();
  const location = useLocation() as any;
  const navigate = useNavigate();
  const localAuth = isLocalAuthed();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <div className="p-6">Loading...</div>;
  if (localAuth) {
    const rawFrom = location.state?.from as any;
    const fromPath = typeof rawFrom === 'string' ? rawFrom : rawFrom?.pathname;
    const redirectTo = fromPath && fromPath !== "/login" ? fromPath : "/";
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await loginLocal(username, password);
      const rawFrom = location.state?.from as any;
      const fromPath = typeof rawFrom === 'string' ? rawFrom : rawFrom?.pathname;
      const redirectTo = fromPath && fromPath !== "/login" ? fromPath : "/";
      navigate(redirectTo, { replace: true });
    } catch (e: any) {
      setError(e?.message || "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-semibold text-center">Sign in</h1>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-md bg-background"
            required
          />
          {error && <div className="text-sm text-destructive">{error}</div>}
          <button
            type="submit"
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-60"
            disabled={submitting}
          >
            {submitting ? "Please wait..." : "Sign in"}
          </button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          Use username: <b>subhan</b> and password: <b>subhan123</b> to sign in.
        </p>
      </div>
    </div>
  );
};

export default Login;
