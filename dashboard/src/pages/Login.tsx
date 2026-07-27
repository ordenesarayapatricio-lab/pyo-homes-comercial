import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../hooks/useAuth";

export function Login() {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && session) {
    const from = (location.state as { from?: string })?.from ?? "/";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      setError("Correo o contraseña incorrectos.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm bg-surface-container border border-white/5 rounded-lg p-8">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <span className="material-symbols-outlined text-gold text-2xl">real_estate_agent</span>
          <span className="font-headline-md text-lg font-bold text-white tracking-tight">
            PyO <span className="text-gold">CRM</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-1.5" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background border border-white/[0.15] rounded px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold/60 transition-colors"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold text-primary-container font-bold text-sm uppercase tracking-widest py-2.5 rounded hover:bg-gold/90 transition-colors disabled:opacity-60"
          >
            {submitting ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
