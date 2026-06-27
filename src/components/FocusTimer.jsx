import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../context/AppContext";
import { 
  Timer, Play, Pause, RotateCcw, BookOpen, SkipForward,
  ShieldAlert, Eye, FileText, HardDrive, X, Music, Disc, Radio
} from "lucide-react";

export default function FocusTimer() {
  const { 
    materials, 
    toggleFileDestination,
    awardXp,
    isStrictModeActive,
    setIsStrictModeActive,
    activeFocusFile,
    setActiveFocusFile
  } = useApp();

  const MODES = {
    FOCUS: { label: "Focus Session", minutes: 25, color: "from-purple-500 to-indigo-500", rawGlow: "#8B5CF6" },
    SHORT_BREAK: { label: "Short Break", minutes: 5, color: "from-emerald-500 to-teal-500", rawGlow: "#10B981" },
    LONG_BREAK: { label: "Long Break", minutes: 15, color: "from-blue-500 to-cyan-500", rawGlow: "#3B82F6" }
  };

  const AUDIO_STATIONS = [
    { id: "synth", name: "Deep Focus Ambient Synth", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: "lofi", name: "Chill Beats & Lo-Fi Study", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3" },
    { id: "rain", name: "Cosmic Rain backdrop", url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" }
  ];

  const [currentMode, setCurrentMode] = useState("FOCUS");
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  
  const [activeStation, setActiveStation] = useState(null);
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const musicAudioRef = useRef(null);
  const timerRef = useRef(null);

  const focusTimerFiles = materials ? materials.filter(file => file.sentToTimer === true) : [];

  // Synchronize timer duration changes safely
  useEffect(() => {
    const targetMinutes = currentMode === "FOCUS" ? focusMinutes : (MODES[currentMode]?.minutes || 5);
    setTimeLeft(targetMinutes * 60);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [currentMode, focusMinutes]);

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
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, currentMode]);

  useEffect(() => {
    if (isPlayingMusic && activeStation) {
      if (musicAudioRef.current) musicAudioRef.current.pause();
      musicAudioRef.current = new Audio(activeStation.url);
      musicAudioRef.current.loop = true;
      musicAudioRef.current.volume = 0.25;
      musicAudioRef.current.play().catch(e => console.log("Audio play blocked by browser interaction policy:", e));
    } else {
      if (musicAudioRef.current) musicAudioRef.current.pause();
    }
    return () => { if (musicAudioRef.current) musicAudioRef.current.pause(); };
  }, [isPlayingMusic, activeStation]);

  const handleTimerExpiry = () => {
    setIsRunning(false);
    if (currentMode === "FOCUS") {
      setCompletedSessions((prev) => prev + 1);
      if (awardXp) awardXp(50);
      setCurrentMode("SHORT_BREAK");
    } else {
      setCurrentMode("FOCUS");
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    const targetMinutes = currentMode === "FOCUS" ? focusMinutes : (MODES[currentMode]?.minutes || 5);
    setTimeLeft(targetMinutes * 60);
  };

  const formatTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  // Safe Progress Circle calculation variables
  const maxMinutes = currentMode === "FOCUS" ? focusMinutes : (MODES[currentMode]?.minutes || 5);
  const maxSeconds = maxMinutes * 60;
  const progressPercent = maxSeconds > 0 ? (timeLeft / maxSeconds) : 1;
  const strokeDashoffset = 440 - (440 * progressPercent);
  const activeModeConfig = MODES[currentMode] || MODES.FOCUS;

  const renderTimerInterface = () => (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Mode Switch Selection Navigation */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-[#161926] rounded-full mb-10 border border-slate-200 dark:border-[#23273a]">
        {Object.keys(MODES).map((modeKey) => (
          <button
            key={modeKey}
            type="button"
            onClick={() => setCurrentMode(modeKey)}
            className={`px-5 py-2 rounded-full text-xs font-bold tracking-wide transition-all duration-300 ${
              currentMode === modeKey
                ? `bg-gradient-to-r ${MODES[modeKey].color} text-white shadow-lg`
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white"
            }`}
          >
            {MODES[modeKey].label}
          </button>
        ))}
      </div>

      {/* Progress SVG Ring Container */}
      <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" className="stroke-slate-200 dark:stroke-[#131520]" strokeWidth="8" fill="transparent" />
          <motion.circle 
            cx="80" 
            cy="80" 
            r="70" 
            stroke={`url(#glowGrad-${currentMode})`}
            strokeWidth="8" 
            strokeDasharray="440"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent" 
          />
          <defs>
            <linearGradient id={`glowGrad-${currentMode}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A78BFA" />
              <stop offset="100%" stopColor={activeModeConfig.rawGlow} />
            </linearGradient>
          </defs>
        </svg>

        <div 
          className="absolute w-52 h-52 rounded-full blur-3xl opacity-10 dark:opacity-20 transition-all duration-700"
          style={{ backgroundColor: activeModeConfig.rawGlow, transform: isRunning ? 'scale(1.1)' : 'scale(1)' }}
        />

        <div className="text-center absolute z-10">
          <span className="font-black text-slate-900 dark:text-white text-6xl tracking-tight font-mono tabular-nums">
            {formatTime()}
          </span>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            {currentMode === "FOCUS" ? "Focus Time" : "Break Interval"}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-4">
        <button
          onClick={resetTimer}
          className="p-3.5 bg-slate-50 dark:bg-[#141622] border border-slate-200 dark:border-[#22263b] rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition transform active:scale-95"
          title="Reset timer track"
        >
          <RotateCcw size={18} />
        </button>

        <button
          onClick={toggleTimer}
          className={`px-10 py-4 rounded-full text-white font-extrabold tracking-wide text-sm shadow-xl flex items-center gap-2.5 transition-all transform active:scale-95 bg-gradient-to-r ${activeModeConfig.color} hover:brightness-110`}
        >
          {isRunning ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" />}
          <span>{isRunning ? "Pause" : "Start"}</span>
        </button>
        <button
          onClick={handleTimerExpiry}
          className="p-3.5 bg-slate-50 dark:bg-[#141622] border border-slate-200 dark:border-[#22263b] rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition transform active:scale-95"
          title="Skip Interval"
        >
          <SkipForward size={18} />
        </button>
      </div>

      {/* Adjusted Duration Dropdowns Menu Options Container Option Selection */}
      {currentMode === "FOCUS" && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Adjust Session Length
          </span>
          <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-[#161926] rounded-xl border border-slate-200 dark:border-[#23273a]">
            {[25, 30, 40, 60].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setFocusMinutes(mins)}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                  focusMinutes === mins
                    ? "bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {mins}m
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-full w-full bg-white dark:bg-[#090a0f] text-slate-900 dark:text-slate-100 min-h-screen p-1 sm:p-4 space-y-8 relative">
      
      {/* IMMERSIVE STRICT LOCK OVERLAY SYSTEM */}
      <AnimatePresence>
        {isStrictModeActive && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-white dark:bg-[#06070a] z-[999] flex flex-col items-center justify-center p-6"
          >
            <div className="absolute top-6 right-6">
              <button 
                onClick={() => setIsStrictModeActive(false)} 
                className="p-3 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full text-slate-700 dark:text-white/70 transition"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-w-xl w-full text-center space-y-8">
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 rounded-full animate-pulse">
                  <ShieldAlert size={28} />
                </div>
                <h2 className="text-xl font-bold tracking-tight mt-2">Strict Focus Engine Locked</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">System matrix isolation active. Retain session attention variables.</p>
              </div>
              <div className="bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1e2235] rounded-[32px] p-10 shadow-2xl">
                {renderTimerInterface()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header View Section Layout */}
      <div className="pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Focus Mode <Timer className="text-purple-500 dark:text-purple-400 w-8 h-8" />
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-xs">
            Eliminate distractions. Maximize learning.
          </p>
        </div>
        <button
          onClick={() => setIsStrictModeActive(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 font-bold text-xs rounded-xl hover:bg-red-500/20 transition-all shadow-sm"
        >
          <ShieldAlert size={14} />
          <span>Activate Strict Lock</span>
        </button>
      </div>

      {/* CORE SYNC LAYOUT WRAPPER GRID */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN PANEL WORKSPACE (Timer Circle) */}
        <div className="xl:col-span-7 bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1a1d2d] rounded-[32px] p-8 shadow-xl flex flex-col items-center justify-center min-h-[480px]">
          {renderTimerInterface()}
        </div>

        {/* RIGHT COLUMN GRID */}
        <div className="xl:col-span-5 space-y-6">
          
          {/* Today's Target Goal Progress Track */}
          <div className="bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1a1d2d] rounded-[24px] p-6 shadow-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Today's Goal</h3>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{completedSessions} / 4 Pomodoros Complete</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-[#161824] h-2.5 rounded-full overflow-hidden">
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full"
                animate={{ width: `${Math.min((completedSessions / 4) * 100, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Today's Statistical Counter Profile Grid */}
          <div className="bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1a1d2d] rounded-[24px] p-6 shadow-md space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Stats</h3>
            <div className="divide-y divide-slate-200 dark:divide-[#1b1f32]">
              {[
                { name: "Focus Time", val: `${completedSessions * maxMinutes}m` },
                { name: "Sessions Completed", val: completedSessions },
                { name: "Distractions Blocked", val: isStrictModeActive ? "12" : "0" },
                { name: "Topics Studied", val: focusTimerFiles.length }
              ].map((stat, i) => (
                <div key={i} className="flex justify-between items-center py-3 text-xs font-medium">
                  <span className="text-slate-500 dark:text-slate-400">{stat.name}</span>
                  <span className="text-slate-900 dark:text-white font-bold font-mono">{stat.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* AMBIENT MUSIC CHANNELS & CONTROLLER */}
          <div className="bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1a1d2d] rounded-[24px] p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Music size={14} className={`text-purple-500 ${isPlayingMusic ? 'animate-spin' : ''}`} /> 
                Focus Music Vault
              </h3>
              {activeStation && (
                <button 
                  onClick={() => setIsPlayingMusic(!isPlayingMusic)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${isPlayingMusic ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-transparent'}`}
                 >
                  {isPlayingMusic ? "STREAMING ACTIVE" : "STREAM MUTED"}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {AUDIO_STATIONS.map((station) => (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => {
                    setActiveStation(station);
                    setIsPlayingMusic(true);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-left border transition-all group ${
                    activeStation?.id === station.id
                      ? "bg-purple-50 dark:bg-purple-950/20 border-purple-500/40 text-purple-700 dark:text-white"
                      : "bg-white dark:bg-[#141622] border-slate-200 dark:border-[#22263b] text-slate-600 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${activeStation?.id === station.id ? 'bg-purple-500/20 text-purple-500' : 'bg-slate-100 dark:bg-[#1b1f32] text-slate-400'}`}>
                      <Radio size={14} />
                    </div>
                    <span className="text-xs font-bold truncate">{station.name}</span>
                  </div>
                  <Disc size={14} className={`text-slate-400 group-hover:text-purple-500 transition-all ${activeStation?.id === station.id && isPlayingMusic ? 'animate-spin' : ''}`} />
                </button>
              ))}
            </div>
          </div>

          {/* LINKED ATTACHMENTS */}
          <div className="bg-slate-50 dark:bg-[#0e1017] border border-slate-200 dark:border-[#1a1d2d] rounded-[24px] p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <BookOpen size={14} className="text-purple-500" /> Linked Focus Assets
              </h3>
              <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-2 py-0.5 rounded-md">
                {focusTimerFiles.length} Loaded
              </span>
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {focusTimerFiles.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-[#22263b] rounded-xl">
                  <HardDrive size={20} className="mx-auto text-slate-400 mb-1.5" />
                  <p className="text-[11px] text-slate-400 max-w-[180px] mx-auto">
                    No active materials targeted. Push files from your Vault dashboard!
                  </p>
                </div>
              ) : (
                focusTimerFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#141622] border border-slate-200 dark:border-[#22263b] hover:border-purple-500/40 transition-all"
                  >
                    <p className="font-bold text-xs text-slate-700 dark:text-slate-300 truncate pr-2">{file.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button 
                        onClick={() => setActiveFocusFile(file)}
                        className="p-1 text-slate-400 hover:text-purple-500 rounded-md"
                        title="Split view item"
                      >
                        <Eye size={13} />
                      </button>
                      <button 
                        onClick={() => toggleFileDestination(file.id, "sentToTimer")}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-md"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}