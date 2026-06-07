import React, { createContext, useContext, useState, useEffect } from "react";

const AppContext = createContext();

export function AppProvider({ children }) {
  // 🏆 Core profile gamification variables
  const [xp, setXp] = useState(() => parseInt(localStorage.getItem("studybuddy_xp") || "1450", 10));
  const [streak, setStreak] = useState(() => parseInt(localStorage.getItem("studybuddy_streak") || "5", 10));
  const [quizzesMastered, setQuizzesMastered] = useState(() => parseInt(localStorage.getItem("studybuddy_quizzes") || "12", 10));
  const [studyDays, setStudyDays] = useState(() => parseInt(localStorage.getItem("studybuddy_studydays") || "5", 10));

  // 🎨 Theme configuration controls
  const [accentColor, setAccentColor] = useState("purple");
  const [darkMode, setDarkMode] = useState(false);

  // 📁 Document preview manager pipeline
  const [materials, setMaterials] = useState([]);
  const [activePreview, setActivePreview] = useState(null); // Holds { id: "", name: "", url: "", type: "" }

  // 📊 Weekly analytics progress vector streams
  const [weeklyProgress, setWeeklyProgress] = useState(() => {
    const defaultData = [
      { day: "Sun", value: 30 },
      { day: "Mon", value: 45 },
      { day: "Tue", value: 15 },
      { day: "Wed", value: 60 },
      { day: "Thu", value: 20 },
      { day: "Fri", value: 75 },
      { day: "Sat", value: 10 },
    ];
    const stored = localStorage.getItem("studybuddy_weekly_progress");
    if (stored) return JSON.parse(stored);
    localStorage.setItem("studybuddy_weekly_progress", JSON.stringify(defaultData));
    return defaultData;
  });

  // 💾 Keep local disk layouts cleanly synced on mutations
  useEffect(() => {
    localStorage.setItem("studybuddy_xp", xp.toString());
  }, [xp]);

  useEffect(() => {
    localStorage.setItem("studybuddy_streak", streak.toString());
  }, [streak]);

  useEffect(() => {
    localStorage.setItem("studybuddy_quizzes", quizzesMastered.toString());
  }, [quizzesMastered]);

  useEffect(() => {
    localStorage.setItem("studybuddy_studydays", studyDays.toString());
  }, [studyDays]);

  useEffect(() => {
    localStorage.setItem("studybuddy_weekly_progress", JSON.stringify(weeklyProgress));
  }, [weeklyProgress]);

  // --- RECONCILIATION MUTATION FUNCTIONS ---
  
  // Award XP and append value to active chart tracker points
  const awardXp = (amount) => {
    setXp((prev) => prev + amount);
    
    // Add visual scaling bar weight onto current day slot position
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activeDay = dayLabels[new Date().getDay()];
    
    setWeeklyProgress((prevProgress) => {
      return prevProgress.map((item) => {
        if (item.day === activeDay) {
          return { ...item, value: Math.min(item.value + Math.round(amount * 0.3), 100) };
        }
        return item;
      });
    });

    // Sync leaderboard instantly if it exists
    syncLeaderboardXp(xp + amount);
  };

  // Increment completed quiz blocks
  const incrementQuizzesMastered = () => {
    setQuizzesMastered((prev) => prev + 1);
  };

  // Helper method to sync leaderboard rows in real time
  const syncLeaderboardXp = (newTotalXp) => {
    const stored = localStorage.getItem("studybuddy_leaderboard");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const updated = parsed.map(user => {
          if (user.isCurrentUser) {
            return { ...user, xp: newTotalXp, streak };
          }
          return user;
        }).sort((a, b) => b.xp - a.xp);
        localStorage.setItem("studybuddy_leaderboard", JSON.stringify(updated));
      } catch (e) {
        console.error("Leaderboard context background sync error:", e);
      }
    }
  };

  return (
    <AppContext.Provider
      value={{xp,
        streak,
        quizzesMastered,
        studyDays,
        weeklyProgress,
        accentColor,
        setAccentColor,
        darkMode,
        setDarkMode,
        materials,
        setMaterials,
        activePreview,
        setActivePreview,
        awardXp,
        incrementQuizzesMastered,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be utilized safely inside an AppProvider framework wrapper.");
  }
  return context;
}
