import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { 
  Timer, 
  Play, 
  Pause, 
  RotateCcw, 
  Coffee, 
  BookOpen, 
  Zap, 
  SkipForward,
  CheckCircle2,
  ChevronRight,
  HelpCircle,
  ArrowUpRight
} from "lucide-react";

export default function FocusTimer({ materials = [] }) {
  const { accentColor } = useApp();

  const MODES = {
    FOCUS: { label: "Focus Session", minutes: 25, color: "from-purple-600 to-indigo-600", accent: "purple" },
    SHORT_BREAK: { label: "Short Break", minutes: 5, color: "from-emerald-500 to-teal-500", accent: "green" },
    LONG_BREAK: { label: "Long Break", minutes: 15, color: "from-blue-500 to-cyan-500", accent: "blue" }
  };

  const [currentMode, setCurrentMode] = useState("FOCUS");
  const [timeLeft, setTimeLeft] = useState(MODES.FOCUS.minutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [completedSessions, setCompletedSessions] = useState(0);

  const timerRef = useRef(null);

  // Sync mode changes
  useEffect(() => {
    setTimeLeft(MODES[currentMode].minutes * 60);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentMode]);

  // Core countdown intervals tracking hook
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimerExpiry();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, currentMode]);

  // Dynamic chime synthesized sound engine player
  const playSuccessChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const context = new AudioContext();
      
      // Node sequence creation map variables
      const now = context.currentTime;
      
      const playNote = (freq, startOffset, duration) => {
        const osc = context.createOscillator();
        const gain = context.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + startOffset);
        
        gain.gain.setValueAtTime(0.3, now + startOffset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
        
        osc.connect(gain);
        gain.connect(context.destination);
        
        osc.start(now + startOffset);
        osc.stop(now + startOffset + duration);
      };

      // Play a clean ascending multi-note chord chime arrangement sequence
      playNote(523.25, 0, 0.4);     // C5
      playNote(659.25, 0.1, 0.4);   // E5
      playNote(783.99, 0.2, 0.5);   // G5
      playNote(1046.50, 0.3, 0.6);  // C6
    } catch (e) {
      console.log("Audio pipeline stream initializing fallback wrapper context:", e);
    }
  };

  const handleTimerExpiry = () => {
    setIsRunning(false);
    playSuccessChime();

    if (currentMode === "FOCUS") {
      setCompletedSessions((prev) => {
        const updatedCount = prev + 1;
        // Update local state indicators safely
        return updatedCount;
      });

      // Award +50 XP internally into browser context database layers dynamically
      const currentXp = parseInt(localStorage.getItem("studybuddy_xp") || "1450", 10);
      const dynamicNewXp = currentXp + 50;
      localStorage.setItem("studybuddy_xp", dynamicNewXp.toString());

      // Append metric value directly onto current day slot position index mapping vectors
      try {
        const weeklyData = JSON.parse(localStorage.getItem("studybuddy_weekly_progress") || "[]");
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const currentDayName = days[new Date().getDay()];
        
        const adjustedData = weeklyData.map(item => {
          if (item.day === currentDayName) {
            return { ...item, value: item.value + 15 };
          }
          return item;
        });
        localStorage.setItem("studybuddy_weekly_progress", JSON.stringify(adjustedData));
      } catch(err) {
        console.error("Local metrics storage vector stream mutation exception trace:", err);
      }

      alert("Phenomenal focus session completed! You earned +50 XP. Take a well-deserved break.");
      setCurrentMode("SHORT_BREAK");
    } else {
      alert("Break is over! Time to get back into the study zone.");
      setCurrentMode("FOCUS");
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(MODES[currentMode].minutes * 60);
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const accentBgs = {
    purple: "bg-[#7C3AED] hover:bg-[#6D28D9]",
    blue: "bg-blue-500 hover:bg-blue-600",
    cyan: "bg-cyan-500 hover:bg-cyan-600",
    green: "bg-emerald-500 hover:bg-emerald-600",
    orange: "bg-orange-500 hover:bg-orange-600",
    pink: "bg-rose-500 hover:bg-rose-600"
  };

  const HelpActionItems = [
    { label: "Timer Guides & Shortcuts", icon: Timer },
    { label: "Optimizing Focus Intervals", icon: Zap },
  ];

  return (
    <div className="max-w-full w-full space-y-8">
      {/* Title Header Matching Platform Context */}
      <div className="border-b border-gray-200/50 dark:border-slate-800/60 pb-6">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
          Focus Timer <Timer className="text-[#7C3AED] dark:text-[#A78BFA] w-8 h-8" />
        </h1>
        <p className="text-gray-500 dark:text-slate-400 mt-1.5 text-sm font-medium">
          Utilize deep work micro-intervals to optimize cognitive encoding pathways without fatigue.
        </p>
      </div>

      {/* Primary Layout Matrix Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* Core Time Display Card Container Block */}
        <div className="xl:col-span-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-8 shadow-sm flex flex-col items-center justify-center min-h-[480px]">
          
          {/* Mode Navigation Toggle Control Header */}
          <div className="flex gap-2 p-1.5 bg-slate-100/80 dark:bg-slate-800/60 rounded-2xl mb-12 border border-slate-200/40 dark:border-slate-700/40">
            {Object.keys(MODES).map((modeKey) => (
              <button
                key={modeKey}
                onClick={() => setCurrentMode(modeKey)}
                className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all ${
                  currentMode === modeKey
                    ? "bg-white dark:bg-slate-900 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {MODES[modeKey].label}
              </button>
            ))}
          </div>

          {/* Big Circular Counter Canvas Matrix Panel representation */}
          <div className="relative w-64 h-64 flex items-center justify-center mb-10">
            <div className="absolute inset-0 rounded-full border-4 border-slate-100 dark:border-slate-800" />
            {/* Animated underlying soft gradient layout pulse */}
            <div className={`absolute w-56 h-56 rounded-full bg-gradient-to-br ${MODES[currentMode].color} opacity-5 dark:opacity-10 blur-xl transition-all duration-700 ${isRunning ? "animate-pulse scale-105" : ""}`} />

            <div className="text-center relative z-10">
              <span className="text-6xl font-black text-gray-900 dark:text-white tracking-tighter font-mono tabular-nums">
                {formatTime()}
              </span>
              <p className="text-[11px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest mt-2">
                {isRunning ? "Ticking Down" : "Paused"}
              </p>
            </div>
          </div>

          {/* Core Controller Buttons Panel layout */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="p-4 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm"
              title="Reset current interval timeline"
            >
              <RotateCcw size={18} />
            </button>

            <button
              onClick={toggleTimer}
              className={`px-10 py-4 rounded-2xl text-white font-bold tracking-wide text-xs shadow-md flex items-center gap-2 transition-all bg-gradient-to-r ${MODES[currentMode].color} hover:opacity-95 transform active:scale-95`}
            >
              {isRunning ? (
                <>
                  <Pause size={14} fill="currentColor" /> Pause Session
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" /> Start Focus
                </>
              )}
            </button>

            <button
              onClick={() => handleTimerExpiry()}
              className="p-4 border border-gray-200 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all shadow-sm"
              title="Skip interval track"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>

        {/* Sidebar Widgets Matrix Layout Column Panels matching Mockups */}
        <div className="space-y-6">
          
          {/* Panel Module 1: Material Attacher Focus Linker */}
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[32px] p-6 shadow-sm">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white mb-2 tracking-tight flex items-center gap-2 uppercase tracking-wider">
              <BookOpen size={16} className="text-[#7C3AED] dark:text-[#A78BFA]" /> Target Study Focus
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-400 font-medium leading-relaxed mb-4">
              Link a resource module below to contextually track your session progress metrics.
            </p>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {materials.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 text-center py-4 font-medium">
                  No resource modules uploaded yet.
                </p>
              ) : (
                materials.map((file) => {
                  const isTargeted = selectedFile?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFile(isTargeted ? null : file)}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${isTargeted 
                          ? "bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-300 shadow-sm" 
                          : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-800 text-gray-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      }`}
                    >
                      <p className="font-bold text-xs truncate max-w-[180px]">{file.name}</p>
                      {isTargeted && <CheckCircle2 size={14} className="text-[#7C3AED] dark:text-[#A78BFA] flex-shrink-0" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Module 2: Dark Metric Progress Tracker Ledger */}
          <div className="bg-gradient-to-b from-[#0F072D] via-[#130B3A] to-[#1C1254] dark:from-slate-950 dark:to-slate-900 text-white rounded-[32px] p-6 shadow-sm relative overflow-hidden border dark:border-slate-800/60">
            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-white/5 pointer-events-none">
              <Zap size={120} />
            </div>

            <h3 className="font-bold text-xs uppercase tracking-wider text-purple-300 flex items-center gap-2">
              <Zap size={14} className="text-amber-400 fill-amber-400" /> Session Accumulation
            </h3>
            
            <div className="mt-5 flex items-baseline gap-2">
              <span className="text-5xl font-black text-white font-mono tracking-tighter">{completedSessions}</span>
              <span className="text-xs text-white/50 font-bold uppercase tracking-wider font-mono">Blocks Finished Today</span>
            </div>

            {selectedFile && (
              <div className="mt-5 pt-4 border-t border-white/10 text-xs">
                <span className="text-white/40 block font-bold uppercase tracking-wider font-mono">Active Focus Track:</span>
                <span className="text-purple-300 font-bold truncate block mt-1">{selectedFile.name}</span>
              </div>
            )}
          </div>

          {/* Panel Module 3: Dynamic Contextual Action Help Guides */}
          <div className="bg-purple-50/50 dark:bg-purple-950/10 rounded-3xl p-5 border border-purple-100/50 dark:border-purple-900/20 space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs text-[#7C3AED] dark:text-[#A78BFA] uppercase tracking-wider">
              <HelpCircle size={15} />
              <span>Study Insights Hub</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 leading-relaxed font-medium">
              Maximize retention factors by shifting layout frameworks dynamically across work channels.
            </p>
            
            <div className="space-y-1 pt-1">
              {HelpActionItems.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-gray-100 dark:hover:border-slate-800 text-left group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-50 dark:bg-slate-800 group-hover:bg-purple-50 dark:group-hover:bg-purple-950/30 rounded-lg text-slate-400 group-hover:text-[#7C3AED] dark:group-hover:text-[#A78BFA] transition">
                        <Icon size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{action.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition" />
                  </button>
                );
              })}
            </div>
          </div>
          </div>
      </div>
    </div>
  );
}