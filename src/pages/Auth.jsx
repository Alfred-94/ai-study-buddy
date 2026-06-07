import React, { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "../supabaseClient";
import { useApp } from "../context/AppContext";
import { Brain, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Connect into your central design configuration system
  const { accentColor } = useApp();

  // Dynamic style mappings for user choice consistency
  const accentBgs = {
    purple: "bg-[#7C3AED] hover:bg-[#6D28D9] focus:ring-purple-500/20",
    blue: "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500/20",
    cyan: "bg-cyan-500 hover:bg-cyan-600 focus:ring-cyan-500/20",
    green: "bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500/20",
    orange: "bg-orange-500 hover:bg-orange-600 focus:ring-orange-500/20",
    pink: "bg-rose-500 hover:bg-rose-600 focus:ring-rose-500/20"
  };

  const accentTexts = {
    purple: "text-[#7C3AED]",
    blue: "text-blue-500",
    cyan: "text-cyan-500",
    green: "text-emerald-500",
    orange: "text-orange-500",
    pink: "text-rose-500"
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setSuccessMessage("Registration successful! Check your email for confirmation setup parameters.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err) {
      setErrorMessage(err.message || "An authentication pipeline routing breakdown occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 font-sans antialiased p-4 transition-colors duration-200">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] p-8 md:p-10 shadow-sm border border-gray-100 dark:border-slate-800/80"
      >
        {/* Brand Header Display */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className={`w-12 h-12 rounded-2xl ${accentBgs[accentColor] || "bg-[#7C3AED]"} flex items-center justify-center shadow-lg text-white mb-4 transition-colors`}>
            <Brain size={26} />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p className="text-gray-400 dark:text-slate-400 text-xs font-medium mt-2">
            {isSignUp ? "Establish your central learning portal metrics" : "Sign in to monitor execution parameters"}
          </p>
        </div>

        {/* Status Message Arrays */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-xs font-semibold text-red-600 dark:text-red-400">
            ⚠️ {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            ✨ {successMessage}
          </div>
        )}
        {/* Core Form Element Wrapper */}
        <form onSubmit={handleAuthSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
            <div className="relative bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-gray-100 dark:border-slate-800 h-12 flex items-center px-4 focus-within:ring-4 transition-all">
              <Mail size={16} className="text-gray-400 shrink-0" />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com" 
                className="w-full ml-3 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <div className="relative bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-gray-100 dark:border-slate-800 h-12 flex items-center px-4 focus-within:ring-4 transition-all">
              <Lock size={16} className="text-gray-400 shrink-0" />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full ml-3 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full h-12 rounded-2xl ${accentBgs[accentColor] || "bg-[#7C3AED]"} text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50`}
          >
            <span>{loading ? "Processing Viewport..." : isSignUp ? "Generate Profile" : "Initialize Session"}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        {/* View Switch Controller */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-slate-800/80 text-center">
          <button 
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMessage("");
              setSuccessMessage("");
            }}
            className="text-xs font-semibold text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition"
          >
            {isSignUp ? "Already configured? " : "New workflow array? "}
            <span className={`${accentTexts[accentColor] || "text-[#7C3AED]"} font-bold ml-1}`}>
              {isSignUp ? "Sign In" : "Create Account"}
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}