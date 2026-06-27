import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../supabaseClient";
import MaterialUpload from "../components/MaterialUpload";
import AiCoach from "../components/AiCoach";
import FocusTimer from "../components/FocusTimer";
import SmartQuizzes from "../components/SmartQuizzes";
import Settings from "../components/Settings";
import StudyGroup from "../components/StudyGroup";
import { useApp } from "../context/AppContext";
import { translations } from "../utils/translations";
import WeakTopicTracker from "../components/WeakTopicTracker";
import StudyPlanner from "../components/StudyPlanner";
import NotesWorkspace from "../components/NotesWorkspace";

import {
  LayoutDashboard,
  Brain,
  Bot,
  Upload,
  Timer,
  BarChart3,
  Trophy,
  SettingsIcon,
  Bell,
  Search,
  Menu,
  Flame,
  Zap,
  Award,
  TrendingUp,
  Target,
  LogOut,
  FileText,
  Users,
  NotebookPen,
  NotebookIcon
} from "lucide-react";

import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import MaterialPreview from "../components/MaterialPreview";

// 🟢 FIX: Backticks wrapped correctly for template literal variables
const StatCard = ({ icon: Icon, title, value, subtitle, iconBg, badge }) => (
  <motion.div
    whileHover={{ y: -4 }}
    className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800"
  >
    <div className="flex items-start gap-4">
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-7 h-7" />
      </div>

      <div className="flex-1">
        <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{title}</p>
        <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>

        <div className="mt-3 flex items-center gap-2">
          {badge}
          <span className="text-sm text-gray-500 dark:text-slate-400">{subtitle}</span>
        </div>
      </div>
    </div>
  </motion.div>
);

