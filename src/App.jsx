import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import { AppProvider } from "./context/AppContext"; // Ensure this matches your path!

export default function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an active user session on startup
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Listen for auth changes (Log in, Log out, Sign up)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Simple loading placeholder while checking the backend state
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <p className="text-xs font-bold text-slate-400 animate-pulse uppercase tracking-widest">
          Verifying Session State...
        </p>
      </div>
    );
  }

  // ✨ CRITICAL FIX: The entire router MUST be wrapped inside your AppProvider 
  // so that Auth and Dashboard can safely read your global accent colors!
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        {!session ? <Auth /> : <Dashboard />}
      </div>
    </AppProvider>
  );
}
