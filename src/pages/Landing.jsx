import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  // 🧭 The navigation anchor hook to switch routes programmatically
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 font-sans antialiased flex flex-col justify-between">
      {/* Top Header Navbar Navigation Row */}
      <header className="max-w-6xl w-full mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧠</span>
          <span className="text-xl font-black text-slate-900 tracking-tight">StudyBuddy.ai</span>
        </div>
        <button 
          onClick={() => navigate('/auth')}
          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50 transition-colors"
        >
          Launch App
        </button>
      </header>

      {/* Main Hero Dynamic Splash Core */}
      <main className="max-w-3xl mx-auto text-center px-6 py-20 flex flex-col items-center justify-center my-auto">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-none mb-6">
          Master your studies in <br />
          <span className="text-purple-600 bg-purple-50 px-3 py-1 rounded-2xl border border-purple-100">half the time.</span>
        </h1>
        
        <p className="text-base text-slate-500 max-w-xl mb-10 font-medium leading-relaxed">
          Upload your lecture slides or PDFs, instantly generate Duolingo-style quizzes, track your focus streaks, and ace your exams.
        </p>

        {/* 🚀 FIXED TRIGGER BUTTON: Anchors users forward to login paths */}
        <button
          onClick={() => navigate('/auth')}
          className="group relative bg-purple-600 text-white font-bold text-base px-8 py-4 rounded-2xl shadow-md shadow-purple-500/20 hover:bg-purple-700 active:scale-[0.98] transition-all flex items-center gap-2"
        >
          <span>Get Started For Free</span>
          <span className="transition-transform group-hover:translate-x-0.5">➡️</span>
        </button>
      </main>

      {/* Footer Branding Line */}
      <footer className="text-center py-6 text-xs text-slate-400 font-medium border-t border-slate-100">
        &copy; {new Date().getFullYear()} StudyBuddy.ai. Built for modern learners.
      </footer>
    </div>
  );
}