export default function Dashboard() {
  // =================================================================
  // 🟢 HOOK ZONE: All State Engines consolidated perfectly at the top level
  // =================================================================
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [initializingAuth, setInitializingAuth] = useState(true);
  const [settingsSubSection, setSettingsSubSection] = useState("general");
  const [topbarAvatar, setTopbarAvatar] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef(null);

  // 🟢 FIX: Moved down inside the component function block
  const [userMetrics, setUserMetrics] = useState({
    quizAverage: 62,              
    flashcardPerformance: 55,
    studyCompletionRate: 70,
    practiceExercises: 45
  });

  const [topicsData, setTopicsData] = useState([
    { name: "Photosynthesis", subject: "Biology", quizScore: 90, practiceCount: 3, repeatedFailures: false },
    { name: "Genetics", subject: "Biology", quizScore: 85, practiceCount: 2, repeatedFailures: false },
    { name: "Chemical Bonding", subject: "Chemistry", quizScore: 78, practiceCount: 2, repeatedFailures: false },
    { name: "Cell Respiration", subject: "Biology", quizScore: 35, practiceCount: 1, repeatedFailures: true },
    { name: "Mitosis", subject: "Biology", quizScore: 28, practiceCount: 1, repeatedFailures: true }
  ]);

  const [materialsData, setMaterialsData] = useState([
    { id: "res_notes", title: "Cell Respiration – In Depth Notes", type: "Notes", metadata: "PDF • 4 Pages", topic: "Cell Respiration" },
    { id: "res_video", title: "Mitosis – Animated Video Guide", type: "Videos", metadata: "Video • 12 mins", topic: "Mitosis", progress: 80 },
    { id: "res_quiz", title: "Cell Respiration Specialized Quiz", type: "Quizzes", metadata: "15 Practice Questions", topic: "Cell Respiration" },
    { id: "res_cards", title: "Mitosis High-Yield Flashcards", type: "Flashcards", metadata: "20 Smart Cards", topic: "Mitosis", mastered: 5, learning: 10, difficult: 5 }
  ]);
  
  // =================================================================
  // 🟢 LIVE SUPABASE FETCH ENGINE
  // =================================================================
  useEffect(() => {
    const fetchTrackerData = async () => {
      // 1. Safety check: Only run if we actually have a logged-in user
      if (!userId) return; 

      try {
        // 2. Fetch User Metrics
        const { data: metricsData, error: metricsErr } = await supabase
          .from('user_metrics')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();
        
        // If they have saved metrics, update the state. Otherwise, keep the defaults.
        if (metricsData) {
          setUserMetrics({
            quizAverage: metricsData.quiz_average,
            flashcardPerformance: metricsData.flashcard_performance,
            studyCompletionRate: metricsData.study_completion_rate,
            practiceExercises: metricsData.practice_exercises
          });
        }

        // 3. Fetch User Topics
        const { data: topicsRes, error: topicsErr } = await supabase
          .from('user_topics')
          .select('*')
          .eq('user_id', userId);
          
        // If they have topics saved, map them to match our frontend structure
        if (topicsRes && topicsRes.length > 0) {
          const formattedTopics = topicsRes.map(t => ({
            name: t.name,
            subject: t.subject,
            quizScore: t.quiz_score,
            practiceCount: t.practice_count,
            repeatedFailures: t.repeated_failures
          }));
          setTopicsData(formattedTopics);
        }

        // 4. Fetch Adaptive Study Materials
        const { data: materialsRes, error: materialsErr } = await supabase
          .from('study_materials')
          .select('*');
          
        // If there are materials in the global library, map them
        if (materialsRes && materialsRes.length > 0) {
          setMaterialsData(materialsRes);
        }

      } catch (error) {
        console.error("Error fetching live tracker data:", error);
      }
    };

    fetchTrackerData();
  }, [userId]); // This dependency array ensures it re-runs if the user ID changes

  // 🟢 FIX: Action handler safely instantiated inside the parent component body
  const handleAddToPlanner = (newPlanItem) => {
    console.log("Loop intercepted! Syncing tracking metrics with Study Planner array...", newPlanItem);
  };

  // --- RECONCILED GLOBAL REACTIVE DATA ENGINE CONNECTIONS ---
  const {
    xp = 0,
    streak = 0,
    quizzesMastered = 0,
    weeklyProgress = [],
    language = "English (US)",
    accentColor = "purple",
    materials = [],
    currentUserUserName,
    setCurrentUserUserName,
    currentUserAvatar,
    setCurrentUserAvatar,
    notifications = [],
    setNotifications
  } = useApp();
  
  const { user } = useApp();
  const { streakCount } = useApp();
  const { quizzesMasteredCount } = useApp();

  const [insights, setInsights] = useState([]);
  const [weeklyProgressPercent, setWeeklyProgressPercent] = useState(0);

  const t = translations[language] || translations["English (US)"];

  // Dynamic Accent Color Style Map Configurations
  const accentBgs = {
    purple: "bg-[#7C3AED] hover:bg-[#6D28D9]",
    blue: "bg-blue-500 hover:bg-blue-600",
    cyan: "bg-cyan-500 hover:bg-cyan-600",
    green: "bg-emerald-500 hover:bg-emerald-600",
    orange: "bg-orange-500 hover:bg-orange-600",
    pink: "bg-rose-500 hover:bg-rose-600"
  };

  const accentTexts = {
    purple: "text-[#7C3AED]",
    blue: "text-blue-500",
    cyan: "text-cyan-500",
    green: "text-emerald-500",
    orange: "text-orange-500",
    pink: "text-rose-500"
  };

  const accentBorders = {
    purple: "border-[#7C3AED]",
    blue: "border-blue-500",
    cyan: "border-cyan-500",
    green: "border-emerald-500",
    orange: "border-orange-500",
    pink: "border-rose-500"
  };

  const accentPills = {
    purple: "bg-purple-50 dark:bg-purple-950/30 text-[#7C3AED]",
    blue: "bg-blue-50 dark:bg-blue-950/30 text-blue-500",
    cyan: "bg-cyan-50 dark:bg-cyan-950/30 text-cyan-500",
    green: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500",
    orange: "bg-orange-50 dark:bg-orange-950/30 text-orange-500",
    pink: "bg-rose-50 dark:bg-rose-950/30 text-rose-500"
  };

// 🟢 SYNC MANAGER: Update database and UI simultaneously
const handleUpdateTopic = async (topicId, updatedFields) => {
  try {
    // 1. Update the Database
    const { error } = await supabase
      .from('user_topics')
      .update(updatedFields)
      .eq('id', topicId); // Assumes you have an ID column in your table

    if (error) throw error;

    // 2. Update Local State (UI)
    setTopicsData(prev => prev.map(t => 
      t.id === topicId ? { ...t, ...updatedFields } : t
    ));
    
    console.log("Database and State synced successfully!");
  } catch (err) {
    console.error("Sync failure:", err);
  }
};

  // Compute Dynamic Insights and Progress percentages based on live Context streams
  useEffect(() => {
    const weeklyTargetScore = 2000;
    const currentPercent = Math.min(Math.round((xp / weeklyTargetScore) * 100), 100);
    setWeeklyProgressPercent(currentPercent);

    const dynamicInsights = [
      {
        title: streak > 3 ? "Excellent discipline streak!" : "Build your focus momentum",
        subtitle: streak > 3 ? `You maintained an active streak of ${streak} days.` : "Complete a focus session today to build consistency parameters.",
        icon: TrendingUp,
        color: "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
      },
      {
        title: "Verify materials index",
        subtitle: materials && materials.length > 0 ? `You currently have ${materials.length} resource modules actively parsed.` : "No study materials uploaded yet. Upload a PDF to start.",
        icon: Brain,
        color: `${accentPills[accentColor] || "bg-purple-50 text-purple-600"} border border-current/10`
      },
      {
        title: currentPercent >= 100 ? "Weekly milestone achieved!" : "Goal almost there!",
        // 🟢 FIX: Fixed missing string template backticks below
        subtitle: currentPercent >= 100 ? "You passed your weekly target parameter thresholds!" : `Earn ${Math.max(0, weeklyTargetScore - xp)} more XP to hit your weekly target milestone.`,
        icon: Target,
        color: "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
      }
    ];
    setInsights(dynamicInsights);
  }, [streak, xp, materials, accentColor]);

  // Click outside listener to dismiss search dropdown cleanly
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Listen for live upload metadata events from Settings.jsx
  useEffect(() => {
    const handleRefresh = () => {
      supabase.auth.getUser().then(({ data }) => {
        if (data?.user) {
          const metaAvatar = data.user.user_metadata?.avatar_url;
          const metaName = data.user.user_metadata?.username || data.user.user_metadata?.full_name || data.user.email?.split("@")[0];
          
          if (metaAvatar && typeof setCurrentUserAvatar === "function") setCurrentUserAvatar(metaAvatar);
          if (metaName && typeof setCurrentUserUserName === "function") setCurrentUserUserName(metaName);
          setUserEmail(data.user.email || "");
        }
      });
    };

    handleRefresh();

    window.addEventListener("storage_avatar_updated", handleRefresh);
    return () => window.removeEventListener("storage_avatar_updated", handleRefresh);
  }, [setCurrentUserAvatar, setCurrentUserUserName]);

  useEffect(() => {
    const fetchUserSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          setUserEmail(user.email || "");
          const fallbackName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split("@")[0] || "Scholar";
          if (typeof setCurrentUserUserName === "function") setCurrentUserUserName(fallbackName);
          if (user.user_metadata?.avatar_url && typeof setCurrentUserAvatar === "function") setCurrentUserAvatar(user.user_metadata.avatar_url);
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          setUserId(session?.user?.id || null);
          setUserEmail(session?.user?.email || "");
          const fallbackName = session?.user?.user_metadata?.username || session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Scholar";
          if (typeof setCurrentUserUserName === "function") setCurrentUserUserName(fallbackName);
          if (session?.user?.user_metadata?.avatar_url && typeof setCurrentUserAvatar === "function") setCurrentUserAvatar(session.user.user_metadata.avatar_url);
        }
      } catch (err) {
        console.error("Session verification routing error:", err);
      } finally {
        setInitializingAuth(false);
      }
    };

    fetchUserSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || "");
      const fallbackName = session?.user?.user_metadata?.username || session?.user?.user_metadata?.full_name || session?.user?.email?.split("@")[0] || "Scholar";
      if (typeof setCurrentUserUserName === "function") setCurrentUserUserName(fallbackName);
      if (session?.user?.user_metadata?.avatar_url && typeof setCurrentUserAvatar === "function") setCurrentUserAvatar(session.user.user_metadata.avatar_url);
      setInitializingAuth(false);
    });

    return () => subscription.unsubscribe();
  }, [setCurrentUserUserName, setCurrentUserAvatar]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout pipeline failure:", err);
    }
  };

  const filteredMaterials = (materials || []).filter((material) =>
    material?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const computeLevel = Math.floor(xp / 500) + 1;
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (weeklyProgressPercent / 100) * circumference;

  const renderProfileImage = () => {
    if (currentUserAvatar) {
      return (
        <img
          src={currentUserAvatar}
          alt="User Identity Frame"
          className="w-full h-full object-cover"
        />
      );
    }

    const initials = currentUserUserName
      ? currentUserUserName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
      : userEmail ? userEmail.substring(0, 2).toUpperCase() : "U";
      
   

  // Rest of your JSX Return Layout block below...

    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-700 text-white text-xs font-black tracking-wider shadow-inner">
        {initials}
      </div>
    );
  };

  if (initializingAuth) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-slate-950 flex-col gap-3">
        <div className={`text-3xl animate-spin ${accentTexts[accentColor] || "text-purple-600"}`}>🧠</div>
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 animate-pulse">Getting your study session ready...</p>
      </div>
    );
  }

  const sidebarItems = [
    { icon: LayoutDashboard, label: "Dashboard", translation: t.dashboard || "Dashboard" },
    { icon: Brain, label: "Smart Quizzes", translation: t.smartQuizzes || "Smart Quizzes" },
    { icon: Bot, label: "AI Study Coach", translation: t.aiStudyCoach || "AI Study Coach" },
    { icon: NotebookIcon, label: "Notes Workspace", translation: t.notesWorkspace || "Notes"},
    { icon: Upload, label: "Upload Materials", translation: t.uploadMaterials || "Upload Materials" },
    { icon: Timer, label: "Focus Timer", translation: t.focusTimer || "Focus Timer" },
    { icon: Users, label: "Study Group", translation: t.studyGroup || "Study Group" },
    { icon: NotebookPen, label: "Study Planner", translation: t.StudyPlanner || "Study Planner"},
    { icon: SettingsIcon, label: "Settings", translation: t.settings || "Settings" }
      ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100 font-sans antialiased transition-colors duration-200">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar Navigation Panel Layout */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-[#0F072D] via-[#130B3A] to-[#1C1254] dark:from-slate-950 dark:to-slate-900 text-white z-50 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 border-r dark:border-slate-800/40`}>
        <div className="flex flex-col h-full p-6">
          {/* Brand Logo Identity Header */}
          <div className="flex items-center gap-3 mb-10">
            <div className={`w-10 h-10 rounded-xl ${accentBgs[accentColor]} flex items-center justify-center shadow-md transition-colors`}>
              <Brain size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">StudyBuddy.ai</h1>
          </div>

          {/* Navigation Matrix Iteration Loop */}
          <nav className="space-y-1.5 flex-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isSelected = activeTab === item.label;

              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setActiveTab(item.label);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${isSelected ? `${accentBgs[accentColor]} shadow-lg text-white font-bold` : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.translation}</span>
                </button>
              );
            })}
          </nav>

          {/* --- SIDEBAR ACTIVE ENGAGEMENT STREAK CARD BLOCK --- */}
          <div className="p-4 mx-3 mb-4 rounded-2xl bg-gradient-to-br from-violet-600/10 to-indigo-600/5 border border-violet-500/10 text-left">
            <span className="text-[10px] font-black tracking-wider text-violet-600 dark:text-violet-400 uppercase">
              Active Engagement Streak
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-slate-800 dark:text-white transition-all">
                {streakCount || 0}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {streakCount === 1 ? 'Day' : 'Days'}
              </span>
            </div>

            {/* Micro progress status indicators bar layout */}
            <div className="flex gap-1 mt-2.5">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${i < (streakCount % 6 || 1) ? 'bg-violet-600' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                />
              ))}
            </div>
            <p className="text-[9px] font-mono text-gray-400 mt-2">
              Consistency secures execution metrics!
            </p>
          </div>
          {/* Profile Information Block and Logout Switch */}
          <div className="flex items-center gap-3 p-2 bg-white/5 border border-white/5 rounded-2xl">
            {/* 🟢 RECONCILED SYNCED SIDEBAR AVATAR ELEMENT */}
            <div className="h-10 w-10 rounded-full overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
              {renderProfileImage()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-xs text-white truncate">{currentUserUserName}</p>
              <p className="text-[11px] text-white/50 truncate font-medium">{userEmail}</p>
            </div>
            <button onClick={handleLogout} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition" title="Disconnect Session">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Framework Content Slot Canvas viewport */}
      <div className="lg:ml-72">
        {/* Global sticky layout control header */}
        <header className="sticky top-0 z-30 bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl px-4 md:px-8 py-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <Menu size={20} />
          </button>

          {/* Functional Search Command Center Component */}
          <div ref={searchRef} className="flex-1 relative">
            <div className="bg-white dark:bg-slate-900 rounded-2xl h-12 flex items-center px-4 shadow-sm border border-gray-100 dark:border-slate-800 max-w-md transition-all focus-within:ring-2 focus-within:ring-purple-500/20">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                placeholder="Search uploaded materials..."
                className="w-full ml-3 bg-transparent text-xs outline-none text-slate-700 dark:text-slate-200 font-medium"
              />
            </div>
            {/* Dropdown search query matches matrix */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.trim() !== "" && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute left-0 mt-2 w-full max-w-md bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                >
                  {filteredMaterials.length > 0 ? (
                    <div className="p-2 space-y-0.5">
                      <p className="text-[10px] font-bold text-gray-400 px-3 py-1.5 uppercase tracking-wider">Matching Study Materials</p>
                      {filteredMaterials.map((file, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setActiveTab("Upload Materials");
                            setIsSearchFocused(false);
                            setSearchQuery("");
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition text-left"
                        >
                          <FileText size={16} className="text-[#7C3AED] dark:text-[#A78BFA] shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{file.name || "Untitled Material document"}</span>
                          </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400 font-medium">
                      No matching materials found for "{searchQuery}"
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center gap-4">

            {/* Notification Bell System */}
<button
  onClick={() => {
    setSettingsSubSection("Notifications");
    setActiveTab("Settings");
    
    // 🟢 OPTIONAL: Clear the unread indicator count when they open the dashboard tab
    if (typeof setNotifications === 'function') {
      setNotifications([]); 
    }
  }}
  className="relative p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white dark:bg-slate-900 rounded-full border border-gray-100 dark:border-slate-800 transition shadow-sm focus:outline-none"
  title="Open Notification Parameters"
>
  <Bell size={20} />
  
  {notifications.length > 0 && (
    <span className="absolute top-1 right-1 w-4 h-4 bg-purple-600 rounded-full text-[10px] font-black text-white flex items-center justify-center animate-pulse">
      {notifications.length}
    </span>
  )}
</button>

            {/* Profile Avatar Trigger */}
            <button
              onClick={() => {
                setSettingsSubSection("Profile");
                setActiveTab("Settings");
              }}
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-500/20 hover:border-purple-500 transition active:scale-95 focus:outline-none focus:ring-4 focus:ring-purple-500/10 shadow-sm bg-slate-100 shrink-0 flex items-center justify-center"
              title="Open Profile Adjustments"
            >
              {/* 🟢 RECONCILED SYNCED TOPBAR AVATAR SWITCH */}
              {renderProfileImage()}
            </button>
          </div>
        </header>

        {/* Core Screen Component Conditional Branch Manager */}
        <main className="p-4 md:p-8">
          {activeTab === "Dashboard" && (
            <div className="space-y-8">
              {/* Profile Welcome Message Row */}
              <section className="grid xl:grid-cols-3 gap-6">
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
                      {t.welcomeBack ? t.welcomeBack.split(',')[0] + ',' : 'Welcome Back 👋,'}<br />
                      {currentUserUserName || 'Scholar!'}
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 text-sm font-medium mt-4">
                      You're making great progress today. Ready to complete your target milestones for today?
                    </p>
                  </div>
                  <div className={`mt-6 flex items-center gap-3 ${accentPills[accentColor]} bg-opacity-40 dark:bg-opacity-10 border ${accentBorders[accentColor]} border-opacity-20 p-4 rounded-2xl max-w-md`}>
                    <span className="text-xl">🚀</span>
                    <p className="text-xs font-semibold leading-relaxed">
                      AI systems have calculated that your retention index performs best during morning workflows.
                    </p>
                  </div>
                </motion.div>

                {/* Tracking Progress Module Block card */}
                <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                <div>
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-200 uppercase tracking-wider">Active Workspace</h3>
                    <div className="mt-4">
                      <p className="font-bold text-base text-slate-900 dark:text-white">
                        {materials && materials.length > 0 ? materials[materials.length - 1].name : "No Active Documents"}
                      </p>
                      <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-full mt-4 overflow-hidden">
                        <div className={`h-full rounded-full ${accentBgs[accentColor]}`} style={{ width: materials && materials.length > 0 ? "100%" : "0%" }} />
                      </div>
                      <div className={`text-right text-xs font-bold ${accentTexts[accentColor]} mt-2`}>
                        {materials && materials.length > 0 ? "Fully Indexed" : "0% Ready"}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab(materials && materials.length > 0 ? "AI Study Coach" : "Upload Materials")}
                    className={`mt-6 w-full h-12 rounded-2xl ${accentBgs[accentColor]} text-white text-xs font-bold transition shadow-md opacity-90 hover:opacity-100`}>
                    {materials && materials.length > 0 ? "Resume AI Study Coach" : "Upload Resources Now"}
                  </button>
                </motion.div>
              </section>

              {/* Status Aggregations Grid Section */}
              <section className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard icon={Flame} title="FOCUS STREAK" value={`${streakCount || 0} ${streakCount === 1 ? 'Day' : 'Days'}`} subtitle="Consistency active"
                  iconBg="bg-orange-50 dark:bg-orange-950/20 text-orange-500" badge={<Flame size={14} className="text-orange-500" />} />
                
                <StatCard 
                  icon={Zap} 
                  title="QUIZZES MASTERED" 
                  value={`${quizzesMasteredCount || 0} ${quizzesMasteredCount === 1 ? 'Set' : 'Sets'}`} 
                  subtitle="Dynamic score history" 
                  iconBg="bg-blue-50 dark:bg-blue-950/20 text-blue-500" 
                  badge={<TrendingUp size={14} className="text-blue-500" />}
                />

                <StatCard icon={Award} title="TOTAL STUDY SCORE" value={`${xp.toLocaleString()} XP`} subtitle={`Rank Level ${computeLevel}`}
                  iconBg="bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500" badge={<span className="px-2 py-0.5 rounded-md
              bg-purple-100 dark:bg-purple-950
              text-purple-700 dark:text-purple-300 text-[10px] font-black">LVL {computeLevel}</span>} />

                <motion.div whileHover={{ y: -4 }} className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <svg className="w-16 h-16 rotate-[-90deg]">
                      <circle cx="32" cy="32" r="26" stroke="#E5E7EB" strokeWidth="6" fill="none" className="dark:stroke-slate-800" />
                      <circle
                        cx="32"
                        cy="32"
                        r={radius}
                        stroke={accentColor === "purple" ? "#7C3AED" : accentColor === "blue" ? "#3B82F6" : accentColor === "cyan" ? "#06B6D4" : accentColor === "green" ? "#10B981" : accentColor === "orange" ? "#F97316" : "#F43F5E"}
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                  />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800 dark:text-white">{weeklyProgressPercent}%</div>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider">Weekly Metric Goal</p>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-0.5">
                      {weeklyProgressPercent >= 100 ? "Goal Met!" : "Progressing"}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Targeting 2,000 XP base</p>
                  </div>
                </motion.div>
              </section>

              {/* Graphical Charts and Analytics Insights Panels */}
              <section className="grid xl:grid-cols-5 gap-6">
                <motion.div whileHover={{ y: -4 }} className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-base font-bold text-slate-800 dark:text-white">Weekly Target Progress</h2>
                    <span className="text-[11px] font-bold text-gray-400 uppercase bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">Realtime Feed</span>
                  </div>
                  <div className="h-[260px] min-h-[260px] text-xs font-medium">
                    <ResponsiveContainer width="100%" height={260}>
                      <AreaChart data={weeklyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="accentFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={accentColor === "purple" ? "#7C3AED" : accentColor === "blue" ? "#3B82F6" : accentColor === "cyan" ? "#06B6D4" : accentColor === "green" ? "#10B981" : accentColor === "orange" ? "#F97316" : "#F43F5E"} stopOpacity={0.2} />
                            <stop offset="100%" stopColor={accentColor === "purple" ? "#7C3AED" : accentColor === "blue" ? "#3B82F6" : accentColor === "cyan" ? "#06B6D4" : accentColor === "green" ? "#10B981" : accentColor === "orange" ? "#F97316" : "#F43F5E"} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" className="dark:stroke-slate-800" />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} stroke="#94A3B8" />
                        <YAxis tickLine={false} axisLine={false} stroke="#94A3B8" />
                        <Tooltip contentStyle={{ background: 'rgb(30, 41, 59)', borderRadius: '12px', color: '#fff', border: 'none' }} />
                        <Area type="monotone" dataKey="value" fill="url(#accentFill)" stroke="none" />
                        <path d="" stroke={accentColor === "purple" ? "#7C3AED" : accentColor === "blue" ? "#3B82F6" : accentColor === "cyan" ? "#06B6D4" : accentColor === "green" ? "#10B981" : accentColor === "orange" ? "#F97316" : "#F43F5E"} strokeWidth={3} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Dynamic AI Automated Insight Alerts */}
                <div className="xl:col-span-2 bg-white dark:bg-slate-900 rounded-[32px] p-6 shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col justify-between">
                  <h2 className="text-base font-bold text-slate-800 dark:text-white mb-4">✨ Intelligent Insights</h2>
                  <div className="space-y-3 flex-1">
                    {insights.map((item, idx) => {
                      const Icon = item.icon;
                      return (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-2xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                            <Icon size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{item.title}</h4>
                            <p className="text-[11px] text-gray-400 dark:text-slate-400 mt-0.5 leading-relaxed">{item.subtitle}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* Component Injection Routing Channels */}
          {activeTab === "Overview" && <OverviewComponent />}
 
          {activeTab === "Smart Quizzes" && <SmartQuizzes setActiveTab={setActiveTab} />}
          {activeTab === "Study Flashcards" && <FlashcardsComponent />}

       {/* 🟢 ADD THIS EXACT LINE HERE */}
{activeTab === "Weak Topic Tracker Page" && <WeakTopicTracker
topicsData = {topicsData}
onUpdateTopic = {handleUpdateTopic}
setActiveTab={setActiveTab} />}
          {activeTab === "AI Study Coach" && (
            <AiCoach activeDocumentName={materials && materials.length > 0 ? materials[materials.length - 1].name : "General Study Guide"} />
          )}
          {activeTab === "Notes Workspace" && <NotesWorkspace/>}
          {activeTab === "Upload Materials" && <MaterialUpload />}
          {activeTab === "Focus Timer" && <FocusTimer />}
          {activeTab === "Study Group" && <StudyGroup />}
          {activeTab === "Settings" && (
            <Settings
              forcedSection={settingsSubSection}
              setForcedSection={setSettingsSubSection}
              setTopbarAvatar={setTopbarAvatar}
            />
          )}
          {activeTab === "Study Planner" && <StudyPlanner/>}
        </main>
        <MaterialPreview />
      </div>
    </motion.div >
  );
}
